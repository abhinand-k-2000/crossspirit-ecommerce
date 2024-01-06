const express = require('express')
const category_route = express.Router()
const { requireAdminAuth } = require('../middleware/authMiddleware')


const categoryController = require('../controllers/categoryController')

category_route.post('/add-category', categoryController.upload.single('image'), categoryController.addCategory)

category_route.get('/categories',requireAdminAuth, categoryController.loadCategories)


// Category List and Unlist
category_route.post('/unlist-category/:id',requireAdminAuth, categoryController.unlistCategory)
category_route.post('/list-category/:id',requireAdminAuth, categoryController.listCategory)

category_route.get('/edit-category/:id', categoryController.loadEditCategory) 
category_route.post('/edit-category/:id', categoryController.upload.single('image'), categoryController.updateCategory) 



module.exports = category_route    