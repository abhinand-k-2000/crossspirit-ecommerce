const express = require('express')
const router = express.Router()


const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')


const { requireAuth, checkUser } = require('../middleware/authMiddleware')
router.use( checkUser ) 
  

// Middleware for checking the user is blocked or not
const checkBlockedUser = require('../middleware/checkBlockedStatus');
router.use(checkBlockedUser);

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Middlewares for counting the items <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
router.use(cartController.fetchCartItemCount)
router.use(userController.fetchWishlistItemCount)
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>End of Middlewares for counting the items <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


//Loading the main page  
router.get('/', userController.loadHomePage)
   
//Loading user registration page, Registering new user
router.get('/register', userController.loadUserRegister)
router.post('/register', userController.registerUser) 
 
//verification of otp
router.post('/otpVerify', userController.verifyOtp)
router.post('/resent-otp', userController.resentOtp)

//Loading user login page, user login verification
router.get('/login', userController.loadLoginPage)
router.post('/login', userController.userLogin)

//Load the page of forgot password
router.get('/forgot-password', userController.loadForgotPassword)
router.post('/forgot-password-otp', userController.forgotPasswordOtp)
router.post('/fortgot-password-otp-verify', userController.verifyForgotPasswordOtp)
router.post('/new-password', userController.newPassword)

//View product details
router.get('/product-detail/:id', productController.viewProductDetails)
// router.get('/product-detail', productController.viewProductDetails)


router.get('/shop-grid', userController.loadShopGrid)   

router.get('/applyFilters', userController.loadFilter)

// router.get('/search', userController.loadSearch)
router.get('/search', userController.searchResult)  


// middleware for authorization


//Loading user dashboard 
router.get('/dashboard', requireAuth, userController.loadDashboard)
router.get('/user-account-details',requireAuth, userController.loadAccountDetails)   
router.post('/update-user-account',requireAuth, userController.updateUserAccount)
router.get('/user-change-password',requireAuth, userController.loadChangePassword)
router.post('/user-change-password',requireAuth, userController.changePassword)
router.get('/logout', userController.userLogout)
router.get('/orders',requireAuth, userController.loadOrders)
router.get('/order-full-details',requireAuth, userController.loadOrderFullDetails)
router.post('/order-cancel',requireAuth, userController.orderCancel)     
router.post('/order-return',requireAuth, userController.orderReturn)
router.get('/user-account-referral',requireAuth, userController.loadUserReferral)      


    




// -------------------------------------WISHLIST ROUTES -------------------------------------------------------------
router.get('/wishlist',requireAuth, userController.loadWishlist)
router.post('/add-to-wishlist',requireAuth, userController.addToWishlist)  
router.delete('/remove-from-wishlist', userController.removeFromWishlist)
// -------------------------------------END OF WISHLIST ROUTES -------------------------------------------------------------
   

//------------------------------------------------ADDRESS------------------------------------------------------------------------
router.get('/user-address',requireAuth, userController.loadUserAddress)
router.post('/add-address', userController.addAddress)   
router.post('/delete-address/:id', userController.deleteAddress);
router.post('/edit-address/:id', userController.editAddress)
//------------------------------------------------END OF ADDRESS------------------------------------------------------------------------



router.get('/checkout-details',requireAuth, userController.loadCheckoutDetails)
router.get('/checkout-payment',requireAuth, userController.loadCheckoutPayment)

router.post('/create-order',requireAuth, userController.createOrder)
router.get('/order-confirmation',requireAuth, userController.loadThankYouPage);

// Online payment ==>  Razor pay 
router.post('/create-razorpay-order', userController.razorpayPayment);

router.get('/invoice-generate',requireAuth, userController.invoiceGeneration)


//=====================================================COUPONS==========================================

router.post('/coupon/apply-coupon', userController.applyCoupon)
router.post('/coupon/remove-coupon', userController.removeCoupon)

//=====================================================COUPONS==========================================


//=====================================================END OF WALLET==========================================
router.get('/wallet',requireAuth, userController.loadWallet)
router.post('/wallet/add-amount', userController.addAmountToWallet)
router.post('/wallet/razorpay-payment-wallet', userController.razorpayWalletPayment)
router.post('/wallet/withdraw-amount', userController.withdrawAmountFromWallet)
router.get('/wallet/transactions',requireAuth, userController.loadTransactionHistory)     
//=====================================================END OF WALLET==========================================
   


module.exports = router


  