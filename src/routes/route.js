const express = require('express');
const router = express.Router();
const { Authentication, Authorization } = require('../middleware/auth')
const { createUser, userLogin, getUser, updateUserData } = require('../controller/userController')


router.get("/test", function (req, res){
    res.status(200).send("Test completed")
})



//===================== User Registration (Post API) =====================//
router.post("/register", createUser)
//===================== User Login (Post API) =====================//
router.post("/login", userLogin)
//===================== Get User Data (Get API) =====================//
router.get("/user/:userId/profile", Authentication, getUser)
//===================== Update User Data (Put API) =====================//
router.put("/user/:userId/profile", Authentication, Authorization, updateUserData)
//============================================================================//


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "Requested path does not exist, Check your URL"})
});

module.exports = router; 