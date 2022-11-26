const express = require("express")
const router = express.Router();
const { login, logout } = require("../controllers/index")

router.route("/login").post(login)
router.route("/logout").get(logout)

router.route("/home").get((req, res) => {
    if(!req.session.email){
        res.status(200).send(`<h1>You are welcomed to our website - From Server: ${process.pid}</h1>`)
    }else{
        res.status(200).send(`<h1>You are welcomed, ${req.session.email} - From Server: ${process.pid}</h1>`)
    }
})

module.exports = router