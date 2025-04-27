// api/NameBright.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios'
import debugFactory from 'debug'
import qs from 'query-string'

const debug = debugFactory('NameBright')

export interface AuthConfig {
  accountLogin: string
  appName: string
  appSecret: string
}

export interface NameBrightDomainsPage {
  ResultsTotal: number
  CurrentPage: number
  Domains: NameBrightDomain[]
}


export interface NameBrightOpts {
  /** Override API root (default `https://api.namebright.com`). */
  apiUrl?: string
}

export interface NameBrightAccountResponse {
  AccountBalance: number
}

export interface NameBrightNameserversResponse {
  DomainName: string
  NameServers: string[]
}

export interface NameBrightDomain {
  DomainName: string
  Status: string
  ExpirationDate: string
  Locked: boolean
  AutoRenew: boolean
  WhoisPrivacy: boolean
  Category: string
  UpgradedDomain: boolean
  AuthCode: string
}

export interface NameBrightRenewResponse {
  OrderId: number
  TotalPrice: number
  OrderItems: {
    OrderItemId: number
    OrderId: number
    ProductText: string
    TotalPrice: number
  }[]
}

/**
 * Thin wrapper for the NameBright REST API (auto-token, typed, debug-logged).
 */
export class NameBright {
  private readonly auth: AuthConfig
  private readonly apiUrl: string
  private readonly http: AxiosInstance

  /* token cache */
  private token: string | null = null
  private tokenExpires = 0
  private tokenPromise: Promise<string> | null = null

  constructor(auth: AuthConfig, opts: NameBrightOpts = {}) {
    if (!auth.accountLogin || !auth.appName || !auth.appSecret)
      throw new Error('Unknown authentication details for NameBright')

    this.auth = auth
    this.apiUrl = opts.apiUrl ?? 'https://api.namebright.com'

    this.http = axios.create({
      baseURL: this.apiUrl,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      paramsSerializer: (p) => qs.stringify(p)
    })
  }

  /* ---------- public API wrappers ---------- */

  /** GET /rest/account (account summary) */
  async getAccount(): Promise<NameBrightAccountResponse> {
    debug('getAccount')
    return this.request<NameBrightAccountResponse>('get', '/rest/account')
  }

  /** GET /rest/account/domains */
  // async getDomains(page = 1, perPage = 20): Promise<NameBrightDomain[]> {
  //   debug('getDomains', { page, perPage })
  //   return this.request<NameBrightDomain[]>('get', '/rest/account/domains', {
  //     page,
  //     domainsPerPage: perPage
  //   })
  // }

  async getDomains(
    page = 1,
    perPage = 20
  ): Promise<NameBrightDomainsPage> {
    debug('getDomains', { page, perPage })
    return this.request<NameBrightDomainsPage>('get', '/rest/account/domains', {
      page,
      domainsPerPage: perPage
    })
  }

  /** 
   * Async generator that lazily iterates over every domain in the account.
   *
   * ```ts
   * for await (const d of nb.fetchDomains()) {
   *   console.log(d.DomainName)
   * }
   * ```
   *
   * @param perPage  requested page size (NameBright max = 20)
   */
  // put this *inside* the NameBright class body
  public async *fetchDomains(
    perPage = 20
  ): AsyncGenerator<NameBrightDomain, void, unknown> {
    for (let page = 1; ; page++) {
      const { Domains } = await this.getDomains(page, perPage)
      if (!Domains.length) return          // nothing retrieved
      for (const d of Domains) yield d
      if (Domains.length < perPage) return // reached last page
    }
  }

  async getDomain(domain: string): Promise<NameBrightDomain> {
    debug('getDomain', domain)
    return this.request<NameBrightDomain>('get', `/rest/account/domains/${domain}`)
  }

  /** GET /rest/account/domains/:domain/nameservers */
  async getNameservers(domain: string): Promise<string[]> {
    debug('getNameservers', domain)
    const res = await this.request<NameBrightNameserversResponse>('get', `/rest/account/domains/${domain}/nameservers`)
    return res.NameServers
  }

  async deleteNameservers(domain: string): Promise<void> {
    debug('deleteNameservers', domain)
    await this.request('delete', `/rest/account/domains/${domain}/nameservers`)
  }

  async deleteNameserver(domain: string, nameserver: string): Promise<void> {
    debug('deleteNameserver', domain, nameserver)
    await this.request('delete', `/rest/account/domains/${domain}/nameservers/${nameserver}`)
  }

  /** POST /rest/purchase/renew 
   * @see https://api.namebright.com/rest/Help/Api/POST-purchase-renew
   * @param domain - The domain name to renew
   * @param years - The number of years to renew the domain for (min 1 / max 10)
   * @returns NameBrightRenewResponse
  */
  async renewDomain(domain: string, years = 1): Promise<NameBrightRenewResponse> {
    if (years < 1 || years > 10)
      throw new Error('Invalid years: min 1 / max 10 required')
    debug('renewDomain', domain, years)
    return this.request<NameBrightRenewResponse>('post', `/rest/purchase/renew`, {
      DomainName: domain,
      Years: years
    })
  }

  /** PUT nameservers (deletes all first, then adds) */
  async setNameservers(domain: string, nameservers: string[]): Promise<string[]> {
    if (!Array.isArray(nameservers) || nameservers.length < 2 || nameservers.length > 4)
      throw new Error('Invalid nameservers: min 2 / max 4 required')

    // we need to delete all existing nameservers first
    await this.deleteNameservers(domain)

    const applied: string[] = []
    for (const ns of nameservers) {
      debug('setNameserver', domain, ns)
      const res = await this.request(
        'put',
        `/rest/account/domains/${domain}/nameservers/${ns}`
      )
      if (res === ns) applied.push(ns) // API echoes string
    }
    return applied
  }

  /** 
   * Get the underlying Axios instance to make raw requests. 
   * This instance handles token fetching and caching 
   * @returns AxiosInstance
   * */
  getClient(): AxiosInstance {
    return this.http
  }

  /* ---------- internals ---------- */

  /** Low-level helper (adds token, logs). */
  private async request<T = any>(
    method: Method,
    endpoint: string,
    data: Record<string, any> = {}
  ): Promise<T> {
    const cfg: AxiosRequestConfig = {
      method,
      url: endpoint,
      headers: { Authorization: `Bearer ${await this.getToken()}` }
    }

    if (method.toLowerCase() === 'get') cfg.params = data
    else cfg.data = qs.stringify(data)

    debug('HTTP >', cfg.method?.toUpperCase(), cfg.url, data)
    const { data: res } = await this.http.request<T>(cfg)
    debug('HTTP <', res)
    return res
  }

  /** Cached token (single-flight). */
  private async getToken(): Promise<string> {
    const valid = this.token && Date.now() < this.tokenExpires - 60_000
    if (valid) return this.token as string
    if (this.tokenPromise) return this.tokenPromise

    this.tokenPromise = this.fetchToken()
    try {
      return await this.tokenPromise
    } finally {
      this.tokenPromise = null
    }
  }

  /** POST /auth/token */
  private async fetchToken(): Promise<string> {
    debug('fetchToken')
    const body = qs.stringify({
      grant_type: 'client_credentials',
      client_id: `${this.auth.accountLogin}:${this.auth.appName}`,
      client_secret: this.auth.appSecret
    })

    const { data } = await this.http.post('/auth/token', body)
    const { access_token, expires_in = 3600 } = data || {}
    if (!access_token) throw new Error('Unable to obtain token')

    this.token = access_token
    this.tokenExpires = Date.now() + expires_in * 1000
    debug('token acquired (expires in %ds)', expires_in)
    return access_token
  }
}