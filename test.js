// const JWT=require('jsonwebtoken')

// const authentication =async function (req,res){
//     try{
// let token=req.headers['authorization']
// token =token.slice(7)
// JWT.verify(token,'abc',function(err,decodedToken){
//     if(err){
//         return res.status(401).send({status:false,msg:'user not valid'})
//     }else{
//          req.token=decodedToken.userId
//     }
// })


//     }catch (err){
//         return res.status(500).send({status:false,msg:err.message})
//     }
// }




// const mongoose=require('mongoose')

// const userSchema=new mongoose.Schema({
//     fname:{
//         type:String,
//         required:true
//     }
// },{timestamp:true})

// module.exports=mongoose.model('User',userSchema)















