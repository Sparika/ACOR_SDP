var mongoose   = require ('mongoose');

var zoneSchema = mongoose.Schema
({
        service  : String,
        idp      : String,
        zone     : {White:Boolean,Grey:Boolean,Black:Boolean}
    },
    {collection:'zone'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
);


// create a model of zone
var zone = module.exports = mongoose.model('zone',zoneSchema);

//item zone
var item = {
    service   :'xx',
    idp       :'xxx',
    zone    : {White:1,Grey:0,Black:0}
};

module.exports.addzone = function (x) {
    var zoning = new zone(x);
    zoning.save(function (err) {
        console.log("zone added with sucess!");
        if(err){
            console.error(err)
        }
    })
};



// create a model of SpitCall

