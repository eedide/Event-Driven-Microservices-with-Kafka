const express = require("express")
const router = express.Router();
const { Initiate_PW_Reset } = require("../controllers/Initiate_PW_Reset")
const { confirmPWreset } = require("../controllers/confirmPWreset")

router.route("/resetPW").post(Initiate_PW_Reset)
router.route("/confirmPWreset").get(confirmPWreset)

router.route("/home").get((req, res) => {
    res.status(200).send("<h1>Homepage of Port 4001</h1>")
})

router.route("/PW_Reset_Frm").get((req, res) => {
    res.status(200).send("<h1>Enter New Password</h1>")
})

module.exports = router