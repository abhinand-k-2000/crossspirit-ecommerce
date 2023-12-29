const express = require('express')
const router = express.Router()
const app = express()

const userController = require('../controllers/userController')

router.get('/', userController.loadHomePage)

router.get('/register', userController.loadUserRegister)
router.post('/register', userController.registerUser)

router.post('/otpVerify', userController.verifyOtp)


router.get('/login', userController.loadLoginPage)
router.post('/login', userController.userLogin)



module.exports = router


 