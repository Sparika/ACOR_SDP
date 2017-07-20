// config/database.js

env = process.env.NODE_ENV || 'development';

module.exports = {
    development: {
        'url' : 'mongodb://localhost/passport' // looks like mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot
    },
    production: {
        'url' : 'mongodb://'+process.env.MONGO_PORT_27017_TCP_ADDR+':'+process.env.MONGO_PORT_27017_TCP_PORT
    }

}[env];
