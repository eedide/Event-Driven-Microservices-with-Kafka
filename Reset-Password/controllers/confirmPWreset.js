const express = require("express")
const app = express();
const jwt = require("jsonwebtoken")
require("dotenv").config()
const {Kafka} = require("kafkajs")
const { Retrieve_PW_Hash } = require("./RetrieveUserInfo")
var promise = require('promise');
const fetch = require('node-fetch');
const NodeRSA = require('node-rsa');
//const key = new NodeRSA({b: 512});

//var public_key = key.exportKey('public')
//var private_key = key.exportKey('private')
//console.log(`${public_key} \n ${private_key}`)

app.use(express.json())//middleware for posting/getting json data

async function checkResponseStatus(response) {
    if(response.ok){
        const js = await response.json()
        console.log(js)
        return
    } else {
        console.log(`The HTTP status of the reponse: ${response.status} (${response.statusText})`)
    }
}

const confirmPWreset = async (req, res) => {
    try{
        const token = req.query.token//get token from query string
        const {status, status_msg} = await Prevent_NULL_Token(token)
        //console.log('i got here')
        if(status == 400 && status_msg == "NULL_JWT"){
            res.status(400).json({
                "status": "invalid_JWT"
            })
        }

        //get user's email from token
        const base64Url = token.split('.')[1];//extract data part of jwt
        //console.log(`base64 is: ${base64Url}`)
        const buff = Buffer.from(base64Url, 'base64Url').toString('ascii');//decode it
        //console.log(`buff is: ${buff}`)
        const payload = JSON.parse(buff);//convert it to JSON data
        //console.log(`payload is: ${payload}`)
        //console.log(`payload email is: ${payload.userEmail}`)
        //const userEmail = Buffer.from(payload.userEmail).toString();//extract user's email
        //store userEmail in req object
        req.body.email = payload.userEmail

        //Retrieve password hash from db
        const ACCESS_TOKEN_SECRET = await Retrieve_PW_Hash(req, res)
        if(ACCESS_TOKEN_SECRET == 'failed'){
            res.status(400).json({
                "status": "invalid_JWT"
            })
        }
        //validate token
        const {vstatus, vstatus_msg} = await Validate_Token(token, ACCESS_TOKEN_SECRET)
        if(vstatus == 403 && vstatus_msg == "Invalid_JWT"){
            res.status(403).json({
                "status": "invalid_JWT"
            })
        }
        //If code got here, then everything is ok, write to
        //User-Password-Update Topic so that smartdev-pro service can
        //update user's password
   
        //new kafka client
        /*const kafka = new Kafka({
            clientId: "connect-1",
            brokers: ["kafka1:9092"]
        })

        //initialize producer
        const producer = kafka.producer()

        //connect to broker
        console.log("producer is connecting.....")
        await producer.connect()
        console.log("producer is connected.....")

        //write event to kafka Topic
        await producer.send({
            topic: 'User-Password-Update',
            messages: [
                { key: 'pswdchangekey', value: payload.userEmail},
            ],
        })

        //disconnect from broker
        await producer.disconnect()*/
        const { URLSearchParams } = require('url');

        const params = new URLSearchParams();
        params.append('userEmail', req.body.email);

        fetch('http://signup:3000/api/v1/dev/ChangePW_Redirect_Handler',
        {
            method: 'POST',
            body: params
        })
        .then(checkResponseStatus)
        //.then(json => console.log(json))
        .catch(err => console.error(err));
        
        //Encrypt userEmail and attach to redirect url
        const public_key = new NodeRSA(process.env.rsa_public_key)

        //public key is for encryption
        const encryptedUserEmail = public_key.encrypt(req.body.email,"base64")
        console.log(encryptedUserEmail)

        /*res.json({
            "message": "I got to the end"
        })*/
        //redirect to the change password form page
        res.redirect(`http://signup:3000/api/v1/dev/PW_Reset_Frm?use=${encryptedUserEmail}`)
    }catch(err){
        console.log(`Something bad happened to User-Password-Update producer: ${err}`)
        res.status(403).json({
            status_msg: "Something_bad_happened"
        })
    }
}

const Prevent_NULL_Token = (token) => {
    return new promise((resolve, reject) => {
        if(token == null){
            return resolve({
                status : 400,
                status_msg : "NULL_JWT"
            })
        }else{
            return resolve({
                status : 200,
                status_msg : ""
            })
        }
    })
}

const Validate_Token = (token, ACCESS_TOKEN_SECRET) => {
    return new promise((resolve, reject) => {
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err) => {
            if(err){     
                return reject({
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

module.exports = { confirmPWreset }