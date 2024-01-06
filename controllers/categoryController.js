const multer = require("multer");
const path = require("path");
const Category = require("../models/categoryModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/category");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const addCategory = async (req, res) => {
  try {
    
    const existingCategory = await Category.findOne({ name: {$regex: new RegExp("^" + req.body.name + "$", "i")} });

    if (existingCategory) {
      // return res.status(200).send({success: true, msg: "This category already exists"})
      return res.render("add-category", { message: "Category already exists", color: "Red" });
    }
    const category = new Category({
      name: req.body.name,
      imagePath: req.file ? req.file.filename : null,
    });

    // let existingCategory = await Category.findOne({name: name})

    const categoryData = await category.save();

    if (categoryData) {
      res.render("add-category", { message: "Category added Successfully", color: "Green" });
    }
    // res.status(201).send({success: true, msg: "category data", data: categoryData})
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const loadCategories = async (req, res) => {
    try {

        const categoryData = await Category.find({})
        res.render('categories', {category: categoryData})
    } catch (error) {
        console.log(error)
    }
}

const unlistCategory = async (req, res) => {
  try {
    let id = req.params.id
    const categoryData = await Category.findByIdAndUpdate(id, {$set: {isDeleted: true}})
    res.redirect('/admin/categories')
  } catch (error) {
    console.log(error)
  }
}

const listCategory = async (req, res) => {
  try {
    let id = req.params.id
    const categoryData = await Category.findByIdAndUpdate(id, {$set: {isDeleted: false}})
    res.redirect('/admin/categories')
  } catch (error) {
    console.log(error)
  }
}

const loadEditCategory = async (req, res) => {
  try {
    const id = req.params.id
    const categoryData = await Category.findById(id)

    res.render('edit-category', {category: categoryData})
  } catch (error) {
    console.log(error)
  }
}

const updateCategory = async (req, res) => {
  try {
    const id = req.params.id
    
    const {name} = req.body;
    const image=  req.file;

    const updateCategory = {
      ...(name && {name}),
      ...(image && {imagePath: image.filename})
    }

    const categoryData = await Category.findByIdAndUpdate(id, {$set: updateCategory}, {new:true})
    if(categoryData){
      res.redirect('/admin/categories')
    }else{
      //Product with given id is not found
      return res.status(404).send('category not found')
    }
    
  } catch (error) {
    console.log("Error from update product", error)
    return res.status(500).send("Internal server error")
  }
};



module.exports = { addCategory, upload, loadCategories, unlistCategory, listCategory, loadEditCategory, updateCategory };
