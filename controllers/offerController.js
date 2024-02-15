
const { default: mongoose } = require('mongoose');
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')


module.exports.loadOfferList = async (req, res, next) => {
    try {
        // const categoryOfferDetails = await Offer.find({targetType: 'category'}).populate("targetEntity")

        const categoryOfferDetails = await Offer.aggregate([
            {
                $match: {targetType: 'category'}
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "targetEntity",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category"
            }
              
        ])

        const productOfferDetails = await Offer.aggregate([
            {
                $match: {targetType: 'product'}
            },
            {
                $lookup: {
                    from: "products",
                    localField: "targetEntity",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            }
        ])
  
        res.render('offer-list', {categoryOffer: categoryOfferDetails, product: productOfferDetails})
    } catch (error) {
        console.log(error)
        next(error)
    }
}
      
module.exports.loadCategoryAddOffer = (req, res) => {
    try {
        res.render('add-category-offer');
    } catch (error) {
        console.log(error)
    }
}; 

module.exports.addOffer = async (req, res, next) => {
    try {
        const { percentage, targetEntity, targetType } = req.body;

        
        if (targetType == 'category') {

            if (!percentage || !targetEntity || !targetType) {
                return res.render("add-category-offer", { message: "Invalid input", color: "text-danger" });
            }
    
            const existingOffer = await Offer.findOne({ targetEntity: targetEntity });
    
            if (existingOffer) {
                return res.render("add-category-offer", { message: "Offer already exists", color: "text-danger" });
            }
    
            const offer = new Offer({
                targetEntity: targetEntity,
                targetType: targetType,
                percentage: percentage,
            });
    
            await offer.save();

            const productData = await Product.updateMany(
                { category_id: targetEntity },
                { $set: { offer: offer._id } } // Assuming 'offer' is the field in Product model
            );

            // // Calculate offerPrice and update products
            // await calculateOfferPriceAndUpdateProducts(offer._id);
            // res.render("add-category-offer", { message: `Offer Added Successfully - ${percentage}% discount for ${targetType} ${targetEntity}`, color: "text-success" });

        } else if (targetType == 'product') {

            const productNames = await Product.find({}, {name: 1})

            if (!percentage || !targetEntity || !targetType) {
                return res.render("add-product-offer", { message: "Invalid input",product: productNames, color: "text-danger" });
            }
    
            
            const existingOffer = await Offer.findOne({ targetEntity: targetEntity });
    
            if (existingOffer) {
                
                return res.render("add-product-offer", { message: "Offer already exists",product: productNames, color: "text-danger" });
            }
            
            const offer = new Offer({
                targetEntity: targetEntity,
                targetType: targetType,
                percentage: percentage,
            });
    
            await offer.save();
            console.log("after saveing")


            // Use findByIdAndUpdate directly with the product's _id
            const productData = await Product.findByIdAndUpdate(
                targetEntity,
                { $set: { offer: offer._id } }
            );

            // Calculate productOfferPrice and update product
            // await calculateProductOfferPriceAndUpdateProduct(offer._id);
             return res.render("add-product-offer", { message: `Offer Added Successfully - ${percentage}% discount for ${targetType} ${targetEntity}`,product: productNames , color: "text-success" });
        }

        // Provide user feedback with offer details
        res.render("add-category-offer", { message: `Offer Added Successfully - ${percentage}% discount for ${targetType} ${targetEntity}`, color: "text-success" });
    } catch (error) {
        console.log(error);
        next(error);
    }
};


const calculateOfferPriceAndUpdateProducts = async (offerId) => {
    try {
        // Find the offer document
        const offer = await Offer.findById(offerId);

        // Check if the offer exists and is not expired
        if (offer) { 
            const productsToUpdate = await Product.find({ categoryOffer: offer._id });

            // Update each product's offerPrice based on the percentage
            for (const product of productsToUpdate) {
                const CategoryOfferPrice = Math.floor(product.price * (1 - offer.percentage / 100));
                await Product.findByIdAndUpdate(product._id, { $set: { CategoryOfferPrice } });
            }
        } 
        
    } catch (error) {
        console.error(error);
    }
};




module.exports.loadEditCategoryOffer = async (req, res) => {
    try {
        const {offerId} = req.query
        
        // const offerData = await Offer.findById(offerId)
        // 

        const offerData = await Offer.aggregate([
            {
                $match: {_id: new mongoose.Types.ObjectId(offerId)}
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "targetEntity",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category"
            }
        ])

        res.render('edit-category-offer', {offer: offerData[0]})
    } catch (error) {
        console.log(error)
    }
}


module.exports.editCategoryOffer = async (req, res, next) => {
    try {
        const {percentage, offerId} = req.body;

        const updatedOffer = await Offer.findByIdAndUpdate(offerId,
            {$set: {percentage: percentage}},
            {new: true}
        );

        if(!updatedOffer){
            return res.status(400).send("Offer not found!")
        }

     
        const productData = await Product.updateMany(
            {category_id: updatedOffer.targetEntity},
            {$set: {offer: updatedOffer._id}}
        )

        // Calculate offerPrice and update products
    // await calculateOfferPriceAndUpdateProducts(offerId);

        res.redirect('/admin/offer-list')
    } catch (error) {
        console.log(error);
        next(error)
    }
}


//-------------------------------------product offer ---------------------------------------

module.exports.loadProductAddOffer = async (req, res) => {
    try {
        const productNames = await Product.find({}, {name: 1})
        // console.log(productNames)
        res.render('add-product-offer', {product: productNames})
    } catch (error) {
        console.log(error)
    }
}

module.exports.loadEditProductOffer = async (req, res) => {
    try {
        const {offerId} = req.query;  
        const productOfferDetails = await Offer.aggregate([
            {
                $match: {_id: new mongoose.Types.ObjectId(offerId)}
            },
            {
                $lookup: {
                    from: "products",
                    localField: "targetEntity",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            }
        ])
        res.render('edit-product-offer', {offer: productOfferDetails[0]})
    } catch (error) {
        console.log(error) 
    }
}

module.exports.editProductOffer = async (req, res) => {
    try {
        const {percentage, offerId} = req.body;

        const updatedOffer = await Offer.findByIdAndUpdate(offerId,
            {$set: {percentage: percentage}},
            {new: true}
        );

        if(!updatedOffer){
            return res.status(400).send("Offer not found!")
        }
        // Calculate offerPrice and update products
    // await calculateProductOfferPriceAndUpdateProduct(offerId);


    const productData = await Product.findByIdAndUpdate(
        updatedOffer.targetEntity,
        {$set: {offer: updatedOffer._id}}
    )

        res.redirect('/admin/offer-list')
        console.log(offerId)
    } catch (error) {
        console.log(error);
        next(error)
    }
}


const calculateProductOfferPriceAndUpdateProduct = async (offerId) => {
    try {
        // Find the offer document
        const offer = await Offer.findById(offerId);

        // Check if the offer exists
        if (offer) {
            const productToUpdate = await Product.findOne({ productOffer: offer._id });

            // Check if the product exists
            if (productToUpdate) {
                // Check if the offer is not expired
                // if (!offer.expiryDate) {
                    // Update each product's offerPrice based on the percentage
                    const productOfferPrice = Math.floor(productToUpdate.price * (1 - offer.percentage / 100));
                    await Product.findByIdAndUpdate(productToUpdate._id, { $set: { productOfferPrice } });
                // } else {
                //     // Handle case when the offer is expired (e.g., set productOfferPrice to null or a default value)
                //     await Product.findByIdAndUpdate(productToUpdate._id, { $set: { productOfferPrice: null } });
                // }
            } else {
                // Handle case when no product is found for the offer
                console.error(`No product found for offer ID: ${offerId}`);
            }
        } else {
            // Handle case when no offer is found
            console.error(`No offer found with ID: ${offerId}`);
        }
    } catch (error) {
        console.error(error);
    }
};

