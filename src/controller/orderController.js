const orderModel=require("../model/orderModel")
const userModel = require("../model/userModel")
const cartModel= require("../model/cartModel")
const validator = require("../validator/validator")



const createOrder = async(req,res)=>{
    try{
        let userId= req.params.userId
        let data = req.body
        // let cancellable = data.cancellable
        let{cartId, cancellable, ...rest}=data

        if (!validator.checkInput(data)) return res.status(400).send({status: false, message: "Body cannot be empty, provide mandatory inupts i.e. cartId, cancellable."})

        if (validator.checkInput(rest)) return res.status(400).send({status: false, message: "this field only accepts cartId, cancellable as input."})

        if (!validator.isValidObjectId(cartId)) return res.status(400).send({status: false, message: `Given CartId: ${cartId} is not valid`})
        
        let findcart= await cartModel.findOne({userId:userId,_id:cartId})

        if(!findcart) return res.status(404).send({status:false,message:"This cardId does not exits or deleted"})
        let obj={}

        if (cancellable) {
            if (!validator.isValidInput(cancellable)) return res.status(400).send({status: false, message: "Please enter cancellable"})
            if (!["true", "false"].includes(cancellable)) return res.status(400).send({status: false, message: "INVALID INPUT... this field accept only true or false."})
            obj.cancellable=cancellable
        }
        if (!validator.isValidObjectId(userId)) return res.status(400).send({status: false, message: `Given userId: ${userId} is not valid`})
        obj.userId=userId

        obj.items=findcart.items
        obj.totalPrice=findcart.totalPrice
        obj.totalItems=findcart.totalItems
        let quantity=0

        for(let i=0;i<findcart.items.length;i++)
        {
            quantity=quantity+findcart.items[i].quantity
        }
        obj.totalQuantity=quantity

        let orderCreate= await orderModel.create(obj)
        cartModel.findOneAndUpdate({ _id: cartId }, { items: [], totalItems: 0, totalPrice: 0 })

        res.status(201).send({status:true,message:"Success",data:orderCreate})
    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}



const updateOrder = async function (req,res){
    try{
        let userId=req.params.userId
        let data = req.body

        if (!validator.isValidObjectId(userId)) return res.status(400).send({status: false, message: `Given userId: ${userId} is not valid`})

        let {orderId,status, ...rest}=data

        if (!validator.checkInput(data)) return res.status(400).send({status: false, message: "give status input to update status with order id"})

        if (validator.checkInput(rest)) return res.status(400).send({status: false, message: "this field only accepts orderId and status as input."})


        if(!validator.isValidInput(orderId))  return res.status(400).send({status:false, message:"order id is required"})
        if (!validator.isValidObjectId(orderId)) return res.status(400).send({status: false, message: `Given OrderId: ${orderId} is not valid`})

        if (!validator.isValidInput(status)) return res.status(400).send({status:false, message:"Please provide status"})
        if (!["pending", "completed", "cancelled"].includes(status)) return res.status(400).send({status:false, message: `select ['pending', 'completed', 'cancelled'] one of these for input of status`})

        let checkCart = await cartModel.findOne({userId})
        if(!checkCart) return res.status(404).send({status:false, msg:"cart not found"})

        let checkOrder= await orderModel.findOne({_id:orderId,userId:userId,isDeleted:false})
        if(!checkOrder) return res.status(404).send({status:false, msg:"order not found"})

        let updateOrder=await orderModel.findOneAndUpdate({_id:orderId},{status:status},{new:true})

        return res.status(200).send({status:true, message:"Success",data:updateOrder})


    }
    catch(error){
        return res.status(500).send({status:false,error:error.message})
    }
}
module.exports={createOrder,updateOrder}