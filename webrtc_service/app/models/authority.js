
var mongoose   = require ('mongoose');
var zone = require('../models/zone.js')
var spit = require('../models/spit.js')

var ObjectId = require('mongoose');
var ObjectId = require('mongoose');

var lr=0;
var Mr=0;
var Rt=0;
var score =0;
var service_auth ='';
var Pspit;
var id =0 ;
var rt= 0;

// create schemas data for authority

var AuthoritySchema = mongoose.Schema
({
        service  : String,
        idp      : String,
        algo     : String,
        score    : Number
    },

    {collection:'authority'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
);

// create and export a model of authority
var authority = module.exports = mongoose.model('authority',AuthoritySchema);

// add authority
module.exports.addauthority = function (x) {
    var auth = new authority(x);
    auth.save(function (err) {
        console.log("added with sucess!");
        if(err){
            console.error(err)
        }
    })
};

// get service

/*module.exports.getservice = function () {
    authority.find({}, {service: 1, _id: 0}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));
        //console.log('the second display: '+ data[0].tag.service)

        //get spit and add zone
        // item of zone

        for (var id in data){
         console.log(data[id].tag.service)

            /*if(data[id].service !== data[id+1].service){

             console.log('il ya diference')
            }

            else {
                console.log('no diference matching')
            }

         }



    });
}*/

//authority.find({},{_id:1}).limit(1).sort({$natural:-1})

module.exports.get_service = function () {
    var item1
    authority.find({},{_id:1}, function (err, data) {

        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));
        id = JSON.stringify(data);

        console.log(id)
        //service_auth = data[0].service;

       /* item1 = {
            service: data[0].service,
            score: data[0].score
        };

        service_auth = item1.service
        console.log(service_auth);*/

    }).limit(1).sort({$natural:-1});
};





module.exports.get_score_service = function () {
    var item1
    authority.find({}, {service: 1, score: 1, _id: 0}, function (err, data) {
        if (err) throw err
        // console.log(">>>> " + JSON.stringify(data));

        //service_auth = data[0].service;

        if (typeof data[0] !== 'undefined' || typeof data[1] !== 'undefined') {


            item1 = {
                service : data[0].service,
                score   : data[0].score
            };

            service_auth = item1.service;
            score = item1.score;
            console.log(service_auth);
            console.log(score);
        }
    });


    spit.find({}, {'tag.service': 1, 'tag.score': 1, lr: 1, Mr: 1, Rt: 1}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));

        for (var id in data) {
            //if(service_auth === data[id].tag.service){
            //;
            console.log('---------------')
            //console.log(service_auth);
            //console.log(data[id].tag.service)
            console.log('---------------')

            Mr = Mr + data[id].Mr;
            lr = lr + data[id].lr;
            Rt = Rt + data[id].Rt

        }


        var plr = lr * score + 1;
        var pMr = Mr * score + 1;

        console.log(typeof(plr) + '' + plr + '---------' + typeof(pMr) + '' + pMr);


        Pspit = 1 / (1 + ((lr * score + 1) / (Mr * score + 1)));
        //Pspit = 1.39;
        console.log(Mr + '-----' + lr + '---------' + Rt + '' + 'socre' + score + '' + Pspit);

        if (typeof data[0] === 'undefined' || typeof data[0] === 'undefined') {
            // does not exist

            var item1 = {

                service: 'localhost',
                idp: 'localhost',
                algo: 'algo',
                score: 0.5

            }


            console.log(item1)

            var auth = new authority(item1);
            auth.save(function (err) {
                console.log("added with sucess!");
                if (err) {
                    console.error(err)
                }
            })

        }
        else {
            // does exist


            var item = {

                service: data[0].tag.service,
                idp: data[0].tag.service,
                algo: 'algo',
                score: Pspit

            }

            console.log(item)

            var auth = new authority(item);
            auth.save(function (err) {
                console.log("added with sucess!");
                if (err) {
                    console.error(err)
                }
            })

        }

    });


// get rt


   var promis =  spit.find({}, {Rt: 1}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));
        for (var id in data) {
            rt += data[0].Rt
//            console.log(data);
           // console.log(id+''+rt)            //console.log(service_auth);
            //console.log(data[id].tag.service)
            //console.log('---------------')
        }
        console.log(rt);
    });




    promis.then(function () {

        console.log(rt+'_inside')
        if(rt <= 2){


            spit.find({}, {"tag.service": 1,"tag.idp":1,_id: 0 }, function (err, data) {
                if (err) throw err
                console.log(">>>> " + JSON.stringify(data));
                //console.log('the second display: '+ data[0].tag.service)

                //get spit and add zone
                // item of zone

                //for (var id in data){
                //  console.log(data[id].tag.service)

//            }


                if (typeof data[0] === 'undefined' || typeof data[0] === 'undefined'){
                    console.log('not ready')
                }
                else {


                    var item = {
                        service   :data[0].tag.service,
                        idp       :data[0].tag.idp,
                        zone    : {White:0,Grey:1,Black:0}
                    };
                console.log(item)
                zone.addzone(item)
                console.log('-----added in grey zone-----')

                }

            });
        }


        if(rt >= 4) {
            spit.find({ }, {"tag.service": 1,"tag.idp":1,_id: 0 }, function (err, data) {
                if (err) throw err
                console.log(">>>> " + JSON.stringify(data));
                //console.log('the second display: '+ data[0].tag.service)

                //get spit and add zone
                // item of zone

               // for (var id in data){
                 //   console.log(data[id].tag.service)
                //}
                    if (typeof data[0] === 'undefined' || typeof data[0] === 'undefined'){
                        console.log('note ready')
                    }else {


                    var item = {
                        service   :data[id].tag.service,
                        idp       :data[id].tag.idp,
                        zone    : {White:0,Grey:0,Black:1}
                    };
                    console.log('item added')
                    zone.addzone(item)
                    console.log('added in Black zone')
                    }

            });
        }

    })
}



// add in zone



















module.exports.update = function () {


    authority.findOne({ 'id': id }, function (err, todo) {
        // Handle any possible database errors
        if (err) {
            console.log('err')
        } else {
            // Update each attribute with any possible attribute that may have been submitted in the body of the request
            // If that attribute isn't in the request body, default back to whatever it was before.
            todo.score = Pspit;
            /*todo.description = req.body.description || todo.description;
            todo.price = req.body.price || todo.price;
            todo.completed = req.body.completed || todo.completed;*/

            // Save the updated document back to the database
            todo.save(function (err, todo) {
                if (err) {
                    console.log(err)
                }
                console.log(todo)
            });
        }
    });






}