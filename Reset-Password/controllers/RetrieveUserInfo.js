const poolCluster = require("../controllers/db/connect2");
var promise = require('promise');

const Retrieve_PW_Hash = (req, res) => {
    return new promise((resolve, reject) => {
        const query = "SELECT password FROM users WHERE email = ? AND User_status = 'ACTIVE'";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                console.log(err)
                connection.release()
                return reject("failed")
            } else {
                connection.query(query, [ req.body.email ], function(err, results) {
                    if(err){
                        //log error
                        return reject("failed")
                    }
                    //console.log(`The email is: ${req.body.email}`)
                    if (results.length < 1){
                        //console.log(`The error is: ${err}`)
                        return reject("failed")
                    }
                    const user = results[0];
                    return resolve(user.password)
                });
            }
        });
    }).catch((error) => {
        console.log(`The error is: ${error}`)
        //res.json({ status: 500, message: "failed" })
    });
}

const Retrieve_Token = (req, res) => {
    return new promise((resolve, reject) => {
        const query = "SELECT auth_token FROM users WHERE email = ? AND User_status = 'ACTIVE'";
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release()
                return reject("failed")
            } else {
                connection.query(query, [ req.body.email ], function(err, results) {
                    if(err){
                        //log error
                        return reject("failed")
                    }
                    //console.log(`The email is: ${req.body.email}`)
                    if (results.length < 1){
                        //console.log(`The error is: ${err}`)
                        return reject("failed")
                    }
                    const user = results[0];
                    return resolve(user.auth_token)
                });
            }
        });
    }).catch((error) => {
        console.log(`The error is: ${error}`)
        //res.json({ status: 500, message: "failed" })
    });
}

module.exports = { Retrieve_PW_Hash, Retrieve_Token }