function getAssertionById(id) {
    return fetch('http://localhost:4041/assertion/' + id, {
        method: 'get',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
function addAssertion(content) {
    return fetch('http://localhost:4041/assertion/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'content': content
        })
    })
}



/*
 **
 Generate & Validate assertion
 **
 */

var idp = {
    generateAssertion: (contents, origin) => {
        return addAssertion(contents).then(function (data) {
            console.log(data)
            return data.json()
        }).then(function (data) {
            var obj = {
                idp: {
                    domain: 'localhost:4041',
                    protocol: 'local.js'
                },
                assertion: btoa(JSON.stringify(data))
            };
            return JSON.stringify(obj);
        }).catch (function (err) {
            console.log('promise rejected !');
            throw err;
        })
    },
    validateAssertion: (assertion, origin) => {
        var json = JSON.parse(assertion)
        var toVerify = atob(json.assertion)
        console.log(toVerify)
        var jsonToVerify = JSON.parse(toVerify)
        console.log(jsonToVerify)
        return getAssertionById(jsonToVerify._id).then(function (data) {
            return data.json()
        }).then(function (json) {
            console.log(json);
            return json;
        }).catch (function (err) {
            console.log(err)
        })
    }
};
if (typeof rtcIdentityProvider != 'undefined') {
    rtcIdentityProvider.register(idp);
    console.log('Proxy loaded')
} else {
    console.warn('IdP not running in the right sandbox');
}

