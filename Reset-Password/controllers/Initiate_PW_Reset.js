const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
require("dotenv").config()
const { Retrieve_PW_Hash, Retrieve_Token } = require("./RetrieveUserInfo")

const Initiate_PW_Reset = async (req, res) => {
    try{
        //Retrieve user password hash from db
        var PW_Hash = await Retrieve_PW_Hash(req, res)
        if(PW_Hash == "Failed"){
            return res.status(400).json({
                message: "PW_reset_failed"
            })
        }
        //Before performing password change, check
        //if user is authenticated
        var token = await Retrieve_Token(req, res)
        jwt.verify(token, process.env.AUTH_SECRET, (err) => {
            if(err){
                return res.status(403).json({
                    message: "Invalid_JWT"
                })
            }else{
                //Create single use JWT using password hash as secret key
                const userEmail = { userEmail: req.body.email }//user obj
                //console.log(`The email is: ${userEmail.userEmail}`)
                const accessToken = jwt.sign(userEmail, PW_Hash, { expiresIn: "24h" })
                //Send email attaching the JWT to reset link
                sendMail(req.body.email, accessToken)
                return res.status(200).json({
                    message: "PW_reset_link_sent"
                })
            }
        })
    }catch(err){
        console.log(`An error occured while initiating password reset 1: ${err}`)
    }
}

const sendMail = async (email, emailToken) => {
    try{
        const url = `http://localhost:4001/api/v1/dev/confirmPWreset?token=${emailToken}`;
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "info@firstclicklimited.com",
                pass: process.env.PASSWORD,
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Smartdev Team" info@firstclicklimited.com',// sender address
            to: email,//receiver
            subject: "Password Reset",//Subject line
            text: "Hello world?",//plain text body
            html: `<h2>Smartdeveloper.tech Password Reset</h2><p>Hello ${email},<br>You are trying to reset your password at smartdeveloper.tech. Please click the link below to reset your password:<br><br> ${url} <br><br>If the link is not clickable, copy the complete url without any spaces, paste it on your browser and click enter.<br><br>If you did not initiate this action, simply ignore this mail.</p><br>Smartdev Team`//html body
        });
    }catch(err){
        console.log("An error occured while initiating password reset 2")
    }
}

module.exports = { Initiate_PW_Reset }

