require("dotenv").config()
//const connection = require("./db/connect")
const poolCluster = require("./db/clsConnect")
const bcrypt = require('bcryptjs');
var promise = require('promise');
const { reject, resolve } = require("promise");
//var dateTime = require('node-datetime');
const jwt = require('jsonwebtoken')
const NodeRSA = require('node-rsa');

const userExist = (email) => {
    return new promise((resolve, reject) => {
        const query = 'SELECT email FROM users WHERE email = ?';
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release()
                return reject({
                    user_exist : "failed"
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if (err){
                        console.log(`error: ${err}`)
                        connection.release()
                        //log error here
                        return reject({
                            user_exist : "failed"
                        })
                    }
                    if (results.length < 1){
                        connection.release()
                        return resolve({
                            user_exist : "false"
                        });
                    }else{
                        connection.release()
                        return resolve({
                            user_exist : "true"
                        });
                    }
                });
            }
        });
    })
}

const sign_up = async (req, res) => {
    try{
        const { user_exist } = await userExist(req.body.email)
        if(user_exist == "failed") return res.status(500).json({ "status": "failed", "msg": "An error occured in the system. Try again" })
        if(user_exist == "true") return res.status(500).json({ "status": "failed", "msg": "email is already registered" })
        const Hash = await bcrypt.hash(req.body.password, 10)
        //console.log(Hash)
        //insert user in db
        const query = 'INSERT INTO users (email, password) VALUES ?';
        const values = [
            [req.body.email, Hash]
        ]
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return res.status(500).json({
                    "status" : "failed",
                    "msg" : "An error occurred during signup process. Please try again 1"
                })
            } else {
                connection.query(query, [values] , function(err, results) {
                    if(err){
                        connection.release()
                        //log error here
                        //console.log(err)
                        return res.status(500).json({
                            "status" : "failed",
                            "msg" : "An error occurred during signup process. Please try again 2"
                        })
                    }
                    connection.release()
                    return res.status(201).json({
                        "status" : "success",
                        "msg" : "user\'s record is successfully saved in database"
                    })
                });
            }
        });
    }catch(err){
        //log error here
        //console.log(err)
        return res.status(400).json({
            "status" : "failed",
            "msg" : "An error occurred during signup process. Please try again 3"
        });
    }
}

const Process_New_PW = async (req, res) => {
    try{
        let encryptedEmail = req.body.userEmail
        /////////////////////decrypt email//////////////////////////
        const private_key = new NodeRSA(process.env.rsa_private_key)
        //private key is for decryption
        const decryptedEmail = private_key.decrypt(encryptedEmail,"utf8")
        console.log(decryptedEmail)
        ////////////////////////////////////////////////////////////
        const Hash = await bcrypt.hash(req.body.password, 10)//Hash new PW
        const query = `UPDATE users SET password=? WHERE email=?`
        poolCluster.getConnection("WRITE",function (err, connection) {
            if (err) {
                connection.release()
                return res.status(500).json({
                    "status" : "failed",
                    "msg" : "An error occurred during password change. Please try again 1"
                })
            } else {
                connection.query(query, [Hash, decryptedEmail], function(err, results){
                    if(err){
                        //log error here
                        connection.release()
                        console.log(err)
                        return res.status(500).json({
                            "status" : "failed",
                            "msg" : "An error occurred during password change. Please try again"
                        })
                    }else{
                        if (results.affectedRows < 1){
                            connection.release();
                            return res.status(500).json({
                                "status" : "failed",
                                "msg" : "An error occurred during password change. Please try again"
                            })
                        }else{
                            connection.release()
                            return res.status(201).json({
                                "status" : "success",
                                "msg" : "user\'s password is successfully changed"
                            })
                        }
                    }
                })
            }
        });
    }catch(err){
        console.log(`Error while changing password: ${err}`)
    }
}

const Redirect_PWChange_Frm = (req, res) => {
    try{
        console.log('The message has been posted')
        //receive email into a session
        req.session.userEmail = req.body.userEmail
        console.log(`The email value is: ${req.body.userEmail}`)
        console.log(`The session value is: ${req.session.userEmail}`)
        req.session.save((err) => {//save session in db b/4 returning to calling app
            if (err) {
                console.log("session save error", err);
                return res.status(500).json({
                    status: "Failed"
                })
            }else{
                return res.status(200).json({
                    status: "PW_Change_Request"
                })
            }
        });
    }catch(err){
        console.log(`The error is: ${err}`)
    }
}

module.exports = {
    sign_up,
    Process_New_PW,
    Redirect_PWChange_Frm
}