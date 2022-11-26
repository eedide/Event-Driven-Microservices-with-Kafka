const mongoose = require("mongoose");

//Define a schema
const ActiveusersSchema = new mongoose.Schema({
    email: String,
    status: String
});

module.exports = mongoose.model("active_user", ActiveusersSchema)