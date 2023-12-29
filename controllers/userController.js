const User = require('../models/userModel')
const nodemailer = require('nodemailer')
const mailgen = require('mailgen')
const bcrypt = require('bcrypt')

//password hashing function
const securePassword = async(password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error)
    }
}

// function to generate OTP
function generateOtp(){
    return Math.floor(1000 + Math.random() * 9000);
}

// function to send OTP
function sendOtp(email, OTP){
    let config = {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    }

    const transport = nodemailer.createTransport(config)

    let MailGenerator = new mailgen({
        theme: 'default',
        product: {
            name: 'Mailgen',
            link: 'http://mailgen.js/'
        }
    })

    let response = {
        body: {
            name: `${email}`,
            intro: `Yoour OTP is ${OTP}`,
            outro: "Looking forward"
        }
    }
    let mail = MailGenerator.generate(response)

    let message = {
        from: process.env.EMAIL,
        to: email,
        subject: "Otp sent successfully",
        html: mail
    }
    transport.sendMail(message)
}



//Loading the user registration
const loadUserRegister = (req, res) => {

    try {
        res.render('register')
    } catch (error) {
        console.log(error)
    }
}


let OTP;
let globalName, globalEmail, globalMobile, globalPassword





// Load Home Page
const loadHomePage = (req, res) => {
    try {
        res.render('index')
    } catch (error) {
        console.log(error)
    }
}


// Register a new user
const registerUser = async(req, res) => {

    globalName = req.body.name;
    globalEmail = req.body.email;
    globalMobile = req.body.mobile;
    // globalPassword = req.body.password;
    try {
        // const user = new User({
            // name: req.body.name, 
        //     email: req.body.email, 
        //     mobile: req.body.mobile,
        //     password: req.body.password
        // })
        globalPassword = await securePassword(req.body.password)
        // const email = req.body.email;

        const exsitingUser = await User.findOne({email: globalEmail});

        if(exsitingUser){
            return res.render('register', {message: "Email already exists, Please use a different email"})
        }

        // email verification //
         OTP = generateOtp();

        sendOtp(globalEmail, OTP)

        res.render('otp')

    } catch (error) {
        console.log(error) 
    }
}

const verifyOtp = async(req, res) => {

    const userOtp = req.body.otp;
    let parsedOtp = parseInt(userOtp);

    try {
        
        if(parsedOtp == OTP){

            let user = new User({
                name: globalName, 
                email: globalEmail,
                mobile: globalMobile,
                password: globalPassword
            })

            let userData = await user.save();
            if(userData){
                res.redirect('/login')
            }
        }else{
            console.log(typeof userOtp, typeof OTP)
            res.render('otp', {message: "Incorrect OTP"})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Internal server error"})
    }
}


//Loading login page of the user 
const loadLoginPage = (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error)
    }
}

//User logging
const userLogin = async(req, res) => {

    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email: email});

        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if(passwordMatch){
                console.log("entered")
                req.session.userId = userData._id;
                res.redirect('/')
            }else{
                res.render('login', {message: "Password is incorrect"})
            }
        }else{
            res.render('login', {message: "Email is incorrect"})
        } 
    } catch (error) {
        console.log(error)
    }


}














module.exports = {
    loadUserRegister, 
    registerUser,
    verifyOtp,
    loadLoginPage,
    userLogin,
    loadHomePage
}