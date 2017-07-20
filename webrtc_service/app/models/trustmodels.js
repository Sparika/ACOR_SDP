var mongoose   = require ('mongoose');

// connect to the  passport db
var configDB = require('../../config/database.js');
mongoose.connect(configDB.url);

//=======================================
//**************model of classes*********
//=======================================

// create schemas data for authority

var AuthoritySchema = mongoose.Schema
({
    service  : String,
    idp      : String,
    algo     : String},
    {collection:'authority'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
    );

// create and export a model of authority

var authority = module.exports = mongoose.model('authority',AuthoritySchema);

//item authority

var item = {
    service   :'export',
    idp       :'xxx',
    algo      : 'xx',
    };


// add and export authority function

module.exports.authority = function addAuthority(x) {
    var auth = new authority(x);
    auth.save();
};

// call add authority function
//addAuthority(item);

// get authority function
function getauthority() {
    authority.find({}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + data);
    });
}
// call get authority function
//getauthority();


/*---------------------
* SpitCall Model
* ---------------------*/


// SpitCall Schema

var SpitCallSchema = mongoose.Schema
({
        tag       : {service:String,idp: String, algo:String,score:Number},
        Feedback  : Number,
        Date      : Date,
        callTime  : Number,
        //lr        : Number,
        //Mr        : Number
                            },
    {collection:'spitcall'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
);

// create a model of SpitCall
var spitcall = module.exports = mongoose.model('spitcall',SpitCallSchema);

//item SpitCall

var item = {
    tag       :{service:"x",idp:"xx",algo:"algo",score:1},
    Feedback  : 1,
    Date      : Date.now(),
    callTime  : 12,
    //lr:     0,
    //MR:0
};

// add spitcall



module.exports.spitcall = function updatespit(update){

    var query = {Feedback : 1},
        options = { new: true, setDefaultsOnInsert: true };

// Find the document
    spitcall.findOneAndUpdate(query, update, options, function(error, result) {
        if (error) return;

        else
        {console.log(result)}
        // do something with the document
    });


}













module.exports.spitcall = function addspitcall(x) {
    var spit = new spitcall(x);
    spit.save();
    console.log("added with sucess!")
};

function addspitcall(x) {
    var spit = new spitcall(x);
    spit.save();
    console.log("added with sucess!")
};


addspitcall(item);

//get SpitCall
function getspitcall() {
    spitcall.find({}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + data);
    });
}

//getspitcall();

/*----------------------
 * zone Model
 * ---------------------*/
var zoneSchema = mongoose.Schema
({
        service  : String,
        idp      : String,
        zoning     : {whitezone:Boolean,greyzone:Boolean,blackzone:Boolean}
    },
    {collection:'zone'}
    // in default mongo when create a collection add 's' in the last
    // so we define the name of collection without 's'
);


// create a model of zone
var zone =  mongoose.model('zone',zoneSchema);

//item zone

var item = {
    service   :'xx',
    idp       :'xxx',
    zoning    : {whitzone:1,greyzone:0,blackzone:0}
};


// add zone function
function addzone(x) {
    var z = new zone(x);
    z.save();
    console.log('added with success')
}

//addzone(item);

// get zone function

function getzone() {
    zone.find({}, function (err, data) {
        if (err) throw err
        console.log(">>>> " + data);
    });
}

//getzone();

