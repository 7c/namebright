"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameBright = void 0;
// api/NameBright.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = __importDefault(require("axios"));
const debug_1 = __importDefault(require("debug"));
const query_string_1 = __importDefault(require("query-string"));
const debug = (0, debug_1.default)('NameBright');
/**
 * Thin wrapper for the NameBright REST API (auto-token, typed, debug-logged).
 */
class NameBright {
    constructor(auth, opts = {}) {
        var _a;
        /* token cache */
        this.token = null;
        this.tokenExpires = 0;
        this.tokenPromise = null;
        if (!auth.accountLogin || !auth.appName || !auth.appSecret)
            throw new Error('Unknown authentication details for NameBright');
        this.auth = auth;
        this.apiUrl = (_a = opts.apiUrl) !== null && _a !== void 0 ? _a : 'https://api.namebright.com';
        this.http = axios_1.default.create({
            baseURL: this.apiUrl,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            paramsSerializer: (p) => query_string_1.default.stringify(p)
        });
    }
    /* ---------- public API wrappers ---------- */
    /** GET /rest/account (account summary) */
    async getAccount() {
        debug('getAccount');
        return this.request('get', '/rest/account');
    }
    /** GET /rest/account/domains */
    // async getDomains(page = 1, perPage = 20): Promise<NameBrightDomain[]> {
    //   debug('getDomains', { page, perPage })
    //   return this.request<NameBrightDomain[]>('get', '/rest/account/domains', {
    //     page,
    //     domainsPerPage: perPage
    //   })
    // }
    async getDomains(page = 1, perPage = 20) {
        debug('getDomains', { page, perPage });
        return this.request('get', '/rest/account/domains', {
            page,
            domainsPerPage: perPage
        });
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
    fetchDomains() {
        return __asyncGenerator(this, arguments, function* fetchDomains_1(perPage = 20) {
            for (let page = 1;; page++) {
                const { Domains } = yield __await(this.getDomains(page, perPage));
                if (!Domains.length)
                    return yield __await(void 0); // nothing retrieved
                for (const d of Domains)
                    yield yield __await(d);
                if (Domains.length < perPage)
                    return yield __await(void 0); // reached last page
            }
        });
    }
    async getDomain(domain) {
        debug('getDomain', domain);
        return this.request('get', `/rest/account/domains/${domain}`);
    }
    /** GET /rest/account/domains/:domain/nameservers */
    async getNameservers(domain) {
        debug('getNameservers', domain);
        const res = await this.request('get', `/rest/account/domains/${domain}/nameservers`);
        return res.NameServers;
    }
    async deleteNameservers(domain) {
        debug('deleteNameservers', domain);
        await this.request('delete', `/rest/account/domains/${domain}/nameservers`);
    }
    async deleteNameserver(domain, nameserver) {
        debug('deleteNameserver', domain, nameserver);
        await this.request('delete', `/rest/account/domains/${domain}/nameservers/${nameserver}`);
    }
    /** POST /rest/purchase/renew
     * @see https://api.namebright.com/rest/Help/Api/POST-purchase-renew
     * @param domain - The domain name to renew
     * @param years - The number of years to renew the domain for (min 1 / max 10)
     * @returns NameBrightRenewResponse
    */
    async renewDomain(domain, years = 1) {
        if (years < 1 || years > 10)
            throw new Error('Invalid years: min 1 / max 10 required');
        debug('renewDomain', domain, years);
        return this.request('post', `/rest/purchase/renew`, {
            DomainName: domain,
            Years: years
        });
    }
    /** PUT nameservers (deletes all first, then adds) */
    async setNameservers(domain, nameservers) {
        if (!Array.isArray(nameservers) || nameservers.length < 2 || nameservers.length > 4)
            throw new Error('Invalid nameservers: min 2 / max 4 required');
        // we need to delete all existing nameservers first
        await this.deleteNameservers(domain);
        const applied = [];
        for (const ns of nameservers) {
            debug('setNameserver', domain, ns);
            const res = await this.request('put', `/rest/account/domains/${domain}/nameservers/${ns}`);
            if (res === ns)
                applied.push(ns); // API echoes string
        }
        return applied;
    }
    /**
     * Get the underlying Axios instance to make raw requests.
     * This instance handles token fetching and caching
     * @returns AxiosInstance
     * */
    getClient() {
        return this.http;
    }
    /* ---------- internals ---------- */
    /** Low-level helper (adds token, logs). */
    async request(method, endpoint, data = {}) {
        var _a;
        const cfg = {
            method,
            url: endpoint,
            headers: { Authorization: `Bearer ${await this.getToken()}` }
        };
        if (method.toLowerCase() === 'get')
            cfg.params = data;
        else
            cfg.data = query_string_1.default.stringify(data);
        debug('HTTP >', (_a = cfg.method) === null || _a === void 0 ? void 0 : _a.toUpperCase(), cfg.url, data);
        const { data: res } = await this.http.request(cfg);
        debug('HTTP <', res);
        return res;
    }
    /** Cached token (single-flight). */
    async getToken() {
        const valid = this.token && Date.now() < this.tokenExpires - 60000;
        if (valid)
            return this.token;
        if (this.tokenPromise)
            return this.tokenPromise;
        this.tokenPromise = this.fetchToken();
        try {
            return await this.tokenPromise;
        }
        finally {
            this.tokenPromise = null;
        }
    }
    /** POST /auth/token */
    async fetchToken() {
        debug('fetchToken');
        const body = query_string_1.default.stringify({
            grant_type: 'client_credentials',
            client_id: `${this.auth.accountLogin}:${this.auth.appName}`,
            client_secret: this.auth.appSecret
        });
        const { data } = await this.http.post('/auth/token', body);
        const { access_token, expires_in = 3600 } = data || {};
        if (!access_token)
            throw new Error('Unable to obtain token');
        this.token = access_token;
        this.tokenExpires = Date.now() + expires_in * 1000;
        debug('token acquired (expires in %ds)', expires_in);
        return access_token;
    }
}
exports.NameBright = NameBright;
//# sourceMappingURL=index.js.map