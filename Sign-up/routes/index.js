const express = require("express")
const os = require("os")
const router = express.Router();
const poolCluster = require("../controllers/db/clsConnect")
const { sign_up, Process_New_PW, Redirect_PWChange_Frm } = require("../controllers/index")

router.route("/signup").post(sign_up)
router.route("/Process_New_PW").post(Process_New_PW)
router.route("/ChangePW_Redirect_Handler").post(Redirect_PWChange_Frm)

router.route("/PW_Reset_Frm").get((req, res) => {
    res.status(200).send("<h1>Enter Username and Password</h1>")
})
router.route("/home").get((req, res) => {
    if(!req.session.email){
        const query = 'SELECT @@hostname AS hostnm';
        poolCluster.getConnection("READ", function (err, connection) {
            if (err) {
                connection.release()
                console.log("hostname failed")
            } else {
                connection.query(query, function(err, results) {
                    if (err){
                        connection.release()
                        //log error here
                        console.log("an error occured")
                    }
                    if (results.length < 1){
                        connection.release()
                        console.log("Something went wrong")
                    }else{
                        connection.release()
                        console.log(`hostname is: ${results[0].hostnm}`)
                    }
                });
            }
        });
        res.status(200).send(`<h1>You are welcomed to our website - From Server: ${os.hostname}</h1>`)
    }else{
        res.status(200).send(`<h1>You are welcomed, ${req.session.email} - From Server: ${os.hostname}</h1>`)
    }
})

module.exports = router