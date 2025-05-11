import { AxiosInstance } from 'axios';
export interface AuthConfig {
    accountLogin: string;
    appName: string;
    appSecret: string;
}
export interface NameBrightDomainsPage {
    ResultsTotal: number;
    CurrentPage: number;
    Domains: NameBrightDomain[];
}
export interface NameBrightOpts {
    /** Override API root (default `https://api.namebright.com`). */
    apiUrl?: string;
}
export interface NameBrightAccountResponse {
    AccountBalance: number;
}
export interface NameBrightNameserversResponse {
    DomainName: string;
    NameServers: string[];
}
export interface NameBrightDomain {
    DomainName: string;
    Status: string;
    ExpirationDate: string;
    Locked: boolean;
    AutoRenew: boolean;
    WhoisPrivacy: boolean;
    Category: string;
    UpgradedDomain: boolean;
    AuthCode: string;
}
export interface NameBrightRenewResponse {
    OrderId: number;
    TotalPrice: number;
    OrderItems: {
        OrderItemId: number;
        OrderId: number;
        ProductText: string;
        TotalPrice: number;
    }[];
}
/**
 * Thin wrapper for the NameBright REST API (auto-token, typed, debug-logged).
 */
export declare class NameBright {
    readonly alias: string;
    private readonly auth;
    private readonly apiUrl;
    private readonly http;
    private token;
    private tokenExpires;
    private tokenPromise;
    constructor(auth: AuthConfig, opts?: NameBrightOpts, alias?: string);
    /** GET /rest/account (account summary) */
    getAccount(): Promise<NameBrightAccountResponse>;
    /** GET /rest/account/domains */
    getDomains(page?: number, perPage?: number): Promise<NameBrightDomainsPage>;
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
    fetchDomains(perPage?: number): AsyncGenerator<NameBrightDomain, void, unknown>;
    getDomain(domain: string): Promise<NameBrightDomain>;
    /** GET /rest/account/domains/:domain/nameservers */
    getNameservers(domain: string): Promise<string[]>;
    deleteNameservers(domain: string): Promise<void>;
    deleteNameserver(domain: string, nameserver: string): Promise<void>;
    /** POST /rest/purchase/renew
     * @see https://api.namebright.com/rest/Help/Api/POST-purchase-renew
     * @param domain - The domain name to renew
     * @param years - The number of years to renew the domain for (min 1 / max 10)
     * @returns NameBrightRenewResponse
    */
    renewDomain(domain: string, years?: number): Promise<NameBrightRenewResponse>;
    /** PUT nameservers (deletes all first, then adds) */
    setNameservers(domain: string, nameservers: string[]): Promise<string[]>;
    /**
     * Get the underlying Axios instance to make raw requests.
     * This instance handles token fetching and caching
     * @returns AxiosInstance
     * */
    getClient(): AxiosInstance;
    /** Low-level helper (adds token, logs). */
    private request;
    /** Cached token (single-flight). */
    private getToken;
    /** POST /auth/token */
    private fetchToken;
}
//# sourceMappingURL=index.d.ts.map