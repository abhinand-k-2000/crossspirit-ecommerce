const express = require('express')
const router = express.Router()


const userController = require('../controllers/userController')
// const userAuth = require('../middleware/userAuth')
const { requireAuth, checkUser } = require('../middleware/authMiddleware')

router.use( checkUser ) 





// Middleware for checking the user is blocked or not
// const checkBlockedStatus = require('../middleware/checkBlockedStatus');
// router.use(checkBlockedStatus)



 









//Loading the main page
router.get('/', userController.loadHomePage)

//Loading user registration page, Registering new user
router.get('/register', userController.loadUserRegister)
router.post('/register', userController.registerUser) 

//verification of otp
router.post('/otpVerify', userController.verifyOtp)

//Loading user login page, user login verification
router.get('/login', userController.loadLoginPage)
router.post('/login', userController.userLogin)

//Loading user dashboard
router.get('/dashboard', requireAuth, userController.loadDashboard)


//User logout
router.get('/logout', userController.userLogout)


const productController = require('../controllers/productController')
//View product details
router.get('/product-detail/:id', productController.viewProductDetails)
router.get('/product-detail', productController.viewProductDetails)




module.exports = router


  