const multer = require("multer");
const path = require("path");
const Category = require("../models/categoryModel");
const sharp = require("sharp")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/category");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });



const addCategory = async (req, res, next) => {
  try {
    // Retrieve the uploaded category image
    const categoryImage = req.file;

    // const existingCategory = await Category.findOne({ name: { $regex: new RegExp("^" + req.body.name + "$", "i") } });
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(req.body.name, "i") } });
    

    if (existingCategory) {
      return res.render("add-category", { message: "Category already exists", color: "text-danger" });
    }

    // Use sharp to resize and crop the category image
    const croppedBuffer = await sharp(categoryImage.path)
      .resize({ width: 300, height: 400, fit: sharp.fit.cover })
      .webp({ quality: 100 })
      .toBuffer();      

    // Generate a filename with the original name and a prefix (you can adjust this as needed)
    const filename = `cropped_${categoryImage.originalname}`;

    // Save the cropped category image
    await sharp(croppedBuffer).toFile(`uploads/category/${filename}`);

    // Create a new Category instance
    const category = new Category({
      name: req.body.name,
      imagePath: filename, // Save the filename in the imagePath field
    });

    // Save the category data to the database
    const categoryData = await category.save();

    if (categoryData) {
      res.render("add-category", { message: "Category added Successfully", color: "text-success" });
    }
  } catch (error) {
    console.error('Error in adding category: ', error);
    next(error)
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

const unlistCategory = async (req, res, next) => {
  try {
    let id = req.params.id
    const categoryData = await Category.findByIdAndUpdate(id, {$set: {isDeleted: true}})
    res.redirect('/admin/categories')
  } catch (error) {
    console.log("Error in unlisting category: ", error)
    next(error)
  }
}

const listCategory = async (req, res, next) => {
  try {
    let id = req.params.id
    const categoryData = await Category.findByIdAndUpdate(id, {$set: {isDeleted: false}})
    res.redirect('/admin/categories')
  } catch (error) {
    console.log("Error in listing category: ", error)
    next(error)
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

const updateCategory = async (req, res, next) => {
  try {
    const id = req.params.id;

    const { name } = req.body;
    const image = req.file;

    // const existingName = await Category.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });

    // if (existingName) {
    //   return res.render(`edit-category`, { message: "Category already exists", color: "text-danger" });
    // }

    // Retrieve the existing category data
    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      // Category with the given id is not found
      return res.status(404).send('Category not found');
    }

    // Use sharp to resize and crop the category image
    let updatedImagePath = existingCategory.imagePath; // Default to existing imagePath

    if (image) {
      const croppedBuffer = await sharp(image.path)
        .resize({ width: 306, height: 408, fit: sharp.fit.cover })
        .toBuffer();

      // Generate a filename with the original name and a prefix
      const filename = `cropped_${image.originalname}`;

      // Save the cropped image to the specified directory
      await sharp(croppedBuffer).toFile(`uploads/category/${filename}`);

      // Update the imagePath if an image is provided
      updatedImagePath = filename;
    }

    // Update the category data with the new values
    const updateCategory = {
      ...(name && { name }),
      imagePath: updatedImagePath,
    };

    // Perform the update and get the updated category data
    const updatedCategoryData = await Category.findByIdAndUpdate(id, { $set: updateCategory }, { new: true });

    if (updatedCategoryData) {
      // Redirect to the categories page after successful update
      res.redirect('/admin/categories');
    } else {
      // Failed to update category
      return res.status(500).send('Failed to update category');
    }
  } catch (error) {
    console.log("Error in updaing category: ", error)
    next(error)
  }
};




module.exports = { addCategory, upload, loadCategories, unlistCategory, listCategory, loadEditCategory, updateCategory };
