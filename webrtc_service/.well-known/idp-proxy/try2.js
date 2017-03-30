
    function getAssertion(){

        fetch('http://localhost:4041/assertion/', {
            method: 'get'
        }).then(function(response) {

            return response.json

        }).catch(function(err) {
            //'Error :(
        });
    }

    function getAssertionById(id){

        fetch('http://localhost:4041/assertion/'+id, {
            method: 'get'
        }).then(function(response) {
            return response

        }).catch(function(err) {

            //'Error :(
        });

    }

    function addAssertion(content){

        fetch('http://localhost:4041/assertion/', {
            method: 'POST',
            headers: {
                //'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "content": content
            })

        }).then(function (data) {
            console.log('Request success: ', data);
            return data
        })
            .catch(function (error) {
                console.log('Request failure: ', error);
            });

    }

    /*
    ******************************
    Generate & Validate assertion
    ******************************
     */



    var idp = {

        generateAssertion: (contents , origin) => {

            return  new Promise(function (resolve, reject) {

                // call addAssertion
                addAssertion();

            }).then(function(data) {
                /*
                 * specification
                 *  DomString*/

                JSON.stringify(data);

            }).catch(function(err) {
                /* error :( */
                console.log('error')
                throw err;
            })


        },


        validateAssertion: (assertion, origin) => {

            // return assertion
            getAssertionById(assertion)

                .then(function(response) {
                return Promise.resolve();


                }).catch(function(err) {

                console.log(err)
            })

        }

    };


    if (typeof rtcIdentityProvider != 'undefined') {
        rtcIdentityProvider.register(idp);
        console.log("Proxy loaded")
    } else {
        console.warn('IdP not running in the right sandbox');
    }









