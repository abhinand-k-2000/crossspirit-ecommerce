const express = require('express')

const offer_route = express.Router()

const {loadCategoryAddOffer, addOffer, loadOfferList, loadEditCategoryOffer, editCategoryOffer,
    loadProductAddOffer, loadEditProductOffer, editProductOffer} = require('../controllers/offerController')

offer_route.get('/offer-list', loadOfferList )

offer_route.get('/add-category-offer', loadCategoryAddOffer)

//=====================================ADD OFFER FOR CATEGORY AND PRODUCT========================================
offer_route.post('/add-offer', addOffer)
//===============================================================================================================

offer_route.get('/edit-category-offer', loadEditCategoryOffer)
offer_route.post('/edit-category-offer', editCategoryOffer)    

// ----------------------------------------product offer ---------------------------------------------------------

offer_route.get('/add-product-offer', loadProductAddOffer)
offer_route.get('/edit-product-offer', loadEditProductOffer)
offer_route.post('/edit-product-offer', editProductOffer)

module.exports = offer_route 