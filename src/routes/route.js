const express = require('express');
const router = express.Router();
const { Authentication, Authorization } = require('../middleware/auth')
const { createUser, userLogin, getUser, updateUserData } = require('../controller/userController')
const {createProduct, getProduct, getProductById} = require('../controller/productController')


router.get("/test", function (req, res){
    res.status(200).send("Test completed")
})


router.post("/register", createUser)

router.post("/login", userLogin)

router.get("/user/:userId/profile", Authentication, getUser)

router.put("/user/:userId/profile", Authentication, Authorization, updateUserData)

router.post("/products", createProduct)

router.get("/products", getProduct)

router.get("/products/:productId", getProductById)


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "Requested path does not exist, Check your URL"})
});

module.exports = router; 