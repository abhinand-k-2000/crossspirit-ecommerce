const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const authService = require('../services/jwt')

const  loadLogin = async (req, res) => { 
  try {
    if(req.cookies['admin-token']){
      res.redirect('/admin/home')
    }
    res.render("admLogin");
  } catch (error) {
    console.log(error);
  }
};

const adminRegister = async (req, res) => {
  try {
    const admin = new Admin({
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
    });

    const adminData = await admin.save();

    if (adminData) {
      res.send("new admin created successfully");
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const adminData = await Admin.findOne({ email: email });

  if (adminData) {
    if (password == adminData.password) {

      // Creating the jwt token to the admin 
      const adminToken = authService.createToken(adminData._id);
      res.cookie("admin-token", adminToken, {
        httpOnly: true, 
        maxAge: authService.maxAge * 1000
      })

      res.redirect("/admin/home");
    } else {
      res.render("admLogin", { message: "Invalid email or password" });
    }
  } else {
    res.render("admLogin", { message: "Invalid email or password" });
  }
};

const adminLogout = async (req, res) => {
  try {
    res.cookie("admin-token", "", {maxAge: 1})
    res.redirect('/admin')
  } catch (error) {
    console.log(error)
  }
}

const loadHome = async (req, res) => {
  try {
    res.render("admHome");
  } catch (error) {
    console.log(error);
  }
};
 
const listCustomers = async (req, res) => {
  try {
    const usersData = await User.find({});
    // let oneUser = null; // Initialize oneUser to null

    // if (req.session.userId) {
    //   oneUser = await User.findById({ _id: req.session.userId });
    // }
    res.render("customers", { users: usersData });
  } catch (error) {
    console.log(error);
  }
};


const blockUser = async (req, res) => {
  try {
    const id = req.params.userId;
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          isBlocked: true,
        },
      }
    );
    res.redirect("/admin/listCustomers");
  } catch (error) {
    console.log(error);
  }
};

const unblockUser = async (req, res) => {
  try {
    const id = req.params.userId;
    console.log(id)
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          isBlocked: false,
        },
      }
    );
    res.redirect("/admin/listCustomers");
  } catch (error) {
    console.log(error);
  }
}; 

const loadAddCategory = async (req, res) => {

  try {
    res.render('add-category')
  } catch (error) {
    console.log(error)
  }

}

const loadAddProduct = async (req, res) => {
  try {
    res.render('add-product')
  } catch (error) {
    console.log(error)
  }
}


const loadProductsList =  async (req, res) => {
  try {

    const productData = await Product.find().populate('category_id');
   
    res.render('product-list', {product: productData})
  } catch (error) {
    console.log(error)
  }
}






















module.exports = {
  loadLogin,
  adminRegister,
  verifyLogin,
  loadHome,
  adminLogout,
  listCustomers,
  blockUser,
  unblockUser,
  loadAddCategory,
  loadAddProduct,
  loadProductsList
}; 
