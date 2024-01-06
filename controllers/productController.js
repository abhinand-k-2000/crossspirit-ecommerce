const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// const addProduct = async (req, res) => {
//   try {

//     const existingProduct = await Product.find({name: {$regex: new RegExp("^" + req.body.name + "$", "i")}}) 

//     if(existingProduct){
//       res.render("add-product", { message: "The product name is already in use", color: "Red" });
//     }

//     let arrImages = [];
//     for (let i = 0; i < req.files.length; i++) {
//       arrImages[i] = req.files[i].filename;
//     }
//     const samp = req.body.name;
//     console.log(samp);

//     let product = new Product({
//       name: req.body.name,
//       description: req.body.description,
//       price: req.body.price,
//       countInStock: req.body.stock,
//       color: req.body.color,
//       category_id: req.body.category_id,
//       images: arrImages,
//     });

//     const productData = await product.save();

//     // res.status(200).send({success: true, msg: "product details ", data: productData})
//     res.render("add-product", { message: "Product added successfully",  color: "Red" });
//   } catch (error) {
//     res.status(400).send({ success: false, msg: error.message });
//   }
// };


const addProduct = async (req, res) => {
  try {
    const existingProduct = await Product.find({
      name: { $regex: new RegExp("^" + req.body.name + "$", "i") },
    });

    if (existingProduct.length > 0) {
      return res.render("add-product", {
        message: "The product name is already in use",
        color: "Red",
      });
    }

    let arrImages = [];
    for (let i = 0; i < req.files.length; i++) {
      arrImages[i] = req.files[i].filename;
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
      color: "Green",
    });
  } catch (error) {
    return res.status(400).send({ success: false, msg: error.message });
  }
};



const viewProductDetails = async (req, res) => {
  try {
    let id = req.params.id;
    const productData = await Product.findById(id);
    res.render("product-details", { product: productData });
  } catch (error) {
    console.log(error);
  }
};

const unlistProduct = async (req, res) => {
  try {
    let id = req.params.id;
    await Product.findByIdAndUpdate(id, {
      $set: { isDeleted: true },
    });
    res.redirect("/admin/product-list");
  } catch (error) {
    console.log(error);
  }
};

const listProduct = async (req, res) => {
  try {    
    let id = req.params.id;

    await Product.findByIdAndUpdate(id, {
      $set: { isDeleted: false },
    });

    res.redirect("/admin/product-list");
  } catch (error) {
    console.log(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id
    const productData = await Product.findOne({_id: id})
    
    res.render('edit-product', {product: productData})
  } catch (error) {
    console.log(error)
  }
}


const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, countInStock, color, description, price } = req.body;
    const productImages = req.files.map(image => image.filename);

    const fetchCategories = await Category.find();
    
    // Fetch the existing product data
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).send('Product not found');
    }

    // Update the properties individually
    existingProduct.name = name || existingProduct.name;
    existingProduct.countInStock = countInStock || existingProduct.countInStock;
    existingProduct.color = color || existingProduct.color;
    existingProduct.description = description || existingProduct.description;
    existingProduct.price = price || existingProduct.price;
    existingProduct.color = price || existingProduct.color;
    

    // Update images only if there are new images
    if (productImages.length > 0) {
      existingProduct.images = productImages;
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.redirect('/admin/product-list');
    // Optionally, you can render the updated product data
    // return res.render('editProduct', { product: updatedProduct, categories: fetchCategories, message: 'Product updated successfully' });
  } catch (error) {
    console.log("Error from updateProduct ", error);
    return res.status(500).send('Internal Server Error');
  }
}



module.exports = {
  addProduct,
  viewProductDetails,
  unlistProduct,
  listProduct,
  loadEditProduct,
  updateProduct
};
 