const User = require('../models/userModel')
const nodemailer = require('nodemailer')
const mailgen = require('mailgen')

const loadUserRegister = (req, res) => {

    try {
        res.render('register')
    } catch (error) {
        console.log(error)
    }
}

const registerUser = async(req, res) => {
    try {
        const user = new User({
            name: req.body.name, 
            email: req.body.email, 
            mobile: req.body.mobile,
            password: req.body.password
        })
        const email = req.body.email;
        const exsitingUser = await User.findOne({email: email});

        if(exsitingUser){
            return res.render('register', {message: "Email already exists, Please use a different email"})
        }

        // email verification //




        const userData = await user.save();
        if(userData){
            res.render('register', {message: " Registration Successful"})
        }else{
            res.render('register', {message: "Registration has been failed"})
        }
        // res.redirect('/'); 
    } catch (error) {
        console.log(error) 
    }
}



module.exports = {
    loadUserRegister, 
    registerUser
}