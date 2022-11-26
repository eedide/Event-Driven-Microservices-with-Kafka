const express = require("express")
const app = express();
const Redis = require("redis")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const activeusrsmodel = require("./models/Active_users")
var promise = require('promise');
require("dotenv").config()

app.use(express.json())//middleware for posting/getting json data

const confirmMail = async (req, res) => {
    //return new promise((resolve, reject) => {
        try{
            const token = req.query.token//get token from query string
            //get user's email from token
            const base64Url = token.split('.')[1];//extract data part of jwt
            const buff = Buffer.from(base64Url, 'base64Url').toString('ascii');//decode it
            const payload = JSON.parse(buff);//convert it to JSON data
            console.log(payload)

            const userEmail = Buffer.from(payload.userEmail)//extract user's email
            console.log(`User email is: ${userEmail}`)
            const Tvalue = {
                email: userEmail,
                status: "ACTIVE"
            }
            const Fvalue = {
                email: userEmail,
                status: "INACTIVE"
            }
            //Prevent users from submitting the same activation link more than once
            const { status, status_msg } = await Prevent_Multiple_Reg(activeusrsmodel, userEmail)
            console.log(`Status is: ${status}`)
            if(status == 400 && status_msg == "duplicate"){
                return res.json({
                    status: status,
                    status_msg: status_msg
                })
            }
            /*if(status == 500 && status_msg == "error1"){
                return res.json({
                    status: status,
                    status_msg: status_msg
                })
            }*/
            //console.log(`I got here`)
            //Prevent user activation if token in link is empty
            const { stats, stats_msg } = await Prevent_NULL_Token(activeusrsmodel, token, Fvalue);
            console.log(`Status is: ${stats}`)
            if(stats == 400 && stats_msg == "NULL_JWT"){
                return res.json({
                    status: stats,
                    status_msg: stats_msg
                })
            }
            //console.log(`I got here`)
            //console.log(process.env.ACCESS_TOKEN_SECRET)
            const { vstatus, vstatus_msg } = await Validate_Token(activeusrsmodel, token, Fvalue)
            if(vstatus == 403 && vstatus_msg == "Invalid_JWT"){
                console.log(`I got here )))`)
                return res.json({
                    status: vstatus,
                    status_msg: vstatus_msg
                })
            }
            //Invalidate activation token after single use
            Invalidate_Token()
            //Activate user account if all went well
            const {a_status, a_status_msg} = await Activate_User_Account(activeusrsmodel, Tvalue)
            console.log(`Latest status is: ${vstatus}`)
            if(a_status == 201 && a_status_msg == "Account_activated"){
                return res.json({
                    a_status : 201,
                    a_status_msg : "Account_activated"
                })
            }
        }catch(err){
            console.log(`error while verifying user registration: ${err}`)
            return res.json({
                status : 500,
                status_msg : "error4"
            })
        }
    //})
}

/*const confirmMail = async (req, res) => {
    try{
        const {status, status_msg} = await run(req, res);
        //When all is well
        res.json({
            "status":status,
            "message":status_msg
        })
    }catch(err){
        console.log(`The error is: ${err}`)
        res.json({
            "status": 500,
            "message": "error5"
        })
    }
}*/

const Prevent_Multiple_Reg = (model, userEmail) => {
    return new promise((resolve, reject) => {
        model.find({"email" : userEmail, "status" : "ACTIVE"}, function(err, response){
            if(err){
                console.log(`error while finding duplicates`)
                return reject({
                    status : 500,
                    status_msg : "error1"
                })
            }
            if(response.length != 0){
                //console.log(response)
                console.log(`duplicate value for ${userEmail}`)
                return resolve({
                    status : 400,
                    status_msg : "duplicate"
                })
            }
            return resolve({
                status : 200,
                status_msg : ""
            })
        })
    })
}

const Prevent_NULL_Token = (model, token, Fvalue) => {
    return new promise((resolve, reject) => {
        if(token == null){
            //Tell smartdev-pro service about registration failure
            //smartdev-pro will tell other connecting services
            //about the failure, so that they can all reverse
            //any action associated with this failure
            model.create(Fvalue, function(err){
                if(err){
                    return reject({
                        stats : 400,
                        stats_msg : "error1"
                    })
                }
            })
            return resolve({
                stats : 400,
                stats_msg : "NULL_JWT"
            })
        }
        return resolve({
            stats : 200,
            stats_msg : ""
        })
    })
}

const Validate_Token = (model, token, Fvalue) => {
    return new promise((resolve, reject) => {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
            if(err){
                //Tell smartdev-pro about registration failure
                //smartdev-pro will tell other connecting services
                //about the failure, so that they can all reverse
                //any action associated with this failure
                model.create(Fvalue, function(err){
                    if(err){
                        return reject({
                            vstatus : 500,
                            vstatus_msg : "error2"
                        })
                    }
                })
                console.log(`error is: ${err}`)      
                return resolve({
                    vstatus : 403,
                    vstatus_msg : "Invalid_JWT"
                })
            }  
            return resolve({
                vstatus : 200,
                vstatus_msg : ""
            })
        })
    })
}

const Invalidate_Token = () => {
    //Make JWT a single use token by re-generating token secret to render it invalid
    //if the activation link you present after now carries the former secret key,
    //validation will fail. In other words - this is a single use token 
    process.env.ACCESS_TOKEN_SECRET = require('crypto').randomBytes(64).toString('hex');
    //console.log(`${process.env.ACCESS_TOKEN_SECRET}`)
}

const Activate_User_Account = (model, Tvalue) => {
    return new promise((resolve, reject) => {
        //Mark user's status in db as Active
        model.create(Tvalue, function(err){
            if(err){
                return reject({
                    a_status : 500,
                    a_status_msg : "error3"
                })
            }
            //If code got here, then everything is ok
            return resolve({
                a_status : 201,
                a_status_msg : "Account_activated"
            })
        })
    })
}

module.exports = { confirmMail }