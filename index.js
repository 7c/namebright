var debug = require('debug')('NameBright')
var axios = require('axios')
var qs = require('query-string')
var apiUrl = 'https://api.namebright.com'

class NameBright {
    constructor(auth) {
        this.auth = auth
        this.token = false
        if (!auth.hasOwnProperty('accountLogin') || !auth.hasOwnProperty('appName') ||!auth.hasOwnProperty('appSecret'))
            throw new Error('Unknown authentication details for NameBright')
        
    }

    // https://api.namebright.com/rest/Help/Api/GET-account-domains_page_domainsPerPage
    async getDomains(token,page=1,domainsPerPage=20) {
        var that = this
        debug(`getDomains(token,${page},${domainsPerPage})`)
        return new Promise(async function (resolve,reject) {
            try {
                var res = await that.doRequest('get','/rest/account/domains',{
                    page,
                    domainsPerPage
                },{
                    headers:{Authorization:`Bearer ${token}`}
                })
                // console.log(res)
                // process.exit(0)
                resolve(res)
            }catch(err) { reject(err)}
        })
    }

    // https://api.namebright.com/rest/Help/Api/GET-account-domains-domain-nameservers
    async getNameservers(token,domain) {
        var that = this
        return new Promise(async function (resolve,reject) {
            try {
                var res = await that.doRequest('get',`/rest/account/domains/${domain}/nameservers`,{
                },{headers:{Authorization:`Bearer ${token}`}})
                resolve(res)
            }catch(err) { reject(err)}
        })
    }

    // https://api.namebright.com/rest/Help/Api/PUT-account-domains-domain-nameservers-nameServer
    async setNameservers(token,domain,nameservers) {
        
        var that = this
        return new Promise(async function (resolve,reject) {
            if (!nameservers || typeof nameservers!=='object' || nameservers.lenght<2 || nameservers.lenght>2) 
                return reject('invalid nameservers, array of minimum 2, maximum  4 nameservers are required')
            try {
                // we first need to delete all nameservers ! crazy!!
                // https://api.namebright.com/rest/Help/Api/DELETE-account-domains-domain-nameservers
                var res = await that.doRequest('delete',`/rest/account/domains/${domain}/nameservers`,{
                },{headers:{Authorization:`Bearer ${token}`}})
                console.log(`NS deleted:`,res)
                if (res && res.hasOwnProperty('DomainName') && res.hasOwnProperty('NameServers') && res.NameServers.length==0) {
                    debug(`All nameservers for ${domain} are deleted`)
                    // then add new nameservers 1 by 1
                    var setNameservers=[]
                    for(var ns of nameservers) {
                        try {
                            debug(`setting nameserver ${ns}`)
                            var res = await that.doRequest('put',`/rest/account/domains/${domain}/nameservers/${ns}`,{
                            },{headers:{Authorization:`Bearer ${token}`}})
                            if (res===ns) setNameservers.push(res)
                        }catch(err2) {
                            // ignore
                        }
                    }
                    resolve(setNameservers)
                }
                
                
                // resolve(res)
            }catch(err) { reject(err)}
        })
    }

    async connect() {
        var auth = this.auth
        var that = this
        return new Promise(async function (resolve,reject) {
            
            // get a token
            try {
                var token = await that.doRequest('post','/auth/token',{
                    grant_type:'client_credentials',
                    client_id:`${auth.accountLogin}:${auth.appName}`,
                    client_secret:auth.appSecret
                })
                debug(`token=`,token)
                if (token && token.hasOwnProperty('access_token'))
                    return resolve(token.access_token)
            
                // unexpected response
                debug(`unexpected response from token`)
                reject(token)
            }
            catch(err) {
                debug(`Exception inside connect:`,err)
                reject(err)
            }
            // resolve(token)    
        })
        
    }

    doRequest(method,endpoint,data={},AdditionalAxiosOptions={}){
        var that = this
        debug(`doRequest ${method} ${endpoint}`)
        return new Promise(async function (resolve,reject) {
            var { headers } = AdditionalAxiosOptions
            if (method==='get') {
                if (Object.keys(data).length>0) endpoint=`${endpoint}?${qs.stringify(data)}`
            } else data = qs.stringify(data)
            try {
                var res = await axios({
                    method,
                    url: apiUrl+endpoint,
                    data,
                    headers
                })
                // console.log(res.request)
                resolve(res.data)
            }
            catch(err) {
                reject(err)
            }
            
        })
    }
}

module.exports = NameBright