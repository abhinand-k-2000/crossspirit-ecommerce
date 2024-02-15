const mongoose = require('mongoose')
const Offer = require('../models/offerModel')

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true
    }, 
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
    },
    color: { 
        type: String,
        required: true,
    },
    category_id: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    images: {
        type: Array,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    offer: {
        type: mongoose.Types.ObjectId,
        ref: "Offer"
    },
    discountedPrice: {
        type: Number
    }


})


// Add pre middleware to associate offer with new product before saving
// productSchema.pre('save', async function (next) {
//     if (!this.categoryOffer && !this.productOffer) {
//         // Check for a category offer associated with the product's category
//         const categoryOffer = await Offer.findOne({ targetType: 'category', targetEntity: this.category_id });
        
//         if (categoryOffer) {
//             this.categoryOffer = categoryOffer._id;
//             this.CategoryOfferPrice = calculateDiscountedPrice(this.price, categoryOffer.percentage);
//         }

//         // You might want to add a similar check for productOffer here if needed
//     }
//     next();
// });


// Function to calculate the discounted price based on percentage
// function calculateDiscountedPrice(originalPrice, percentage) {
//     return Math.floor(originalPrice * (1 - percentage / 100));
// }

module.exports = mongoose.model("Product", productSchema)


