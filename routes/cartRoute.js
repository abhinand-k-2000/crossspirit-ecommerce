const express = require("express")
const cart_route = express.Router()

const { requireAuth, checkUser } = require('../middleware/authMiddleware')

const {addToCart, loadCart, removeItem, updateQuantity, getCartStatus} = require('../controllers/cartController')

cart_route.get('/cart', requireAuth, loadCart)
cart_route.post('/add-to-cart/:id',requireAuth, addToCart )
// cart_route.post('/remove-item/:id', removeItem ) 
cart_route.post('/remove-item/:id', removeItem);

cart_route.post('/update-quantity/:id',  updateQuantity);

cart_route.get('/get-cart-status', getCartStatus)




module.exports = cart_route