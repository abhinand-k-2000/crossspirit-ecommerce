const express = require("express")
const cart_route = express.Router()

const { requireAuth, checkUser } = require('../middleware/authMiddleware')

const {addToCart, loadCart, removeItem, updateQuantity} = require('../controllers/cartController')

cart_route.get('/cart', requireAuth, loadCart)
cart_route.post('/add-to-cart/:id',requireAuth, addToCart )
// cart_route.post('/remove-item/:id', removeItem ) 
cart_route.post('/remove-item/:id', removeItem);

cart_route.post('/update-quantity/:id',  updateQuantity);




module.exports = cart_route