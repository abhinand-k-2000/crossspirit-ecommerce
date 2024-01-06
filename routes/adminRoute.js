const express = require('express');
const admin_route = express.Router();

const { requireAdminAuth, checkAdmin} = require('../middleware/authMiddleware')

const adminController = require('../controllers/adminController')



admin_route.get('/', adminController.loadLogin) 
 


admin_route.post('/register', adminController.adminRegister)

admin_route.get('*', requireAdminAuth )
admin_route.use( checkAdmin )


// Verify admin login 
admin_route.post('/login', adminController.verifyLogin)

// Admin log out
admin_route.get('/logout', adminController.adminLogout)

// Loading home page of the admin panel
admin_route.get('/home', adminController.loadHome)

//Load the customers list
admin_route.get('/listCustomers', adminController.listCustomers)

// User blocking and unblocking
admin_route.post('/block-user/:userId', adminController.blockUser)
admin_route.post('/unblock-user/:userId', adminController.unblockUser)


// Load Add category page
admin_route.get('/add-category', adminController.loadAddCategory)

// Load Add Product page
admin_route.get('/add-product', adminController.loadAddProduct)

//Load Product list
admin_route.get('/product-list', adminController.loadProductsList)


module.exports = admin_route;