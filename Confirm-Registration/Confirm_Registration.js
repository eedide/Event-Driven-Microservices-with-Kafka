const express = require("express")
const app = express();
//const {Kafka} = require("kafkajs")
//const Redis = require("redis")
//var sentinel = require('redis-sentinel')
//const Redis = require("ioredis");
const helmet = require('helmet')
const cluster = require("cluster")
const os = require("os")
const numCPUs = os.cpus().length;//get nos. of cores in my cpu
const { sendConfirmRegMail, updateUserStatus } = require("./controller/ConfirmRegFunc")

//middlewares
app.use(helmet());
app.use(express.json())//middleware for posting/getting json data

if(cluster.isMaster){//master process
    //Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();//create a new worker process
    }
    //if worker process dies, fork again
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();//create a new worker process again
    });
}else{//worker process
    ////Two consumers are up and running////////////////////////////////////////////////////
    sendConfirmRegMail()//consume newly registered user events from smartdev-pro service
    updateUserStatus()//consume failed registration events from Activate-User-Registration events
    ////////////////////////////////////////////////////////////////////////////////////////
}