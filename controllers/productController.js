const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Wishlist = require("../models/wishlistModel");

const { default: mongoose } = require("mongoose");
const sharp = require("sharp");

const addProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.find({
      name: { $regex: new RegExp("^" + req.body.name + "$", "i") },
    });

    if (existingProduct.length > 0) {
      return res.render("add-product", {
        message: "The product name is already in use",
        colour: "text-danger",
      });
    }

    let arrImages = [];

    // Loop through each uploaded file and process it with sharp
    for (let i = 0; i < req.files.length; i++) {
      const image = req.files[i];

      // Use sharp to resize and crop the product image
      const croppedBuffer = await sharp(image.path)
        .resize({ width: 300, height: 400, fit: sharp.fit.cover })
        .toBuffer();

      // Generate a filename with the original name and a prefix
      const filename = `cropped_${image.originalname}`;

      // Save the cropped image to the specified directory
      await sharp(croppedBuffer).toFile(`uploads/products/${filename}`);

      // Add the filename to the array
      arrImages.push(filename);
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      countInStock: req.body.stock,
      color: req.body.color,
      category_id: req.body.category_id,
      images: arrImages,
    });

    const productData = await product.save();

    return res.render("add-product", {
      message: "Product added successfully",
      colour: "text-success",
    });
  } catch (error) {
    console.log("Error in adding the product: ", error);
    next(error);
  }
};

const viewProductDetails = async (req, res) => {
  try {
    let id = req.params.id;
    let productId = new mongoose.Types.ObjectId(req.params.id)
    const productData = await Product.findById(id).populate('offer')  

    if(res.locals.user){
      const userId = res.locals.user._id;
      const wishlistData = await Wishlist.aggregate([
        {
          $match: {
            user_id: userId, 
          }
        },
        {
          $unwind: "$items"
        },
        {
          $match: {         
            'items.product_id': productId
          }
        }
  
      ]);
      return res.render("product-details", { product: productData, wishlistData });

    } else{
      res.render("product-details", { product: productData });
    }
    
  } catch (error) {
    console.log(error);
  }
};

const unlistProduct = async (req, res, next) => {
  try {
    let id = req.params.id;
    await Product.findByIdAndUpdate(id, {
      $set: { isDeleted: true },
    });
    res.redirect("/admin/product-list");
  } catch (error) {
    console.log("Error in unlisting product: ", error);
    next(error);
  }
};

const listProduct = async (req, res, next) => {
  try {
    let id = req.params.id;

    await Product.findByIdAndUpdate(id, {
      $set: { isDeleted: false },
    });

    res.redirect("/admin/product-list");
  } catch (error) {
    console.log("Error in listing product: ", error);
    next(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const productData = await Product.findOne({ _id: id });
    // console.log(productData)
    res.render("edit-product", { product: productData });
  } catch (error) {
    console.log(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { name, countInStock, color, description, price, category_id } =
      req.body;
    const productImages = req.files.map((image) => image.filename);

    const fetchCategories = await Category.find();

    // Fetch the existing product data
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }

    // Update the properties individually
    existingProduct.name = name || existingProduct.name;
    existingProduct.countInStock = countInStock || existingProduct.countInStock;
    existingProduct.color = color || existingProduct.color;
    existingProduct.description = description || existingProduct.description;
    existingProduct.price = price || existingProduct.price;
    existingProduct.color = color || existingProduct.color;
    existingProduct.category_id = category_id || existingProduct.category_id;

    // Update images only if there are new images
    if (productImages.length > 0) {
      // Loop through each uploaded file and process it with sharp
      for (let i = 0; i < req.files.length; i++) {
        const image = req.files[i];

        // Use sharp to resize and crop the product image
        const croppedBuffer = await sharp(image.path)
          .resize({ width: 300, height: 400, fit: sharp.fit.cover })
          .toBuffer();

        // Generate a filename with the original name and a prefix
        const filename = `cropped_${image.originalname}`;

        // Save the cropped image to the specified directory
        await sharp(croppedBuffer).toFile(`uploads/products/${filename}`);

        // Add the filename to the existingProduct.images array
        existingProduct.images.push(filename);
      }
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.redirect("/admin/product-list");
    // Optionally, you can render the updated product data
    // return res.render('editProduct', { product: updatedProduct, categories: fetchCategories, message: 'Product updated successfully' });
  } catch (error) {
    console.log("Error from updateProduct ", error);
    next(error);
  }
};

const deleteProductImage = async (req, res, next) => {
  try {
    const productId = new mongoose.Types.ObjectId(req.params.productId);
    const imageId = req.params.imageId;

    // Check if the product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }

    // Find the index of the image in the product's images array
    const imageIndex = existingProduct.images.findIndex(
      (image) => image.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).send("Image not found");
    }

    // Remove the image from the images array
    // console.log('Before modification:', existingProduct);
    existingProduct.images.splice(imageIndex, 1);
    // console.log('After modification:', existingProduct);

    // Save the updated product
    await existingProduct.save();

    // res.json({ message: 'Image deleted successfully' });
    res.redirect("/admin/product-list");
  } catch (error) {
    console.error("Error from deleteProductImage ", error);
    next(error);
  }
};

module.exports = {
  addProduct,
  viewProductDetails,
  unlistProduct,
  listProduct,
  loadEditProduct,
  updateProduct,
  deleteProductImage,
};
