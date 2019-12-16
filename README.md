# NameBright API
this is bare minimum implementation but very good start for many purphoses in order to work with NameBright Domains API.

- API Documentation at https://api.namebright.com/rest/Help
- Examples at https://github.com/NameBright/DomainApiClientExamples
- Access to API Requires special authorization from Registrar

This Library works with their RESTful API Backend

## Bash Examples
might be useful sometimes as reference
[https://github.com/NameBright/DomainApiClientExamples/blob/master/BashCurl/exampleapiscript.sh]

## IP Restriction
you might get `400 Usage Violation` if you have not added a whitelisted ip inside your account at [https://www.namebright.com/Settings#Api], so IP Whitelisting seems to be mandatory


## Installation
`npm i namebright --save`

## Usage
```
var NameBright = require('namebright')

var api = new NameBright({
            accountLogin:'<.. your account username ..>',
            appName:'<.. Name of your App..>',
            appSecret:'<.. Given Secret .>'
})

// we will need this token everywhere
var token = await api.connect()
```

# Methods
## connect():Promise
this does return a OAUTH token which will be required in all subsequent requests towards NameBright API

## getNameservers(token,domain):Promise
returns Nameservers of given domain as object
```

var ns = await api.getNameservers(token,'example.net')

// returns
{ DomainName: 'example.net',
  NameServers:
   [ 'yournameserver1.com',
     'yournameserver2.com',
     'yournameserver3.com',
     'yournameserver4.com' ] }
```

## setNameservers(token,domain,nameservers):Promise
expects minimum nameservers inside nameservers array to be submitted. The way NB API is implemented is, that we first need to delete all Nameservers assigned to that domain with DELETE method then add namevers 1 by 1. Maximum 4 nameservers are allowed at NB. Make sure to capture all errors on this specific wrapper which does multiple API operations. 
```
var setResponse = await api.setNameservers(token,'taxproject.com',['ns-124.awsdns-15.com','ns-964.awsdns-56.net','ns-1203.awsdns-22.org','ns-1736.awsdns-25.co.uk'])
if (setResponse && setResponse.length==4) {
            console.log(`Nameservers were set properly as : ${setResponse.join(',')}`)
} else {
    // some or all nameservers are not set
    // your domain might be without a nameserver!
}
```
this api call might reject or return a all or parts of the namervers as an array. Ideally you should get same amount of nameservers back as your input. If you have submitted 4 and returned 3, this means only 3 nameservers could be set. I implemented this way because once we have successfully deleted all nameservers, we should try to insert as many nameservers as possible. You at your code check how many could indeed be set. You might also call getNameservers method to verify but this is an extra call

## getDomains(token,page=1,domainsPerPage=20):Promise
this will fetch $domainsPerPage domains per page starting from page $page. NB allows maximum 100 domains per page, this snippet might be useful to fetch all domains from your account:
```
// list all domains in account
var page=1
var domainsPerPage=33
var allDomains=[]
while(true) {
    console.log(`Reading ${domainsPerPage} domains from page ${page}`)
    var domains = await api.getDomains(token,page,domainsPerPage)
    if (domains && domains.hasOwnProperty('Domains') && domains.Domains.length>0)
    {
        allDomains=allDomains.concat(domains.Domains)
        if (domains.CurrentPage*domainsPerPage<domains.ResultsTotal) {
            page++
            continue
        }
    }
    console.log(`Read ${allDomains.length} domains from Namebright`)
    break
}
```


# Debugging
I am using internally the `debug` package for debugging purphoses. You will see more details if DEBUG= env variable has been set
```
DEBUG=* node <yourcode.js>
// or
DEBUG=Name* node <yourcode.js>
```