const orderModel=require("../model/orderModel")
const userModel = require("../model/userModel")
const cartModel= require("../model/cartModel")
const validator = require("../validator/validator")



const createOrder = async(req,res)=>{
    try{
        let userId= req.params.userId
        let data = req.body
        let{cartId,cancellable}=data

        let findcart= await cartModel.findOne({userId:userId,_id:cartId})

        if(!findcart) return res.status(404).send({status:false,message:"This cardId does not exits"})
        let obj={}
        obj.cancellable=cancellable
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

        let {orderId,status}=data

        if(!orderId)  return res.status(400).send({status:false, msg:"order id is required"})

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