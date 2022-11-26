const {Kafka} = require("kafkajs")
const poolCluster = require("./db/clsConnect")

async function Update_User_Status(){
    try
    {
        const kafka = new Kafka({
            clientId: "connect-rb1",
            brokers: ["kafka1:9092"]
        })

        const consumer = kafka.consumer({groupId: "users-group-rb1"});
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            topic: "mongoserver1.activate_user_reg_db.active_users",
            fromBeginning: true
        })

        await consumer.run({
            eachMessage: async result => {
                console.log(`full data is: ${result.message.value}`)
                var data = JSON.parse(result.message.value);
                console.log(`email from kafka is: ${data.email}`);
                console.log(`status from kafka is: ${data.status}`);
                if(data.status == "ACTIVE"){
                    //change status to ACTIVE in users's table
                    Activate_User(data.email)
                }else{
                    //remove user from db
                    Remove_User_From_DB(data.email)
                }
            }
        })
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
}

function Activate_User(user){
    const query = "UPDATE users SET User_status = 'ACTIVE' WHERE email=?";
    poolCluster.getConnection("RW1", function(err, connectn){
        if (err) {
            //log error
            console.log("An error occured in the system")
            connectn.release();
        } else {
            connectn.query(query, [ user ], function(err, results) {
                if(err){
                    //log error
                    console.log(`An error 1 occured in the system ${err}`)
                    connectn.release();
                }
                if (results.affectedRows < 1){
                    //log error
                    console.log(`An error 2 occured in the system`)
                    connectn.release();
                }else{
                    //log error
                    console.log("Everthing went well")
                    connectn.release();
                }
            });
        }
    })
}

function Remove_User_From_DB(user){
    const query = "DELETE FROM users WHERE email = ?";
    poolCluster.getConnection("RW1", function (err, connectn) {
        if (err) {
            //log error
            console.log("An error occured in the system")
            connectn.release();
        } else {
            connectn.query(query, [ user ], function(err, results) {
                if(err){
                    //log error
                    console.log(`An error occured in the system: ${err}`)
                    connectn.release();
                }
                if (results.affectedRows < 1){
                    //log error
                    console.log("An error occured in the system")
                    connectn.release();
                }
                //log error
                console.log("Everthing went well")
                connectn.release();
            });
        }
    });
}

/*async function Change_User_Password(){
    try{
        //create new kafka client
        const kafka = new Kafka({
            clientId: 'change-PWD',
            brokers: ['kafka1:9092'],
        })

        //initialize consumer
        const consumer = kafka.consumer({ groupId: 'PW-change-group' })

        //connect to broker
        console.log("Connecting to PW-chan.....")
        await consumer.connect()
        console.log("Connected")

        //subscribe to kafka topic
        await consumer.subscribe({ topic: 'User-Password-Update', fromBeginning: false })

        //standby to consume events from topic
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                //var data = JSON.parse(message.value);
                console.log(`The user is: ${message.value}`)
                myEmitter.emit('pwemitter', message.value)
            },
        })
    }catch(err){
        console.log("Something bad happened to change password consumer")
    }
}*/


module.exports = { Update_User_Status }