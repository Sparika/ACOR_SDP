/**
 * Created by root on 27/03/17.
 */


var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function getAssertion(){

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {

        if (xhttp.readyState == 4 && xhttp.status == 200) {

            var res = JSON.parse(xhttp.responseText);
            console.log(res);
        }
    };
    xhttp.open("GET", 'http://localhost:4041/assertion' , true);
    xhttp.send();
}

function getAssertionById(){

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {

        if (xhttp.readyState == 4 && xhttp.status == 200) {

            var res = JSON.parse(xhttp.responseText);
            console.log(res);
        }
    };
    xhttp.open("GET", 'http://localhost:4041/assertion/:id' , true);
    xhttp.send();
}

function addAssertion(){

    var data = {"content": "im john smith"};
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            //console.log(JSON.stringify(data));
        }
    };
    xhttp.open("POST", "http://localhost:4041/assertion");
    xhttp.setRequestHeader("cache-control", "no-cache");
    xhttp.setRequestHeader("content-type", "application/json");
    xhttp.send(JSON.stringify(data));
}

addAssertion();
//console.log('addAssertion');
//console.log(addAssertion());
//console.log(getAssertionById());
console.log(getAssertion());

var idp = {

generateAssertion: (contents , origin) => {

    // TODO : sign contents in the Id Token

    return new Promise((resolve, reject) =>

    //add assertion
        addAssertion()

            .then(asser => {
                console.log('assertion added '+ asser)
                .catch(error => {
                        console.log('not assertion found')
                })
            })

    )},

    validateAssertion: (assertion, origin) => {

        //TODO there is probably a better way to do that?

        // return assertion
        return getAssertionById()

            .then(result => {
                if (!result) return Promise.reject('Invalid signature on identity assertion') //reject

                else {

                    // on va retouner l'id de l'assertion de la base de donnée ?

                    // je pense il faut une methode getAssertionBycontent?
                    return Promise.resolve('ok') //resolve
                }})
            .catch(error => reject({'no match':+error}));

    }


};

if (typeof rtcIdentityProvider != 'undefined') {
    rtcIdentityProvider.register(idp);
    console.log("Proxy loaded")
} else {
    console.warn('IdP not running in the right sandbox');
}









