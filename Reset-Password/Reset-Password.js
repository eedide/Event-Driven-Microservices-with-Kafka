const express = require("express")
const app = express();
const Route = require("./routes/index")
const connection = require("./controllers/db/connect");
require("dotenv").config()
const helmet = require('helmet')
const cluster = require("cluster")
const os = require("os")
const numCPUs = os.cpus().length;//get nos. of cores in my cpu

//middlewares
app.use(helmet());

//middleware
app.use(express.urlencoded({ extended: false}))//middleware for parsing form input in req object
app.use(express.json())//middleware for posting/getting json data

//routes
app.use("/api/v1/dev", Route)

app.all("*", (req, res) => {
    res.status(404).json({
        message: "Page_Not_Found"
    })
})

const port = process.env.Prt | 4001

const start = async () => {
    try{
        await connection
        app.listen(port, console.log(`The server is now listening on port: ${port} / PID: ${process.pid}`))
    }catch(error){
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