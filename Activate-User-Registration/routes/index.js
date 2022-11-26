const express = require("express")
const router = express.Router();
const { confirmMail } = require("../confirmuserReg.js")


router.route("/confirmuserReg").get(confirmMail)

router.route("/home").get((req, res) => {
    res.status(200).send("<h1>Homepage of Port 4000</h1>")
})

module.exports = router