const {Kafka} = require("kafkajs")
const Redis = require("ioredis");
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
require("dotenv").config()

// List the sentinel endpoints
const redisClient = new Redis({
    sentinels: [
    { host: "172.23.0.6", port: 26379 },
    { host: "172.23.0.8", port: 26380 },
    { host: "172.23.0.3", port: 26381 },
    ],
    name: "mymaster",
    password: process.env.Redis_Password,
    //sentinelPassword: process.env.Redis_Password,
});

redisClient.on('connect',function(){
    console.log("Everything is fine")
}).on('error',function(error){
    console.log(error)
});

async function sendConfirmRegMail(){
    try
    {
        const kafka = new Kafka({
            clientId: "connect-1",
            brokers: ["kafka1:9092"]
        })

        const consumer = kafka.consumer({groupId: "users-group"});
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            topic: "users",
            fromBeginning: true
        })

        await consumer.run({
            eachMessage: async result => {
                var data = JSON.parse(result.message.value);
                console.log(data);
                console.log(`ID is: ${data.payload.id}`)
                console.log(`Email is: ${data.payload.email}`);
                //payload: { id: 2, email: 'testing2@firstclicklimited.com' }
                //console.log(`ID is: ${data.id}`);
                //console.log(`Email is: ${data.email}`);
                //console.log(`email from kafka is: ${result.message.value.toString()}`);
                await saveUserAndSendMail(data.payload.email);
            }
        })
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
}

const saveUserAndSendMail = async (kafka_email) => {
    /////////////////////////////////////////////////////////
    /********First check cache if email exist***********/
    //If email exist and acct_status set to ACTIVE or INACTIVE,
    //return no response (maybe an update operation)
    const value = await redisClient.get(kafka_email)//get key's value
    if(value == "ACTIVE" || value == "INACTIVE"){//if key/value exist
        //do nothing
    }else{//INSERT email into cache for O(1) lookup next time
        await redisClient.set(kafka_email, "INACTIVE")
        //////////send mail to confirm registration//////////////
        //first create jwt token to be attached to mail
        const userEmail = { userEmail: kafka_email }//user obj
        const accessToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
        //send mail
        sendMail(kafka_email, accessToken)
        /////////////////////////////////////////////////////////
    }
    ////////////////////////////////////////////////////////
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
                pass: process.env.Redis_Password,
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
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////Rollback Consumer///////////////////////////////////
async function updateUserStatus(){
    try
    {
        const kafka = new Kafka({
            clientId: "connect-rb2",
            brokers: ["kafka1:9092"]
        })

        const consumer = kafka.consumer({groupId: "users-group-rb2"});
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            topic: "mongoserver1.activate_user_reg_db.active_users",
            fromBeginning: true
        })

        await consumer.run({
            eachMessage: async result => {
                var data = JSON.parse(result.message.value);
                console.log(data);
                console.log(`email from kafka is: ${data.email}`);
                console.log(`status from kafka is: ${data.status}`);
                if(data.status == "ACTIVE"){
                    //Everything is fine
                    await ActivateUser(data.email)
                }else{
                    //remove user from db
                    await Remove_User_From_DB(data.email)
                }
            }
        })
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
}

async function ActivateUser(user){
    await redisClient.set(user, "ACTIVE");
}
async function Remove_User_From_DB(user){
    await redisClient.del(user);
}
//////////////////////Rollback Consumer Ends Here/////////////////////////

module.exports = { sendConfirmRegMail, updateUserStatus }