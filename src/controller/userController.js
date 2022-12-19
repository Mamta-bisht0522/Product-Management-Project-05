
const userModel = require('../model/userModel')
const JWT = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const saltRounds = 10
const uploadFile = require('../aws/aws')
const validator = require('../validator/validator')




//===================== [function used for Create User] =====================//
const createUser = async (req, res) => {

    try {

        let data = req.body
        let files = req.files

        
        let { fname, lname, email, profileImage, phone, password, address, ...rest } = data

        //--------------------- Checking User Body Data ---------------------//
        if (!validator.checkInputsPresent(data)) return res.status(400).send({ status: false, message: "No data found from body! You need to put the Mandatory Fields (i.e. fname, lname, email, profileImage, phone, password & address). " });
        if (validator.checkInputsPresent(rest)) { return res.status(400).send({ status: false, message: "You can input only fname, lname, email, profileImage, phone, password & address." }) }

        if (!address || address == '') return res.status(400).send({ status: false, message: "Please give the User Address." })

        //--------------------- Convert from JSON String to JSON Object of Address ----------------------//
        data.address = JSON.parse(address)

        if (!validator.isValidBody(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });

        //----------------------- Destructuring Address from Object Data ---------------------//
        let { shipping, billing } = data.address


        //-------------------- Validation of Data --------------------------//
        if (!validator.isValidBody(fname)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
        if (!validator.isValidName(fname)) { return res.status(400).send({ status: false, message: 'fname should be in Alphabets' }) }

        if (!validator.isValidBody(lname)) { return res.status(400).send({ status: false, message: 'Please enter lname' }) }
        if (!validator.isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' }) }

        if (!validator.isValidBody(email)) { return res.status(400).send({ status: false, message: 'Please enter the EmailId' }) }
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }

        if (!validator.isValidBody(phone)) { return res.status(400).send({ status: false, message: 'Please enter the Mobile Number' }) }
        if (!validator.isValidMobileNumber(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }

        if (!validator.isValidBody(password)) { return res.status(400).send({ status: false, message: 'Please enter the password' }) }
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "To make strong Password Should be use 8 to 15 Characters which including letters, atleast one special character and at least one Number." }) }


        //---------------------- Validation of Shipping Address ---------------------//
        if (!shipping) return res.status(400).send({ status: false, message: "Enter Shipping Address." })

        if (!validator.isValidBody(shipping.street)) { return res.status(400).send({ status: false, message: 'Please enter Shipping street' }) }

        if (!validator.isValidBody(shipping.city)) { return res.status(400).send({ status: false, message: 'Please enter Shipping city' }) }
        if (!validator.isValidCity(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }

        if (!validator.isValidBody(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Please enter Shipping pin' }) }
        if (!validator.isValidPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }


        //------------------------- Validation of Billing Address ------------------------//
        if (!billing) return res.status(400).send({ status: false, message: "Enter Billing Address." })

        if (!validator.isValidBody(billing.street)) { return res.status(400).send({ status: false, message: 'Please enter billing street' }) }

        if (!validator.isValidBody(billing.city)) { return res.status(400).send({ status: false, message: 'Please enter billing city' }) }
        if (!validator.isValidCity(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid billing city' }) }

        if (!validator.isValidBody(billing.pincode)) { return res.status(400).send({ status: false, message: 'Please enter billing pin' }) }
        if (!validator.isValidPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid billing Pin Code.' }) }


        //---------------------- Encrept the password by thye help of Bcrypt -----------------------//
        data.password = await bcrypt.hash(password, saltRounds)


        //------------------------ Fetching data of Email from DB and Checking Duplicate Email or Phone is Present or Not ---------------//
        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `This EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.phone == phone) { return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` }) }
        }


        //----------------------- Checking the File is present or not and Create S3 Link ----------------------//
        if (files && files.length > 0) {

            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Create!" })
            if (!validator.isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }

            data.profileImage = await uploadFile(files[0])
        }
        else {
            return res.status(400).send({ msg: "Please put image to create registration!" })
        }


        
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

        //------------------- Checking User input is Present or Not ------------------//
        if (!validator.checkInputsPresent(data)) return res.status(400).send({ status: false, message: "You have to input email and password." });
        if (validator.checkInputsPresent(rest)) { return res.status(400).send({ status: false, message: "You can enter only email and password." }) }

        //------------------------- Validating Email and Password -----------------//
        if (!validator.isValidBody(email)) return res.status(400).send({ status: false, message: "EmailId required to login" })
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: "Invalid EmailID Format or Please input all letters in lowercase." }) }

        if (!validator.isValidBody(password)) return res.status(400).send({ status: false, message: "Password required to login" })
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "Invalid Password Format! Password Should be 8 to 15 Characters and have a mixture of uppercase and lowercase letters and contain one symbol and then at least one Number." }) }

        //-------------------- Fetch Data from DB -------------------//
        const userData = await userModel.findOne({ email: email })
        if (!userData) { return res.status(401).send({ status: false, message: "Invalid Login Credentials! You need to register first." }) }

        //--------------- Decrypt the Password and Compare the password with User input ----------------//
        let checkPassword = await bcrypt.compare(password, userData.password)

        if (checkPassword) {

            let payload = {
                userId: userData['_id'].toString()
                
            }

            const token = JWT.sign({ payload }, "shhh", { expiresIn: 60 * 60 });

            //--------------------- Create a Object for Response ----------------------//
            let obj = { userId: userData['_id'], token: token }

            return res.status(200).send({ status: true, message: 'User login successfull', data: obj })

        } else {

            return res.status(401).send({ status: false, message: 'Wrong Password' })
        }

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}





//<<<===================== This function is used for Get Data of User =====================>>>//
const getUser = async function (req, res) {

    try {

        let userId = req.params.userId
        let tokenUserId = req.token.payload.userId

        //===================== Checking the userId is Valid or Not by Mongoose =====================//
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `Please Enter Valid UserId: ${userId}.` })

        if (userId !== tokenUserId) { return res.status(403).send({ status: false, message: "You are not Authorized to get User Details." }) }

        //x=====================Fetching All Data from Book DB=====================x//
        let getUser = await userModel.findOne({ _id: userId })
        if (!getUser) return res.status(404).send({ status: false, message: "User Data Not Found" })

        return res.status(200).send({ status: true, message: "User profile details", data: getUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}





//<<<===================== This function is used for Update the User =====================>>>//
const updateUserData = async function (req, res) {

    try {

        let data = req.body
        let files = req.files
        let userId = req.params.userId

        //===================== Destructuring User Body Data =====================//
        let { fname, lname, email, phone, password, address, ...rest } = data

        //=====================Checking User input is Present or Not =====================//
        if (!(validator.checkInputsPresent(data)) && !(files)) return res.status(400).send({ status: false, message: "Atleast one field required for Update(i.e. fname or lname or email or profileImage or phone or password or address)!" });
        if (validator.checkInputsPresent(rest)) { return res.status(400).send({ status: false, message: "You can enter only fname or lname or email or profileImage or phone or password or address." }) }


        //===================== Create a Object =====================//
        let obj = {}

        //<<<===================== Validation of Given Credentials of User and Store the value in OBJ =====================>>>//
        if (fname) {
            if (!validator.isValidName(fname)) { return res.status(400).send({ status: false, message: 'fname should be in Alphabets' }) }
            obj.fname = fname
        }
        if (lname) {
            if (!validator.isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' }) }
            obj.lname = lname
        }
        if (email) {
            if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }
            obj.email = email
        }
        if (phone) {
            if (!validator.isValidMobileNumber(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }
            obj.phone = phone
        }
        if (password) {
            if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "password should be have minimum 8 character and max 15 character" }) }
            obj.password = await bcrypt.hash(password, saltRounds)
        }

        //===================== Checking the File is present or not and Create S3 Link =====================//
        if (files && files.length > 0) {
            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Update!" })
            if (!validator.isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }
            let uploadedURL = await uploadFile(files[0])
            obj.profileImage = uploadedURL
        }

        //===================== Validation of Shipping Address and Store the value in OBJ =====================//
        if (address) {
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

            //===================== Validation of Billing Address and Store the value in OBJ =====================//
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


        //x===================== Final Updation of User Document =====================x//
        let updateUser = await userModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true })

        if (!updateUser) { return res.status(200).send({ status: true, message: "User not exist with this UserId." }) }


        return res.status(200).send({ status: true, message: "User profile updated", data: updateUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}



//===================== Module Export =====================//
module.exports = { createUser, userLogin, getUser, updateUserData }