//Import the mongoose module
var mongoose = require('mongoose');

const Connectdb = (Mongo_connec_str) => {
    //Set up default mongoose connection
    return mongoose.connect(Mongo_connec_str)
}


module.exports = Connectdb