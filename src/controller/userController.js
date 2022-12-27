
const userModel = require('../model/userModel')
const JWT = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const uploadFile = require('../aws/aws')
const validator = require('../validator/validator')




//===================== [function used for Create User] =====================//
const createUser = async (req, res) => {

    try {

        let data = req.body
        let files = req.files

        
        let { fname, lname, email, profileImage, phone, password, address, ...rest } = data

        //--------------------- Checking Mandotory Field ---------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "Body cannot be empty. please Provide Mandatory Fields (i.e. fname, lname, email, profileImage, phone, password & address). " });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Only fname, lname, email, profileImage, phone, password & address should be present" }) }

        if (!address || address == '') return res.status(400).send({ status: false, message: "Please give the User Address." })

        data.address = JSON.parse(address) //Convert from JSON String to JSON Object of Address

        if (!validator.isValidInput(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });

        
        let { shipping, billing } = data.address


        //-------------------- Validations --------------------------//
        if (!validator.isValidInput(fname)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
        if (!validator.isValidName(fname)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... fname accepts only Alphabets' }) }

        if (!validator.isValidInput(lname)) { return res.status(400).send({ status: false, message: 'Please enter lname' }) }
        if (!validator.isValidName(lname)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... lname accepts only Alphabets' }) }

        if (!validator.isValidInput(email)) { return res.status(400).send({ status: false, message: 'Please enter the EmailId' }) }
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... Please provide valid emailId' }) }

        if (!validator.isValidInput(phone)) { return res.status(400).send({ status: false, message: 'Please enter the Mobile Number' }) }
        if (!validator.isValidMobileNumber(phone)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... Please provide valid Mobile Number' }) }

        if (!validator.isValidInput(password)) { return res.status(400).send({ status: false, message: 'Please enter the password' }) }
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "Invalid Password Format. password can have minimum 8 character and max 15 character and must contains one number, one uppar alphabet, one lower alphabet and one special character" }) }

        if (!shipping) return res.status(400).send({ status: false, message: "Enter Shipping Address." })

        if (!validator.isValidInput(shipping.street)) { return res.status(400).send({ status: false, message: 'Please enter Shipping street' }) }

        if (!validator.isValidInput(shipping.city)) { return res.status(400).send({ status: false, message: 'Please enter Shipping city' }) }
        if (!validator.isValidCity(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }

        if (!validator.isValidInput(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Please enter Shipping pin' }) }
        if (!validator.isValidPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }

        if (!billing) return res.status(400).send({ status: false, message: "Enter Billing Address." })

        if (!validator.isValidInput(billing.street)) { return res.status(400).send({ status: false, message: 'Please enter billing street' }) }

        if (!validator.isValidInput(billing.city)) { return res.status(400).send({ status: false, message: 'Please enter billing city' }) }
        if (!validator.isValidCity(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid billing city' }) }

        if (!validator.isValidInput(billing.pincode)) { return res.status(400).send({ status: false, message: 'Please enter billing pin' }) }
        if (!validator.isValidPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid billing Pin Code.' }) }

        data.password = await bcrypt.hash(password, 10) //Encrepting the password using Bcrypt


        //------------------------ Checking the given Email or Phone is already Present or Not ---------------//
        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `Provided EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.phone == phone) { return res.status(400).send({ status: false, message: `Provied Phone No.: ${phone} is already exist!` }) }
        }


        //----------------------- Checking the File is present or not and Creating S3 Link ----------------------//
        if (files && files.length > 0) {

            if (files.length > 1) return res.status(400).send({ status: false, message: "More than one File cannot be accepted" })
            if (!validator.isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "Please provide image file only" }) }

            data.profileImage = await uploadFile(files[0])
        }
        // else {
        //     return res.status(400).send({status: false, message: "Please provide image to complete profile" })
        // }


        
        let userCreated = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: userCreated })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}





//===================== [function is used for Login the User] =====================//
const userLogin = async function (req, res) {

    try {

        let data = req.body

        let { email, password, ...rest } = data

        //------------------- Checking Mandotory Field ------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "You have to input email and password." });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "You can enter only email and password." }) }

        //------------------------- Validations -----------------//
        if (!validator.isValidInput(email)) return res.status(400).send({ status: false, message: "EmailId required to login" })
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: "Invalid EmailID. Please input all letters in lowercase." }) }

        if (!validator.isValidInput(password)) return res.status(400).send({ status: false, message: "Password required to login" })
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "Invalid Password Format. password should be have minimum 8 character and max 15 character and must contains one number, one uppar alphabet, one lower alphabet and one special character " }) }

        //-------------------- Fetching user's Data from DB -------------------//
        const userData = await userModel.findOne({ email: email })
        if (!userData) { return res.status(401).send({ status: false, message: "Invalid Login Credentials! You need to register first." }) }

        //--------------- Decrypt the Password and Compare the password with User input ----------------//
        let checkPassword = await bcrypt.compare(password, userData.password)

        if (checkPassword) {

            const token = JWT.sign({ userId: userData['_id'].toString() }, "shhh", { expiresIn: 60 * 60 });

            let obj = { userId: userData['_id'], token: token }

            return res.status(200).send({ status: true, message: 'User login successfull', data: obj })

        } else {

            return res.status(401).send({ status: false, message: 'incorrect Password' })
        }

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}





//===================== This function is used for Get Data of User =====================//
const getUser = async function (req, res) {

    try {

        let userId = req.params.userId
        let tokenUserId = req.token

        //----------------- Checking the userId is Valid or Not ------------------//
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `Given UserId: ${userId} is not Valid` })

        if (userId !== tokenUserId) { return res.status(403).send({ status: false, message: "Not authorized to get User Details." }) }

        //----------------------Fetching user's data ------------------------//
        let getUser = await userModel.findOne({ _id: userId })
        if (!getUser) return res.status(404).send({ status: false, message: "User Data Not Found" })

        return res.status(200).send({ status: true, message: "User profile details", data: getUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}





//===================== [function used for Update the User] =====================//
const updateUserData = async function (req, res) {

    try {

        let data = req.body
        let files = req.files
        let userId = req.params.userId

        let { fname, lname, email, phone, password, address, ...rest } = data

        //--------------- Checking Mandotory Field --------------------//
        if (!(validator.checkInput(data)) && !(files)) return res.status(400).send({ status: false, message: "Atleast select one field Update from the list: (fname or lname or email or profileImage or phone or password or address)" });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Provide only fname or lname or email or profileImage or phone or password or address." })}


        let obj = {}

        //---------------------- Validations -----------------//
        if (fname || fname == '') {
            if (!validator.isValidInput(fname)) return res.status(400).send({ status: false, message: 'Please provide input for fname' })
            if (!validator.isValidName(fname)) return res.status(400).send({ status: false, message: 'fname should be in Alphabets' })
            obj.fname = fname
        }
        if (lname || lname == '') {
            if (!validator.isValidInput(lname)) return res.status(400).send({ status: false, message: 'Please provide input for lname' })
            if (!validator.isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' })}
            obj.lname = lname
        }
        if (email || email == '') {
            if (!validator.isValidInput(email)) return res.status(400).send({ status: false, message: 'Please provide input for email' })
            if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }
            obj.email = email
        }
        if (phone || phone == '') {
            if (!validator.isValidInput(phone)) return res.status(400).send({ status: false, message: 'Please provide input for phone' })
            if (!validator.isValidMobileNumber(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }
            obj.phone = phone
        }
        if (password || password== '') {
            if (!validator.isValidInput(password)) return res.status(400).send({ status: false, message: 'Please provide input password' })
            if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "password must contain minimum 8 character and max 15 character and one number, one uppar alphabet, one lower alphabet and one special character" }) }
            obj.password = await bcrypt.hash(password, 10)
        }

        //----------------------- Checking the File is present or not and Creating S3 Link ----------------------//
        if (files && files.length > 0) {
            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Update!" })
            if (!validator.isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }
            let uploadedURL = await uploadFile(files[0])
            obj.profileImage = uploadedURL
        }

        //----------------- Validation of Shipping Address ------------------//
    
        if (address || address=='') {
            if (!validator.isValidInput(address)) return res.status(400).send({ status: false, message: 'Please provide input for address' })
            obj.address = JSON.parse(address)
            let { shipping, billing } = address

            if (shipping) {
                if (shipping.street) { obj['address.shipping.street'] = shipping.street }
                if (shipping.city) {
                    if (!validator.isValidCity(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }
                    obj['address.shipping.city'] = shipping.city
                }
                if (shipping.pincode) {
                    if (!validator.isValidPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }
                    obj['address.shipping.pincode'] = shipping.pincode
                }
            }

            //--------------------- Validation of Billing Address ----------------------//
            if (billing) {
                if (billing.street) { obj['address.billing.street'] = billing.street }
                if (billing.city) {
                    if (!validator.isValidCity(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }
                    obj['address.billing.city'] = billing.city
                }
                if (billing.pincode) {
                    if (!validator.isValidPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }
                    obj['address.billing.pincode'] = billing.pincode
                }
            }
        }

        let updateUser = await userModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true })

        if (!updateUser) { return res.status(200).send({ status: true, message: "User not exist with this UserId." }) }


        return res.status(200).send({ status: true, message: "User profile has been updated", data: updateUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createUser, userLogin, getUser, updateUserData }