

var mongoose   = require ('mongoose');

var User       = require('./user');


var idAssertion = mongoose.Schema({ // data schemas
    user: {type:String ,required:true},
    content: {type:String, required : true}
});

var assertion = module.exports = mongoose.model('assertion',idAssertion);

// add assertion
        module.exports.addAssertion = function (ass,callback) {
        assertion.create(ass,callback);
};

// get assertion
    module.exports.getAssertion = function (callback, limit) {
        assertion.find(callback).limit(limit);
};

// get assertion ById

    module.exports.getAssertionById = function (id, callback) {
        assertion.findOne(id,callback);

        //var users = user.find();

    };


    /*module.exports.getAssertionById = function (id, callback) {
        assertion.findById(id,callback);
    };
*/



