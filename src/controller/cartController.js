const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')
const productModel = require('../model/productModel')
const validator = require('../validator/validator')


const createCart = async (req, res) => {

    try {

        let userId = req.params.userId
        let data = req.body
        let { cartId, productId, quantity, ...rest } = data
        let checkUser = await userModel.findById(userId)
        if (!checkUser) return res.status(404).send({status: false, message: ` user not found with given userId: ${userId}`})
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "No data found from body! You need to put Something(i.e. cartId, productId)" });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "You can input only cartId, productId." }) }
        if (!validator.isValidInput(productId)) return res.status(400).send({ status: false, message: "Enter ProductId." })
        if (!validator.isValidObjectId(productId)) return res.status(400).send({ status: false, message: `This ProductId: ${productId} is not valid!` })

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) { return res.status(404).send({ status: false, message: `This ProductId: ${productId} is not exist!` }) }


        if (quantity || typeof quantity == 'string') {

            if (!validator.isValidInput(quantity)) return res.status(400).send({ status: false, message: "Enter a valid value for quantity!" });
            if (!validator.isValidNum(quantity)) return res.status(400).send({ status: false, message: "Quantity of product should be in numbers." })

        } else {
            quantity = 1
        }
        let Price = checkProduct.price


        if (cartId) {

            if (!validator.isValidInput(cartId)) return res.status(400).send({ status: false, message: "Enter a valid cartId" });
            if (!validator.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: `This cartId: ${cartId} is not valid!.` })
            let checkCart = await cartModel.findOne({ _id: cartId, userId: userId }).select({ _id: 0, items: 1, totalPrice: 1, totalItems: 1 })
            if (checkCart) {

                let items = checkCart.items
                let object = {}
                for (let i = 0; i < items.length; i++) {
                    if (items[i].productId.toString() == productId) {
                        items[i]['quantity'] = (items[i]['quantity']) + quantity
                        let totalPrice = checkCart.totalPrice + (quantity * Price)
                        let totalItem = items.length
                        object.items = items
                        object.totalPrice = totalPrice
                        object.totalItems = totalItem
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: object }, { new: true }).populate('items.productId')
                        return res.status(201).send({ status: true, message: "Success", data: updateCart })
                    }
                }
                items.push({ productId: productId, quantity: quantity })
                let tPrice = checkCart.totalPrice + (quantity * Price)
                object.items = items
                object.totalPrice = tPrice
                object.totalItems = items.length
                let update1Cart = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: object }, { new: true }).populate('items.productId')

                return res.status(201).send({ status: true, message: "Success", data: update1Cart })

            } else {
                return res.status(404).send({ status: false, message: 'Cart is not exist with this userId!' })
            }

        } else {
            let cart = await cartModel.findOne({ userId: userId })
            if (!cart) {
                let arr = []
                let totalPrice = quantity * Price
                arr.push({ productId: productId, quantity: quantity })
                let obj = {
                    userId: userId,
                    items: arr,
                    totalItems: arr.length,
                    totalPrice: totalPrice
                }
                await cartModel.create(obj)
                let resData = await cartModel.findOne({ userId }).populate('items.productId')
                return res.status(201).send({ status: true, message: "Success", data: resData })
            } else {
                return res.status(400).send({ status: false, message: "You have already CardId which is exist in your account." })
            }
        }

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}



//<<<===================== This function is used for Update Cart Data =====================>>>//
const updateCart = async (req, res) => {

    try {

        let data = req.body;
        let userId = req.params.userId

    
        let findCart = await cartModel.findOne({ userId: userId });
        if (!findCart) return res.status(404).send({ status: false, message: `No cart found with this '${userId}' userId` });

    
        if (findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

        let { cartId, productId, removeProduct, ...rest } = data;

        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "body is empty. provide some data mention from list: ( cartId, productId, removeProduct)" });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "only cartId, productId, removeProduct accepted" }) }

        if (!validator.isValidInput(removeProduct)) { return res.status(400).send({ status: false, message: "RemoveProduct is Mandatory." }) }
        if (removeProduct != 0 && removeProduct != 1) { return res.status(400).send({ status: false, message: "RemoveProduct must be 0 or 1!" }) }

        if (cartId || typeof cartId == 'string') {
            if (!validator.isValidInput(cartId)) return res.status(400).send({ status: false, message: "Enter a valid cartId" });
            if (!validator.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please Enter Valid CartId" })
            if (findCart._id.toString() !== cartId) return res.status(400).send({ status: false, message: "This is not your CartId, Please enter correct CartId." })
        }

        if (!validator.isValidInput(productId)) return res.status(400).send({ status: false, message: "Please Enter productId" })
        if (!validator.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please Enter Valid productId" })

        let getProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!getProduct) return res.status(404).send({ status: false, message: `No product found with this productId: '${productId}'.` })

        let getCart = await cartModel.findOne({ _id: findCart._id, 'items.productId': { $in: [productId] } })
        if (!getCart) return res.status(404).send({ status: false, message: `No product found in the cart with this productId: '${productId}'` })


        //--------------- Setting the Total Amount -------------//
        let totalAmount = getCart.totalPrice - getProduct.price
        let arr = getCart.items
        let totalItems = getCart.totalItems

        //------------ Condition for RemoveProduct value as 1 ---------------//
        if (removeProduct == 1) {

            for (let i = 0; i < arr.length; i++) {

                //------------- Condition for checking two Product is same or not ------------//
                if (arr[i].productId.toString() == productId) {
                    arr[i].quantity -= 1

                    if (arr[i].quantity < 1) {

                        totalItems--

                        let update1 = await cartModel.findOneAndUpdate({ _id: findCart._id }, { $pull: { items: { productId: productId } }, totalItems: totalItems }, { new: true }).populate('items.productId')

                        arr = update1.items
                        totalItems = update1.totalItems
                    }
                }
            }

            let updatePrice = await cartModel.findOneAndUpdate({ _id: findCart._id }, { $set: { totalPrice: totalAmount, items: arr, totalItems: totalItems } }, { new: true }).populate('items.productId')

            return res.status(200).send({ status: true, message: "Success", data: updatePrice })
        }

        //------------ Condition for RemoveProduct value as 0 ---------------//
        if (removeProduct == 0) {

            let totalItem = getCart.totalItems - 1

            for (let i = 0; i < arr.length; i++) {
                let prodPrice = getCart.totalPrice - (arr[i].quantity * getProduct.price)

                if (arr[i].productId.toString() == productId) {
                    let update2 = await cartModel.findOneAndUpdate({ _id: findCart._id }, { $pull: { items: { productId: productId } }, totalPrice: prodPrice, totalItems: totalItem }, { new: true }).populate('items.productId')

                    return res.status(200).send({ status: true, message: "Success", data: update2 })
                }
            }
        }

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}



//===================== [function get the Cart Data] =====================//
const getCart = async (req, res) => {

    try {

        let userId = req.params.userId;

       
        let carts = await cartModel.findOne({ userId: userId }).populate('items.productId')
        if (!carts) return res.status(404).send({ status: false, message: "cart does not exist!" })

        return res.status(200).send({ status: true, message: 'Success', data: carts })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}


//===================== [function for Delete the Cart Data] =====================//
const deleteCart = async (req, res) => {

    try {

        let userId = req.params.userId;

        let cartDelete = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
        if (!cartDelete) return res.status(404).send({ status: false, message: "cart does not exist!" })

        return res.status(204).send()

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}





module.exports = { createCart, getCart, deleteCart, updateCart }