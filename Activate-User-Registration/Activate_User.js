const express = require("express")
const app = express();
const Route = require("./routes/index")
const connection = require("./controller/db/connect")
require("dotenv").config()
const helmet = require('helmet')
const cluster = require("cluster")
const os = require("os")
const numCPUs = os.cpus().length;//get nos. of cores in my cpu

//middlewares
app.use(helmet());
app.use(express.json())//middleware for posting/getting json data

//routes
app.use("/api/v1/dev", Route)

const port = process.env.Prt | 4000

const start = async () => {
    try{
        //const user = encodeURIComponent(process.env.Mongo_user)
        //const PW = encodeURIComponent(process.env.Mongo_PW)
        await connection(`mongodb://${process.env.Mongo_user}:${process.env.Mongo_PW}@${process.env.Server1}:${process.env.Mongo_port},${process.env.Server2}:${process.env.Mongo_port},${process.env.Server3}:${process.env.Mongo_port}/${process.env.db}?authSource=${process.env.auth_db}&replicaSet=${process.env.replSetName}`)
        /*await connection(`mongodb://${process.env.Server1}:${process.env.Mongo_port},${process.env.Server2}:${process.env.Mongo_port},${process.env.Server3}:${process.env.Mongo_port}/${process.env.db}?authSource=${process.env.auth_db}&replicaSet=${process.env.replSetName}&tls=true`, {
            tlsValidate: false,
            tlsCA: "./mongo/mongors-ca.crt",
            tlsCert: "./mongo/final-client.pem",
            tlsKey: "./mongo/final-client.pem",
            auto_reconnect: true,
            //authMechanism: "MONGODB-X509",
            socketOptions : {
                keepAlive: 120
            }
        })*/
        app.listen(port, console.log(`The server is now listening on port ${port}`))
    }catch(error){
        console.log("mongo connection failed")
        //log error to file
        console.log(error)
    }
}

if(cluster.isMaster){
    //Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();//create a new worker process
    }
    //if worker process dies, fork again
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();//create a new worker process again
    });
}else{
    start()
}