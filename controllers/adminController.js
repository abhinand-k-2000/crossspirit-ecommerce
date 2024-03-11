const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const Category = require("../models/categoryModel");
const Coupon = require("../models/couponModel")
const Referral = require("../models/referralCodeModel")

const mongoose = require("mongoose");
const moment = require("moment");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer-core")

const authService = require("../services/jwt");

const loadLogin = async (req, res) => {
  try {
    if (req.cookies["admin-token"]) {
      res.redirect("/admin/home");
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
        maxAge: authService.maxAge * 1000,
      });

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
    res.cookie("admin-token", "", { maxAge: 1 });
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res, next) => {
  try {
    // Fetching counts
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();

    // Fetching total revenue
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total_amount" },
        },
      },
    ]);
    const [result] = totalRevenue;
    const totalAmount = result ? result.totalAmount : 0;

    // Fetching total cancelled orders
    const totalCancelled = await Order.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: { "items.status": "Cancelled" },
      },
      {
        $group: {
          _id: null,
          totalCancelledAmount: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalCancelledAmount: 1,
          totalCount: 1,
        },
      },
    ]);

    const totalCancelledAmount = totalCancelled.length > 0 ? totalCancelled[0].totalCancelledAmount : 0;
    const cancelledOrder = totalCancelled.length > 0 ? totalCancelled[0].totalCount : 0;

    // Calculate Revenue
    const Revenue = totalAmount - totalCancelledAmount;

    // Fetching data for charts
    const dailyOrderData = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(moment().subtract(30, "days").startOf("day")),
          }, 
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthlyOrderData = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyLabels = dailyOrderData.map((item) => item._id);
    const dailyData = dailyOrderData.map((item) => item.orderCount);

    const monthlyLabels = monthlyOrderData.map((item) => item._id);
    const monthlyData = monthlyOrderData.map((item) => item.orderCount);

    const categoryData = await Order.aggregate([
      {
        $match: {}
      },
      {
        $unwind: "$items"
      },
      {
        $lookup: 
        {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "products"
        }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "categories",
          localField: "products.category_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: "$category"
      },
      {
        $group: {
          _id: "$category.name",
          count: {$sum: 1}
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1
        }
      }
    ])
    
    console.log(categoryData)


    

    // Render the admin home page with data
    res.render("admHome", {
      userCount,
      orderCount,
      Revenue,
      productCount,
      categoryCount,
      cancelledOrder,
      dailyLabels,
      dailyData,
      monthlyLabels,
      monthlyData,
      categoryData
    });
  } catch (error) {
    console.error('Error in loadHome function:', error);
    next(error)
  }
};

module.exports = {
  loadHome,
  // other exported functions if any
};


const listCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const totalCount = await User.find().countDocuments();
    const skip = (page - 1) * limit;

    // Retrieve users with pagination
    const usersData = await User.find().skip(skip).limit(limit);

    res.render("customers", {
      users: usersData,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit: limit,
    });
  } catch (error) {
    console.log("Error in listing customers: ", error);
    next(error);
  }
};

const  blockUser = async (req, res, next) => {
  try {
    const id = req.params.userId;
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          isBlocked: true,
          isOnline: false,
        },
      }
    );
    res.redirect("/admin/listCustomers");
  } catch (error) {
    console.log("Error in blocking user: ", error);
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const id = req.params.userId;
    console.log(id);
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
    console.log("Error in unblocking user: ", error);
    next(error);
  }
};

const loadAddCategory = async (req, res) => {
  try {
    res.render("add-category");
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    res.render("add-product");
  } catch (error) {
    console.log(error);
  }
};

const loadProductsList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const totalCount = await Product.countDocuments();
    const skip = (page - 1) * limit;

    const productData = await Product.find()
      .populate("category_id")
      .skip(skip)
      .limit(limit)
      .sort({dateCreated: -1});

    res.render("product-list", {
      product: productData,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit: limit,
    });
  } catch (error) {
    console.log("Error in loading products list: ", error);
    next(error);
  }
};

const loadOrderList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Set the limit to 4 orders per page

    // Query to get total count without applying limit and skip
    const totalCount = await Order.countDocuments();

    const skip = (page - 1) * limit;

    const orderDetails = await Order.find()
      .populate("user_id")
      .skip(skip)
      .limit(limit)
      .sort({date: -1});

    res.render("order-list", {
      orders: orderDetails,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit: limit,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadOrderFullDetails = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.params.id);

    const { user_id: userId, delivery_address: addressId } =
      await Order.findOne({ _id: orderId });
    // const userDetails = await User.findById(userId);

    const address = await Address.findOne({ user_id: userId });

    const deliveryAddress = address.address.filter(
      (add) => add._id == addressId
    );

    const orderDetails = await Order.aggregate([
      {
        $match: { _id: orderId },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products", // Assuming your Product model is named 'Product'
          localField: "items.product_id",
          foreignField: "_id",
          as: "itemsDetails",
        },
      },
      {
        $unwind: "$itemsDetails",
      },
    ]);

    // console.log(orderDetails);

    res.render("order-full-details", {
      order: orderDetails,
      address: deliveryAddress[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const orderStatus = req.body.orderStatus;

    const orderDetails = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        "items.product_id": new mongoose.Types.ObjectId(productId),
      },
      {
        $set: {
          "items.$.status": orderStatus,
        },
      },
      { new: true } // To return the updated document
    );

    if (!orderDetails) {
      return res.status(404).json({ message: "Order or product not found" });
    }

    res.redirect(`/admin/order/full-details/${orderId}`);
  } catch (error) {
    console.log("Error in updating order status: ", error);
    next(error);
  }
};


const loadSalesReport = async (req, res, next) => {
  // Calculate default start and end dates (e.g., last 7 days)
  const defaultStartDate = moment().subtract(7, "days").format("YYYY-MM-DD");
  const defaultEndDate = moment().format("YYYY-MM-DD");

  const startDate = moment().subtract(7, "days").toDate().toISOString()
  const endDate = moment().toDate().toISOString()

  


  const salesData = await Order.aggregate([
    {
      $match: { 
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $lookup: {
        from: "products",
        localField: "items.product_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $sort: {date: -1}
    }
  ]).catch(error => {
    console.error("Error in aggregation pipeline:", error);
    throw error; // Re-throw the error to be caught by the global error handler
  });

  // Render the EJS template with default dates
  res.render("sales-report", { defaultStartDate, defaultEndDate, salesData });
};


const displaySalesReport = async (req, res, next) => {
  try {
    // Calculate default start and end dates (e.g., last 7 days) for rendering the form again
    const defaultStartDate = req.query.startDate ? req.query.startDate : moment().subtract(7, 'days').format('YYYY-MM-DD');
    const defaultEndDate = req.query.endDate ? req.query.endDate : moment().format('YYYY-MM-DD');

    const startDate = req.query.startDate ? new Date(req.query.startDate) : moment().startOf("day").toDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : moment().endOf("day").toDate();

    const count = await Order.countDocuments({
      date: { $gte: startDate, $lte: endDate }
    });

    console.log('Total number of documents:', count);

    // Use the start and end dates to fetch data from the Order collection
    const salesData = await Order.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $unwind: "$items"
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      }
      // Add other aggregation stages as needed
    ]).catch((error) => {
      console.error("Error in aggregation pipeline:", error);
      throw new Error("Error in finding the sales report"); // Re-throw the error to be caught by the global error handler
    });

    // Render the sales-report view with the aggregated salesData
    res.render("sales-report", { salesData, defaultStartDate, defaultEndDate });
  } catch (error) {
    console.log("Error in loading sales report: ", error);
    next(error);
  }
};



const generateSalesReportPdf = async (req, res) => {
  try {

    let {startDate,  endDate} = req.query;

    console.log(startDate, endDate);

    startDate = moment(startDate).toDate().toISOString();
    endDate = moment(endDate).toDate().toISOString();

  //  console.log(startDate)
  //  console.log(endDate)



  const salesData = await Order.aggregate([
    {
      $match: { 
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $lookup: {
        from: "products",
        localField: "items.product_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $sort: {date: -1}
    }
  ]).catch(error => {
    console.error("Error in aggregation pipeline:", error);
    throw error; // Re-throw the error to be caught by the global error handler
  });

  // console.log(salesData)

  const data = {
    salesData: salesData,
  }

  const ejsTemplate = path.resolve(__dirname, "../views/admin/order-summary-pdf.ejs");
  const ejsData = await ejs.renderFile(ejsTemplate, data);


  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({ headless: 'new',executablePath: '/snap/bin/chromium' });
  const page = await browser.newPage();
  await page.setContent(ejsData, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  // Close the browser
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=order-summary.pdf");
  res.send(pdfBuffer);

  } catch (error) {
    console.log(error) 
  }
}


//==================================================== COUPONS ===============================================

const loadCouponList = async(req, res) => {
try {
  const coupons = await Coupon.find()
  res.render('coupon-list', {coupons})
} catch (error) {
  console.log(error)
}
}

const loadAddCoupon = (req, res) => {
  try {
    res.render('add-coupon')
  } catch (error) {
    
  }
}

const addCoupon = async (req, res) => {
  try {
    const { couponCode, description, minAmount, discount, startingDate, expiryDate } = req.body;

    const existingCoupon = await Coupon.findOne({couponCode: couponCode})
    if(existingCoupon){
      return res.render('add-coupon', {message: "Coupon already exists", color: "text-danger"})
    }

    // Ensure all required fields are present in the request
    if (!couponCode || !description || !minAmount || !discount || !startingDate || !expiryDate) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Create a new coupon instance
    const coupon = new Coupon({
      couponCode,
      couponDescription: description,
      minAmount,
      discount,
      startingDate,
      expiryDate,
    });

    // Save the coupon to the database
    await coupon.save();

    // Respond with a success message or the saved coupon data
    res.status(201).render('add-coupon', {message: "Coupon Added Successfully", color: "text-success"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    const coupon = await Coupon.findById(couponId)
    res.render("edit-coupon", {coupon})
  } catch (error) {
    console.log(error)
  }
}

const editCoupon = async (req, res) => {
  try {
    const { couponCode, description, minAmount, discount, startingDate, expiryDate } = req.body;

    // Add validation for required fields
    if (!couponCode || !description || !minAmount || !discount || !startingDate || !expiryDate) {
      return res.status(400).send("All fields are required.");
    }

    const coupon = await Coupon.findByIdAndUpdate(
      { _id: req.query.couponId },
      {
        $set: {
          couponCode: couponCode,
          couponDescription: description,
          minAmount: minAmount,
          discount: discount,
          startingDate: startingDate,
          expiryDate: expiryDate,
        },
      },
      { new: true } // Return the updated document
    );

    if (!coupon) {
      return res.status(404).send("Coupon not found.");
    }
    res.redirect('/admin/coupon/coupon-list');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const {couponId} = req.body;
    const result = await Coupon.deleteOne({_id: couponId})

    if(result.deletedCount === 1){
      res.status(200).json({message: "Coupon Deleted successfully"})
    } else {
      res.status(404).json({message: "Coupon not found"})
    }
    

  } catch (error) {
    console.log(error);
    next(error)
  }
}

//====================================================END OF COUPONS ===============================================


const loadReferral = async (req, res) => {
  try {

    const referral = await Referral.find({})
    
    res.render('referral', {referral})
  } catch (error) {
    console.log(error)
  }
}

const loadAddReferral = (req, res) => {
  try {
    res.render('add-referal')
  } catch (error) {
    console.log(error)
  }
}

const addReferral = async (req, res, next) => {
  try {
    const { referralBonus, signUpBonus } = req.body;

    // Validate input
    if (!referralBonus || !signUpBonus || isNaN(referralBonus) || isNaN(signUpBonus)) {
      return res.status(400).json({ error: "Fields must be valid numbers and cannot be empty" });
    }

    // Check if a referral document already exists
    const referral = await Referral.findOne();

    if (!referral) {
      // If no referral document exists, create a new one
      const newReferral = new Referral({
        signUpBonus: signUpBonus,
        referralBonus: referralBonus
      });

      await newReferral.save();
    } else {
      // If a referral document exists, update its values
      referral.signUpBonus = signUpBonus;
      referral.referralBonus = referralBonus;
      await referral.save();
    }

    // Redirect after the operation is complete
    res.redirect('/admin/referral');
  } catch (error) {
    console.log(error);
    next(error);
  }
};







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
  loadProductsList,
  loadOrderList,
  loadOrderFullDetails,
  updateOrderStatus,
  loadSalesReport,
  displaySalesReport,
  generateSalesReportPdf,
  loadCouponList,
  loadAddCoupon,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  deleteCoupon,
  loadAddReferral,
  addReferral,
  loadReferral
};
