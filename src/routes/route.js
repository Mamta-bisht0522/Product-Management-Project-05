const express = require('express');
const router = express.Router();
const { Authentication, Authorization } = require('../middleware/auth')
const { createUser, userLogin, getUser, updateUserData } = require('../controller/userController')
const {createProduct, getProduct, getProductById, updateProduct, deleteProduct} = require('../controller/productController')
const {createCart, updateCart, getCart, deleteCart} = require('../controller/cartController')
const{createOrder, updateOrder}=require('../controller/orderController')


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

router.put("/products/:productId", updateProduct)

router.delete("/products/:productId", deleteProduct)

router.post("/users/:userId/cart", Authentication, Authorization, createCart)

router.put("/users/:userId/cart", Authentication, Authorization, updateCart)

router.get("/users/:userId/cart", Authentication, Authorization, getCart)

router.delete("/users/:userId/cart", Authentication, Authorization, deleteCart)

router.post("/users/:userId/orders",Authentication, Authorization,createOrder)
router.put("/users/:userId/orders",Authentication,Authentication,updateOrder)


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "Requested path does not exist, Check your URL"})
});

module.exports = router; 