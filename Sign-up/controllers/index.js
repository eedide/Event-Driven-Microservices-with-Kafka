require("dotenv").config()
//const connection = require("./db/connect")
const poolCluster = require("./db/clsConnect")
const bcrypt = require('bcryptjs');
var promise = require('promise');
const { reject, resolve } = require("promise");
const nodemailer = require("nodemailer")
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

const Confirm_Registration_Status = (email) => {
    return new promise((resolve, reject) => {
        const query = "SELECT user_status from users WHERE email = ?";
        poolCluster.getConnection("READ", function (err, connection) { 
            if (err) {
                connection.release()
                return reject({
                    Reg_status : "failed",
                    Reg_status_msg : ""
                })
            } else {
                connection.query(query, [ email ], function(err, results) {
                    if(err){
                        //log error here
                        return reject({
                            Reg_status : "failed",
                            Reg_status_msg : ""
                        })
                    }
                    if (results.length < 1){
                        return resolve({
                            Reg_status : "failed",
                            Reg_status_msg : ""
                        });
                    }
                    const user = results[0];
        
                    return resolve({
                        Reg_status : user.user_status,
                        Reg_status_msg : ""
                    })
                });
            }
        });
    })
}

const Is_Account_Under_Suspension = (req, res) => {
    return new promise((resolve, reject) => {
        const query = "SELECT Login_id, Suspension_reason FROM suspended_users WHERE email = ?";
        poolCluster.getConnection("READ", function (err, connection) { 
            if (err) {
                connection.release();
                //log error
                return reject({
                    sus_status : "failed",
                    sus_status_msg : ""
                })
            } else {
                connection.query(query, [ req.body.email ], function(err, results) {
                    if(err){
                        connection.release();
                        //log error
                        return reject({
                            sus_status : "failed",
                            sus_status_msg : ""
                        })
                    }
                    if (results.length < 1){
                        connection.release();
                        return resolve({
                            sus_status : "NOT_SUSPENDED",
                            sus_status_msg : ""
                        })
                    }
                    const user = results[0];
        
                    if(user.Login_id && user.Suspension_reason == "MULTIPLE_LOGIN_FAILURE"){
                        connection.release();
                        return resolve({
                            sus_status : "SUSPENDED",
                            sus_status_msg : "Multiple_Login_Failure"
                        })
                    }
                    connection.release();
                    return resolve({
                        sus_status : "NOT_SUSPENDED",
                        sus_status_msg : ""
                    })
                });
            }
        });
    })
}

const sign_up = async (req, res) => {
    try{
        const { user_exist } = await userExist(req.body.email)
        if(user_exist == "failed") return res.status(500).json({ "status": "failed", "msg": "An error occured in the system. Try again" })
        if(user_exist == "true"){
            /*if user is INACTIVE and under suspension, return*/
            //GET user registration status
            const { Reg_status, Reg_status_msg } = await Confirm_Registration_Status(req.body.email)
            if(Reg_status == "INACTIVE"){
                //check if user is suspended
                const {sus_status, sus_status_msg} = Is_Account_Under_Suspension(req, res)
                if(sus_status == "SUSPENDED"){
                    //user under suspension, cannot
                    //receive activation email again
                    return res.status(400).json({
                        "status" : "failed",
                        "msg" : "user under suspension"
                    })
                }else if(sus_status == "failed"){
                    return res.status(500).json({
                        "status" : "failed",
                        "msg" : "something went wrong while checking sus_status"
                    })
                }else{
                    //////////send mail to confirm registration//////////////
                    //first create jwt token to be attached to mail
                    const userEmail = { userEmail: req.body.email }//user obj
                    const accessToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
                    //send mail
                    await sendMail(req.body.email, accessToken)

                    return res.status(200).json({
                        "status" : "success",
                        "msg" : "email is already registered, activation email re-sent"
                    })
                }
            }else{
                return res.status(400).json({
                    "status": "failed",
                    "msg": "email is already registered"
                })
            }
        }
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

                    //////////send mail to confirm registration//////////////
                    //first create jwt token to be attached to mail
                    const userEmail = { userEmail: req.body.email }//user obj
                    const accessToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
                    //send mail
                    sendMail(req.body.email, accessToken)

                    connection.release()
                    return res.status(201).json({
                        "status" : "success",
                        "msg" : "user\'s registration activation email sent"
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

const sendMail = async (email, emailToken) => {
    try{
        const url = `http://localhost:4000/api/v1/dev/confirmuserReg?token=${emailToken}`;
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "info@firstclicklimited.com",
                pass: process.env.SMTP_Password,
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Smartdev Team" info@firstclicklimited.com',// sender address
            to: email,//receiver
            subject: "Account Activation",//Subject line
            text: "Hello world?",//plain text body
            html: `<h2>Smartdeveloper.tech Account Activation</h2><p>Hello ${email},<br>You are welcome to smartdeveloper.tech. Please click the link below to activate your account:<br><br> ${url} <br><br>If the link is not clickable, copy the complete url without any spaces, paste it on your browser and click enter.</p><br>Smartdev Team`//html body
        });
    }catch(err){
        console.log("An error occured while sending user activation mail")
        //console.log(err)
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