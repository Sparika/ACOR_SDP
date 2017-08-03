var mongoose   = require ('mongoose');
var zone = require('../models/zone.js')

var SpitCallSchema = mongoose.Schema
({
        tag       : {service:String,idp: String, algo:String,score:Number},
        Feedback  : Number,
        Date      : Date,
        callTime  : Number,
        lr        : Number,
        Mr        : Number,
        Rt        : Number
    },
    {collection:'spitcall'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
);


// create a model of SpitCall
var spitcall = module.exports = mongoose.model('spitcall',SpitCallSchema);


module.exports.addspit = function (x) {
    var spit = new spitcall(x);

    spit.save(function (err) {
        console.log("added with sucess!");
        if(err){
            console.error(err)
        }
    })
};




module.exports.updatespitcall = function (update){

    //var query = {Feedback : 1},
    var query = {$or : [{Feedback : 1},{Feedback : -1}]},
        options = {upsert: true, new: true, setDefaultsOnInsert: true };



// Find the document
    spitcall.findOneAndUpdate(query, update, options, function(error, result) {
        if (error) return;

        else
        {console.log(result)}
        // do something with the document
    });


}









//get SpitCall
module.exports.getspitcall = function () {
    spitcall.find({}, {"tag.service": 1,"tag.idp":1,_id: 0 }, function (err, data) {
        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));
        //console.log('the second display: '+ data[0].tag.service)

        //get spit and add zone
        // item of zone

        for (var id in data){
            console.log(data[id].tag.service);


        var item = {
            service   :data[id].tag.service,
            idp       :data[id].tag.idp,
            zone    : {White:0,Grey:1,Black:0}
        };
        console.log('item added')
        zone.addzone(item)
        console.log('added in Grey zone')
        }
    });


    spitcall.find({ Rt: 6 }, {"tag.service": 1,"tag.idp":1,_id: 0 }, function (err, data) {
        if (err) throw err
        console.log(">>>> " + JSON.stringify(data));
        //console.log('the second display: '+ data[0].tag.service)

        //get spit and add zone
        // item of zone

        for (var id in data){
            console.log(data[id].tag.service)


            var item = {
                service   :data[id].tag.service,
                idp       :data[id].tag.idp,
                zone    : {White:0,Grey:0,Black:1}
            };
            console.log('item added')
            zone.addzone(item)
            console.log('added in grey zone')
        }


    });






}


/*
 module.exports.spitcall = function addspitcall(x) {
 var spit = new spitcall(x);
 spit.save();
 console.log("added with sucess!")
 };
 */

