const express = require('express');
const product_route = express.Router();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'uploads/products/');
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

const productController = require('../controllers/productController')

product_route.post('/add-product',upload.array('images', 5),productController.addProduct)

// product_route.get('/product-details', productController.viewProductDetails)

product_route.post('/unlist-product/:id', productController.unlistProduct)
product_route.post('/list-product/:id', productController.listProduct)



product_route.get('/edit-product/:id', productController.loadEditProduct) 
product_route.post('/edit-product/:id', upload.array('images', 5), productController.updateProduct) 



module.exports = product_route