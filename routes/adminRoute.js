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


//===============================================ORDER============================================================
admin_route.get('/order/order-list', adminController.loadOrderList)
admin_route.get('/order/full-details/:id', adminController.loadOrderFullDetails)
admin_route.post('/order/update-order-status', adminController.updateOrderStatus)
//===============================================END OF ORDER=======================================================


// ================================================SALES REPORT====================================================
admin_route.get('/sales-report', adminController.loadSalesReport);
admin_route.post('/sales-report', adminController.displaySalesReport);
admin_route.get('/generate-order-summary-pdf', adminController.generateSalesReportPdf)
// ================================================END OF SALES REPORT=============================================



//=====================================================COUPONS==========================================
admin_route.get('/coupon/coupon-list', adminController.loadCouponList)
admin_route.get('/coupon/add-coupon', adminController.loadAddCoupon)
admin_route.post('/coupon/add-coupon', adminController.addCoupon)
admin_route.get('/coupon/edit-coupon', adminController.loadEditCoupon)
admin_route.post('/coupon/edit-coupon', adminController.editCoupon)
//=====================================================COUPONS==========================================

 

//=====================================================REFERAL OFFER=================================================
admin_route.get('/referral', adminController.loadReferral)
admin_route.get('/referral/add-referral', adminController.loadAddReferral)
admin_route.post('/referral/add-referral', adminController.addReferral)
//=====================================================END OF REFERAL OFFER==========================================



module.exports = admin_route;