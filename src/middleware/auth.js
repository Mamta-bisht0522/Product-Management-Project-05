const JWT = require('jsonwebtoken')

const userModel = require('../model/userModel')

const validator = require('../validator/validator')



//===================== [Authentication] ======================//
const Authentication = async (req, res, next) => {
    try {

        let token = req.headers['authorization']
        // console.log(token)
        if (!token) { return res.status(400).send({ status: false, message: "Token must be Present." }) }
        token = token.slice(7) //removing Bearer with one whitespace from token
    
        JWT.verify(token, "shhh", function (error, decodedToken) {
            if (error) {
                return res.status(401).send({ status: false, message: "Invalid Token." })
            } else {
                req.token = decodedToken
                next()
            }
        })

    } catch (error) {

        res.status(500).send({ status: false, error: error.message })
    }
}



//===================== [Authorisation] =====================//
const Authorization = async (req, res, next) => {

    try {

        let userId = req.params.userId

        //------------------- Checking the userId is Valid or Not ----------------------//
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `This UserId: ${userId} is not valid!` })

        //---------------------- Fetching All User Data from DB ---------------------//
        let userData = await userModel.findById(userId)
        if (!userData) return res.status(404).send({ status: false, message: "User Does Not Exist" })

        //---------------------- Checking the userId is Authorized Person or Not ----------------//
        if (userData['_id'].toString() !== req.token.payload.userId) {
            return res.status(403).send({ status: false, message: "Unauthorized User Access!" })
        }

        next()

    } catch (error) {

        res.status(500).send({ status: false, error: error.message })
    }
}




module.exports = { Authentication, Authorization }