const express = require("express")
const app = express();
const Route = require("./routes/index")
const connection = require("./controllers/db/connect");
const poolCluster = require("./controllers/db/clsConnect");
require("dotenv").config()
const session = require("express-session")
var MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet')
const cluster = require("cluster")
const os = require("os")
const numCPUs = os.cpus().length;//get nos. of cores in my cpu

//middlewares
app.use(helmet());
app.use(express.urlencoded({ extended: false }))//middleware for parsing form input in req object
app.use(express.json())//middleware for posting json data

var sessionStore;
const startSession = async () => {
    sessionStore = new MySQLStore({
        //expiration: 172800,
        createDatabaseTable: true,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    },connection);
}

startSession();

app.use(session({
    key: process.env.SESSION_KEY,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 172800000,
        //secure: true,
        httpOnly: true
    }
}))

//routes
app.use("/api/v1/dev", Route)

app.all("*", (req, res) => {
    res.status(404).json({
        message: "Page_Not_Found"
    })
})

const port = process.env.PRT || 3033

const start = async () => {//sync db and server connection - (if db connec fails, then server connec fails)
    try{
        //await connection//connection for insert - insert to primary
        await poolCluster//connection for read - read from cluster
        app.listen(port, console.log(`The server is now listening on port: ${port} / PID: ${process.pid}`))
    }catch(error){
        //log error to file
        console.log(`Something went wrong - please check`)
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
