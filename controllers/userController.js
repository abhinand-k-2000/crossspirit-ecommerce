const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Otp = require("../models/otpModel")
const Wishlist = require("../models/wishlistModel")
const Coupon = require("../models/couponModel")
const Wallet = require("../models/walletModel")
const Referral = require("../models/referralCodeModel")
const Banner = require("../models/bannerModel")

const nodemailer = require("nodemailer");
const mailgen = require("mailgen");
const bcrypt = require("bcryptjs");
const path = require("path")
const ejs = require("ejs")
const puppeteer = require("puppeteer-core")
const authService = require("../services/jwt");
const mongoose = require("mongoose");
const Razorpay = require('razorpay')
const shortid = require("shortid")


//Middleware to fetch category data and make it available globally
const loadCategoriesMiddleware = async (req, res, next) => {
  try {
    const categoryData = await Category.find({});
    res.locals.category = categoryData;
    // console.log(res.locals.category)
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//password hashing function
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

// function to generate OTP
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000);
}

// function to send OTP
function sendOtp(email, OTP) {
  let config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  };

  const transport = nodemailer.createTransport(config);

  let MailGenerator = new mailgen({
    theme: "default",
    product: {
      name: "Mailgen",
      link: "http://mailgen.js/",
    },
  });

  let response = {
    body: {
      name: `${email}`,
      intro: `Yoour OTP is ${OTP}`,
      outro: "Looking forward",
    },
  };
  let mail = MailGenerator.generate(response);

  let message = {
    from: process.env.EMAIL,
    to: email,
    subject: "Otp sent successfully",
    html: mail,
  };
  transport.sendMail(message);
}
    
//Loading the user registration    
const loadUserRegister = (req, res) => {
  try {
    if (req.cookies["jwt"]) {
      res.redirect("/");
    } else {
      let referralId = req.query.referralId
      res.render("register",{referralId});

      // res.render("register");
    }
  } catch (error) {
    console.log(error);
  }
};

let OTP;
let globalName, globalEmail, globalMobile, globalPassword;

// Load Home Page
const loadHomePage = async (req, res) => {
  try {
    const productData = await Product.find()
      .populate('offer')
      .limit(4)
      .sort({dateCreated: -1});
    const banner = await Banner.find()
    res.render("index", { product: productData, banner });
  } catch (error) {
    console.log(error);
  } 
};          


const registerUser = async (req, res, next) => {

  const { name, email, mobile, password } = req.body;

console.log("Referral from bdy", req.body.referralId)
  // If the user is registering with the referral ---------------  ------------------
  if (req.query) {
    req.session.referralId = req.query.referralId;
}

console.log("Register session: ", req.session.referralId)

  // Validation for required fields
    if (!name || !email || !mobile || !password) {
      return res.render("register", {
        message: "All fields are required. Please fill out the complete form.",
      });
    }

    // Validation for name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.render("register", {
        message: "Invalid name. Please use only letters and spaces.",
      });
    }

    // Validation for mobile number (assuming a basic format)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.render("register", {
        message: "Invalid mobile number. Please enter a 10-digit number.",
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render("register", {
        message: "Invalid password. Password must be at least 8 characters long and include at least one letter and one digit.",
      });
    }

  try {


    req.session.userData = {
      name: name,
      email: email,
      mobile: mobile,
      password: await securePassword(password)
  };

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("register", {
        message: "Email already exists. Please use a different email.",
      });
    }
    
    // email verification
    OTP = generateOtp();
    console.log(OTP);

    sendOtp(email, OTP);

    const newotp = new Otp({
      email: email,
      otp: OTP,
    })
    
    await newotp.save()


      res.render("otp");

   
  } catch (error) {
    console.log("Error in registering new user: ", error);
    next(error)   
  }
};
 



const resentOtp = async (req, res, next) => {
  try {
    OTP = generateOtp();
    console.log(OTP);
    const userDataFromSession = req.session.userData;
    const {email} = userDataFromSession

    // Find the existing OTP record in the Otp collection
    let existingOtp = await Otp.findOne({ email: email });

    if (!existingOtp) {
      // If the user doesn't exist, create a new document
      existingOtp = new Otp({
        email: email,
        otp: OTP,
        expiry: new Date(Date.now() + 60000), 
      });
    } else {
      // Update the existing OTP record with the new OTP and a new expiry time
      existingOtp.otp = OTP;
      existingOtp.expiry = new Date(Date.now() + 60000); // 1 minutes expiry
    }
   
    // Save the updated or new OTP record
    const updatedOtp = await existingOtp.save();

    if (updatedOtp) {
      sendOtp(email, OTP);
      return res.json({success: true, message: "Otp sent successfully"})

    } else {
      return res.json({success: false, message: "Failed to send Otp. Please try again."})
    }
  } catch (error) {
    console.log("Error in resend otp", error);
    next(error)
  }
};


const verifyOtp = async (req, res, next) => {
  const userOtp = req.body.otp;

  const userDataFromSession = req.session.userData;
  if (!userDataFromSession) {
      // Handle the case where user data is not in the session
      return res.status(400).json({ success: false, message: "User data not found in session" });
  }
  if(userOtp.trim() === ''){
    return res.json({success: false, message: "Enter the Otp"})
  } 
  if (!/^\d+$/.test(userOtp)) {
    return res.json({ success: false, message: "OTP should be a number" });
  }

  try {
    const otpRecord = await Otp.findOne({ email: userDataFromSession.email });

    if (otpRecord && otpRecord.expiry > new Date()) {
      if (userOtp === otpRecord.otp) {
        let user = new User({
          name: userDataFromSession.name,
          email: userDataFromSession.email,
          mobile: userDataFromSession.mobile,
          password: userDataFromSession.password,  
          referralCode: shortid.generate()
        });

        try {
          let userData = await user.save();

          // Remove the OTP record from the collection after successful verification
          await Otp.deleteOne({ email: userDataFromSession.email, otp: userOtp });
          // Clear the user data from the session after successful creation
          delete req.session.userData;

          // Create a wallet for the user
          const wallet = new Wallet({
            user_id: userData._id,
            balance: 0,
            wallet_history: []
          });

          await wallet.save();

          if (req.session.referralId) { 
            const referralId = req.session.referralId;
            const referredUser = await User.findOne({ referralCode: referralId });
            const signUpUser = await User.findById(userData._id)

            if (referredUser) {  
              const referralOffer = await Referral.findOne();

              if (referralOffer) {
                const referredUserWallet = await Wallet.findOne({ user_id: referredUser._id });
                const signUpUserWallet = await Wallet.findOne({ user_id: userData._id})  

                // Adding amount to the wallet of Referrer
                if (referredUserWallet) {
                  referredUserWallet.balance += referralOffer.referralBonus,
                  referredUserWallet.wallet_history.push({
                    date: new Date(),
                    amount: referralOffer.referralBonus,
                    description: "Credited (Referral Bonus)",
                    current_balance: referredUserWallet.balance 
                  }); 

                  await referredUserWallet.save();

                  // Adding amount to the wallet of Sign-Up user
                  if (signUpUserWallet) {
                    signUpUserWallet.balance += referralOffer.signUpBonus,
                    signUpUserWallet.wallet_history.push({
                      date: new Date(),
                      amount: referralOffer.signUpBonus,
                      description: "Credited (Sign-Up Bonus)",
                      current_balance: signUpUserWallet.balance 
                    })
                  }
                  await signUpUserWallet.save();

                  // Log the successful referral
                  console.log(`Referral success: ${referredUser.email} credited with ${referralOffer.referralBonus}`);
                }
              }
            }
          }
          // Return success response for fetch request
          return res.json({ success: true, message: "User created successfully", redirect: "/login" });
        
        } catch (userCreationError) {
          console.error('Error creating user:', userCreationError);
          // Return error response for fetch request
          return res.json({ success: false, message: "Error creating user. Please try again." });
        }
      } else {
        // Return error response for fetch request
        return res.json({ success: false, message: "Incorrect OTP" });
      }
    } else {
      // Return error response for fetch request
      return res.json({ success: false, message: "OTP expired. Click resend for a new one" });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    // Return error response for fetch request
    return res.json({ success: false, message: "An error occurred. Please try again." });
  }
};



// const verifyOtp = async (req, res, next) => {
//   const userOtp = req.body.otp;
//   let parsedOtp = parseInt(userOtp);

//   try {
//     const otpRecord = await Otp.findOne({ email: globalEmail, otp: userOtp });

//     if (otpRecord && otpRecord.expiry > new Date()) {
//       if (parsedOtp === otpRecord.otp) {
//         let user = new User({
//           name: globalName,
//           email: globalEmail,
//           mobile: globalMobile,
//           password: globalPassword,  
//           referralCode: shortid.generate()
//         });

//         try {
//           let userData = await user.save();
//           console.log(userData)

//           // Remove the OTP record from the collection after successful verification
//           await Otp.deleteOne({ email: globalEmail, otp: userOtp });

//           // Create a wallet for the user
//           const wallet = new Wallet({
//             user_id: userData._id,
//             balance: 0,
//             wallet_history: []
//           });

//           await wallet.save();

//           if (req.session.referralId) { 
//             const referralId = req.session.referralId;
//             const referredUser = await User.findOne({ referralCode: referralId });
//             const signUpUser = await User.findById(userData._id)

//             if (referredUser) {  
//               const referralOffer = await Referral.findOne();

//               if (referralOffer) {
//                 const referredUserWallet = await Wallet.findOne({ user_id: referredUser ._id });
//                 const signUpUserWallet = await Wallet.findOne({ user_id: userData._id})  

//             // Adding amount to the wallet of Referrer
//                 if (referredUserWallet) {
//                   referredUserWallet.balance += referralOffer.referralBonus,
//                   referredUserWallet.wallet_history.push({
//                     date: new Date(),
//                     amount: referralOffer.referralBonus,
//                     description: "Credited (Referral Bonus)",
//                     current_balance: referredUserWallet.balance 
//                   }); 

//                   await referredUserWallet.save();

//                   // Adding amount ot the wallet of Sign-Up user
//                   if (signUpUserWallet) {
//                     signUpUserWallet.balance += referralOffer.signUpBonus,
//                     signUpUserWallet.wallet_history.push({
//                       date: new Date(),
//                       amount: referralOffer.signUpBonus,
//                       description: "Credited (Sign-Up Bonus)",
//                       current_balance: signUpUserWallet.balance 
//                     })
//                   }

//                   await signUpUserWallet.save();

//                   // Log the successful referral
//                   console.log(`Referral success: ${referredUser.email} credited with ${referralOffer.referralBonus}`);
//                 }
//               }
//             }
//           }

//           return res.redirect("/login");
//         } catch (userCreationError) {
//           console.error('Error creating user:', userCreationError);
//           return res.render("otp", { message: "Error creating user. Please try again." });
//         }
//       } else {
//         return res.render("otp", { message: "Incorrect OTP" });
//       }
//     } else {
//       return res.render("otp", { message: "Incorrect or expired OTP" });
//     }
//   } catch (error) {
//     console.error('Error verifying OTP:', error);
//     return res.render("otp", { message: "An error occurred. Please try again." });
//   }
// };



//Loading login page of the user 


const loadLoginPage = (req, res) => {
  try {
    if (req.cookies["jwt"]) {
      res.redirect("/");
    } else {
      res.render("login");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadForgotPassword = (req, res) => {
  try {
    res.render("forgot-password");
  } catch (error) {
    console.log(error);
  }
};

const forgotPasswordOtp = async (req, res, next) => {
  try {
    globalEmail = req.body.email;
    const userData = await User.findOne({ email: globalEmail });
    // console.log(userData)
    if (userData) {
      OTP = generateOtp();
      console.log(OTP);
      sendOtp(globalEmail, OTP);

      res.render("forgot-password-otp");
    } else {
      res.render("forgot-password", { message: "Invalid email" });
    }
  } catch (error) {
    console.log("Error in forgot password otp: ", error);
    next(error)
  }
};

const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const otp = req.body.otp;
    console.log(otp);
    if (OTP === Number(otp)) {
      res.render("new-password");
    } else {
      res.render("forgot-password-otp", { message: "Entered wrong Otp" });
    }
  } catch (error) {
    console.log("Error in verifying forgot password: ", error);
    next(error)
  }
};

const newPassword = async (req, res) => {
  try {
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    // Hash the new password before storing it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Compare the plaintext new password with the hashed confirmPassword
    const passwordMatch = await bcrypt.compare(newPassword, hashedPassword);

    if (passwordMatch) {
      await User.findOneAndUpdate(
        { email: globalEmail },
        { $set: { password: hashedPassword } }
      );
      res.redirect("/login");
    } else {
      res.render("new-password", { message: "Passwords do not match" });
    }
  } catch (error) {
    console.error("Error updating password:", error);
    res.render("new-password", { message: "Error updating password" });
  }
};

//User logging verification
const userLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (!userData.isBlocked) {
          await User.findByIdAndUpdate(
            { _id: userData._id },
            { $set: { isOnline: true } }
          );

          const token = authService.createToken(userData._id);
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: authService.maxAge * 1000,
          });

          res.redirect("/");
        } else {
          res.render("login", { message: "Account is blocked !" });
        }
      } else {
        res.render("login", { message: "Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error);
  }
};

// Load user dashboard
const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(error);
  }
};

const loadAccountDetails = (req, res) => {
  try {
    res.render("user-account-details");
  } catch (error) {
    console.log(error);
  }
};

const updateUserAccount = async (req, res) => {
  try {
    const userId = res.locals.user;
    const userData = await User.findById({ _id: userId._id });

    if (!userData) {
      return res.status(404).render('user-account-details', { error: "User not found" });
    }

    // Validate name
    const editedName = req.body.editedName;
    if (editedName && !/^[a-z A-Z ]+$/.test(editedName)) {
      return res.status(400).render('user-account-details', { error: "Name should contain letters only" });
    }

    // Validate email uniqueness
    const editedEmail = req.body.editedEmail;
    if (editedEmail && editedEmail !== userData.email) {
      const emailExists = await User.findOne({ email: editedEmail });
      if (emailExists) {
        return res.status(400).render('user-account-details', { error: "Email is already in use" });
      }
    }

    // Validate mobile number
    const editedMobile = req.body.editedMobile;
    if (editedMobile && !/^\d+$/.test(editedMobile)) {
      return res.status(400).render('user-account-details', { error: "Mobile should contain numbers only" });
    }

    // Update user data
    userData.name = editedName || userData.name;
    userData.email = editedEmail || userData.email;
    userData.mobile = editedMobile || userData.mobile;

    const updatedUserData = await userData.save();

    // Set headers to disable caching
    res.setHeader('Cache-Control', 'no-cache, no-store');
    // res.setHeader('Pragma', 'no-cache');
    // res.setHeader('Expires', '0');

    // Redirect to the same page with success message and updated user data
    // res.render('user-account-details', { success: "Details updated successfully", userData: updatedUserData });
    res.redirect('/user-account-details')
  } catch (error) {
    console.error(error);
    res.status(500).render('user-account-details', { error: "Internal server error" });
  }
};


// User logout
const userLogout = async (req, res) => {
  try {
    const currentUser = res.locals.user;

    await User.findByIdAndUpdate(
      { _id: currentUser._id },
      { $set: { isOnline: false } }
    );
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};       

//=======================================================--WISHLIST--================================================>

const loadWishlist = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const wishlistData = await Wishlist.aggregate([
      {
        $match: { user_id: userId }
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
        $lookup: {
          from: "offers",
          localField: "productDetails.offer",
          foreignField: "_id",
          as: "offers"
        }
      },
      {
        $unwind: {
          path: "$offers",
          preserveNullAndEmptyArrays: true // Include documents with empty "offers" array
        }
      }
    ]);
    
    res.render("wishlist", { wishlistData });
  } catch (error) {
    console.error(error);
    next(error)
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const productId = req.query.productId;

    // Check if the user already has a wishlist
    const user = await Wishlist.findOne({ user_id: userId });

    if (!user) {
      // If the user doesn't have a wishlist, create a new one
      const wishlist = new Wishlist({
        user_id: userId,
        items: [{ product_id: productId }],
      });

      const wishlistData = await wishlist.save();
      
      const itemCount = wishlistData.items.length; // Count of items in the wishlist

      return res.json({ message: "Wishlist created and product added", itemCount });
    }

    // Check if the product is already in the wishlist
    const existingProduct = user.items.find((item) =>
      item.product_id.equals(productId)
    );

    if (existingProduct) {
      return res.status(400).json("Product is already in the wishlist");
    }

    // Add the new product to the existing wishlist
    user.items.push({ product_id: productId });
    await user.save();

    const itemCount = user.items.length; // Count of items in the wishlist

    res.json({ message: "Product added to the wishlist", itemCount });
  } catch (error) {
    console.error(error);
    next(error);
  }
};


const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const userId = res.locals.user._id;

    // Use productId in the $pull operator
    await Wishlist.updateOne(
      { user_id: userId },
      { $pull: { items: { product_id: new mongoose.Types.ObjectId(productId) } } }
    );

    // Fetch the updated wishlist data after the removal
    const updatedWishlist = await Wishlist.findOne({ user_id: userId });
    
    // Get the count of items in the wishlist
    const itemCount = updatedWishlist ? updatedWishlist.items.length : null;

    console.log(`Item Count in Wishlist:`, itemCount);

    res.status(200).json({ message: "Product removed from wishlist", itemCount });
  } catch (error) {
    console.error(error);
    next(error);
  }
};


async function fetchWishlistItemCount (req, res, next) {
  try {
    const userId = res.locals.user ? res.locals.user._id : null;

    if(userId) {
      const wishlist = await Wishlist.find({user_id: userId});
      if(wishlist && wishlist.length > 0){
        const items = wishlist[0].items.length > 0 ? wishlist[0].items.length : null;
        res.locals.wishlistItemCount = items;
      } else {
        res.locals.wishlistItemCount = null;
      }
    } else {
      res.locals.wishlistItemCount = null;
    }

    next();

  } catch (error) {
    console.log("Error fetching wishlist items count: ", error);
    res.locals.wishlistItemCount = null;
    next()
  }
}

//=======================================================END OF WISHLIST--================================================>




//=======================================================ADDRESS=================================================================>
const loadUserAddress = async (req, res, next) => {
  try {
    
    const userId = res.locals.user;
    const addressData = await Address.findOne({ user_id: userId });

    res.render("user-account-address", { address: addressData });
  } catch (error) {
    console.log("Error in loading user addresses: ", error);
    next(error)
  }
};

const addAddress = async (req, res, next) => {
  try {
    const userId = res.locals.user;

    const { streetAddress, city, state, pinCode } = req.body;

    if (!streetAddress && !city && !state && !pinCode) {
      // const message = "Please enter at least one address field.";
      // return res.render('user-account-address');
      return res.redirect("/user-address");
    }

    // Use findOne to find the user's address in the Address collection
    const userAddress = await Address.findOne({ user_id: userId });

    if (!userAddress) {
      // If userAddress is not found, create a new document
      const newAddress = new Address({
        user_id: userId,
        address: [
          {
            streetaddress: streetAddress,
            city: city,
            state: state,
            pincode: pinCode,
          },
        ],
      });

      await newAddress.save();
    } else {
      // If userAddress is found, add a new address to the existing array
      userAddress.address.push({
        streetaddress: streetAddress,
        city: city,
        state: state,
        pincode: pinCode,
      });

      await userAddress.save();
    }

    // res.redirect("/user-address");

    if (req.body.source === 'checkoutDetail') {
      return res.redirect("/checkout-details");
    } else {
      return res.redirect("/user-address");
    }

  } catch (error) {
    console.error("Error in adding the address: ", error);
    next(error)
  }
};

const deleteAddress = async (req, res, next) => {
  const addressId = req.params.id; 
  const userId = res.locals.user._id;

  try {
    // Check if the addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Invalid addressId" });
    }

    // Convert the addressId and userId to mongoose ObjectId
    const mongooseUserId = new mongoose.Types.ObjectId(userId.toString());
    const mongooseAddressId = new mongoose.Types.ObjectId(addressId);

    // Find the address document by user ID and address ID and remove it
    const result = await Address.findOneAndUpdate(
      { user_id: mongooseUserId },
      { $pull: { address: { _id: mongooseAddressId } } },
      { new: true }
    );

    if (result) {
      console.log(`Address successfully deleted. User: ${userId}, Address: ${addressId}`);
      res.redirect("/user-address"); // Redirect to the user address page or adjust as needed
    } else {
      console.log(`Address not found. User: ${userId}, Address: ${addressId}`);
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    console.error("Error deleting address:", error);
    next(error)
  }
};

const editAddress = async (req, res, next) => {
  const addressId = req.params.id; 
  const userId = res.locals.user._id;

  try {
    // Check if the addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {   
      return res.status(400).json({ message: "Invalid addressId" });
    }

    // Convert the addressId and userId to mongoose ObjectId
    const mongooseUserId = new mongoose.Types.ObjectId(userId.toString());
    const mongooseAddressId = new mongoose.Types.ObjectId(addressId);

   // Find the address document by user ID and address ID
   const existingAddress = await Address.findOne({ user_id: mongooseUserId });

   if (!existingAddress) {
     return res.status(404).json({ message: "Address not found" });
   }

   // Update the address fields based on the submitted form data
   existingAddress.address.forEach(addr => {
     if (addr._id.equals(mongooseAddressId)) {
       addr.streetaddress = req.body.streetAddress;
       addr.city = req.body.city;
       addr.state = req.body.state;
       addr.pincode = req.body.pinCode;
     }
   });

   // Save the updated address
   await existingAddress.save();
   
  //  return res.status(200).json({ message: "Address updated successfully" })
  res.redirect("/user-address")
 } catch (error) {
   console.error("Error updating address:", error);
   next(error)
 }
};

//=======================================================END OF ADDRESS=================================================================>



const loadChangePassword = (req, res) => {
  try {
    res.render("user-account-password");
  } catch (error) {
    console.log(error);
  }
};

// new change password function including sweet alert
const changePassword = async (req, res, next) => {
  try {
    const userId = res.locals.user;
    const userData = await User.findOne({ _id: userId });

    if (userData) {
      const currentPassword = req.body.currentPassword;
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        userData.password
      );

      if (passwordMatch) {
        const { newPassword, confirmPassword } = req.body;

        if (newPassword === confirmPassword) {
          // Check if the length of the new password is at least 8 characters
          if (newPassword.length >= 8) {
            // Hash the new password before updating
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the user's password in the database
            await userData.updateOne({ $set: { password: hashedPassword } });

            // Show SweetAlert notification
            return res.render('user-account-password', { successMessage: "Password changed successfully" });
          } else {
            return res.status(400).render('user-account-password', { errorMessage: "Password should be at least 8 characters" });
          }
        } else {
          return res.status(400).render('user-account-password', { errorMessage: "Passwords do not match" });
        }
      } else {
        return res.status(401).render('user-account-password', { errorMessage: "Current password is incorrect" });
      }
    } else {
      return res.status(404).render('user-account-password', { errorMessage: "User not found" });
    }
  } catch (error) {
    console.error("Failed to change password: ", error);
    next(error);
  }
};



const loadCheckoutDetails = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    const coupons = await Coupon.find();

    const address = await Address.findOne({ user_id: userId });

    const cart = await Cart.findOne({ user_id: userId });
    const products = cart.items; 
   

    const productIds = products.map((item) => item.product_id);

    const productsData = await Product.find({ _id: { $in: productIds } });

    const productDetails = productsData.map((product) => {
      const cartItem = cart.items.find(
        (item) => item.product_id.toString() === product._id.toString()
      );
      return {
        product_id: product._id,
        quantity: cartItem ? cartItem.quantity : 0,
        name: product.name,
        price: product.price,
        imageUrl: product.images,
      };
    });

    res.render("checkout-details", {
      address: address?.address || "No address available",
      products: productDetails,
      cart: cart,
      coupons,
      couponAmount: req.session.couponAmount
    });
  } catch (error) {
    console.log(error);
  }
};

let totalAmount;
const loadCheckoutPayment = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    // Finding the specified address that the user had selected
    const selectedAddressId = req.query.id;
    const userAddress = await Address.findOne(
      { user_id: userId },
      { address: { $elemMatch: { _id: selectedAddressId } } }
    );
    // console.log(userAddress.address[0]._id)

    // Finding the products of the user
    const cart = await Cart.findOne({ user_id: userId });
    totalAmount = cart.totalProductsPrice;
    const products = cart.items;
    const productIds = products.map((item) => item.product_id);
    const productsData = await Product.find({ _id: { $in: productIds } });
    productDetails = productsData.map((product) => {
      const cartItem = cart.items.find(
        (item) => item.product_id.toString() === product._id.toString()
      );
      return {
        product_id: product._id, 
        quantity: cartItem ? cartItem.quantity : 0,
        name: product.name,
        price: product.price,
        imageUrl: product.images,
      };
    });
    // console.log(cart)
    res.render("checkout-payment", {
      address: userAddress.address[0],
      products: productDetails,
      productIds: productIds,
      cart: cart,
      razorpaykey: process.env.RAZORPAY_key_ID,
      couponAmount: req.session.couponAmount
    });
  } catch (error) {
    console.log(error);
  }
};

const loadThankYouPage = (req, res) => {
  try {
    res.render('checkout-complete')
  } catch (error) {
    console.log(error)
  }
}

const createOrder = async (req, res, next) => {
  try {
    const { selectedAddress, paymentMethod } = req.body;

    // Assuming you have a user ID available, either from the session or another source
    const userId = res.locals.user._id;

    // Fetch the user's cart
    const cart = await Cart.findOne({ user_id: userId });

    // Calculate the total amount
    let totalAmount = cart.items.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    // if (cart.discount > 0) {
    //   totalAmount -= cart.discount;
    // }

    if(req.session.couponAmount) {
      totalAmount -= req.session.couponAmount
    }

    if (paymentMethod === 'Wallet') {

      const wallet = await Wallet.findOne({ user_id: userId });

      if (!wallet) {
        return res.status(400).json({ message: "Insufficient Balance in Wallet!" });
      }

      if (wallet) {
        if (wallet.balance < totalAmount) {
          return res.status(400).json({ message: "Insufficient Balance in Wallet" });
        }

        // Deduct the amount from the wallet balance
        wallet.balance -= totalAmount;

        wallet.wallet_history.push({
          date: new Date(),
          amount: totalAmount,
          description: "Debited",
          current_balance: wallet.balance
        });

        await wallet.save();
      }
    }

    // Create an order document
    const order = new Order({
      user_id: userId,
      delivery_address: selectedAddress,
      total_amount: totalAmount,
      date: new Date().toISOString(),
      payment: paymentMethod,
      items: cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        status: 'Pending',
      })),
    });

    // Save the order to the database
    await order.save();

    // Deduct product quantities from stock
    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { countInStock: -item.quantity } }
      );
    }

    // Clearing the user's cart after the order is placed
    await Cart.deleteOne({ user_id: userId });

    // Respond with a success status and the order information
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.log("Failed to create the order: ", error);
    next(error);
  }
};






const loadOrders = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    
    // const orderDetails = await Order.find({user_id: userId})
    // console.log(new Date(orderDetails[0].date).toLocaleString());

    const orderDetails = await Order.aggregate([
      {
        $match: {user_id: userId}
      },
      {
        $unwind: '$items'
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
        $unwind: '$productDetails'
      },
      {
        $sort: {date: -1}
      }
    ])
    console.log(orderDetails)
    // console.log(orderDetails)
    res.render('account-orders', {
      orders: orderDetails
    })
  } catch (error) {
    console.log("Failed to load order page: ", error)
    next(error)
  }
}          

const loadOrderFullDetails = async (req, res, next) => {
  try {

    const userId = res.locals.user._id;
    const orderId = req.query.orderId  
    const productId = req.query.productId

    const orderDetails = await Order.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) }
      },
      {
        $unwind: "$items"
      },
      {
        $match: { "items.product_id": new mongoose.Types.ObjectId(productId) }
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
    ])
    const addressId = new mongoose.Types.ObjectId(orderDetails[0].delivery_address)
    // console.log(addressId)
    const addressDetails = await Address.findOne(
      { user_id: userId, 'address._id': addressId },
      { 'address.$': 1 }
    );
    
    // console.log(userId)
    const userDetails = await User.findOne({_id: userId})
    // console.log(userDetails)

    res.render('order-full-details', {
      order: orderDetails[0],
      address: addressDetails.address[0],
      user: userDetails
    })
  } catch (error) {   
    console.log("Failed to load order full details: ", error)
    next(error)
  }
}  
   
const orderCancel = async (req, res, next) => {
  try {     

    const {orderId, productId, cancellationReason} = req.body

    const orderDetails = await Order.findOne({ _id: orderId });

    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIndex = orderDetails.items.findIndex(
      (item) => item.product_id == productId
    );  
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in the order' });
    }

    // Update order status to 'Cancelled'
    orderDetails.items[productIndex].status = 'Cancelled';

    // Storing  cancellation message in orderDetails
    orderDetails.items[productIndex].cancellationReason = cancellationReason;

    // Save the updated order details
    await orderDetails.save();

    const productData = await Product.findById(productId)
    if(productData) {
      productData.countInStock += orderDetails.items[productIndex].quantity

      await productData.save();
    }

    if ( orderDetails.payment !== 'Cash On Delivery'){
      try {
        const wallet = await Wallet.findOne({ user_id: orderDetails.user_id });
    
        if (!wallet) {
          throw new Error('Wallet not found for user');
        }
    
        const { price, quantity } = orderDetails.items[productIndex];
        const totalRefund = price * quantity;
    
        wallet.balance += totalRefund;
    
        // Update wallet history with a new entry
        wallet.wallet_history.push({
          date: new Date(),
          amount: totalRefund,
          description: 'Credited (Cancelled Product)',
          current_balance: wallet.balance,
        });
    
        // Save the updated wallet
        await wallet.save();
      } catch (error) {
        console.error('Error updating wallet:', error);
        // Handle the error appropriately (e.g., log, send notification, etc.)
      }
    }

    // Redirect with success message or any other response handling
    return res.redirect('/orders');
  } catch (error) {
    console.error('Failed to cancel the order:', error);
    next(error);
  }
};


const orderReturn = async (req, res) => {
  try {
    
    const { orderId, productId, returnReason } = req.body;

    console.log("Retun reason:", returnReason)
    const orderDetails = await Order.findOne({ _id: orderId });

    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIndex = orderDetails.items.findIndex(
      (item) => item.product_id == productId
    );  
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in the order' });
    }

    // Check if the product is eligible for return (you may have specific conditions)
    if (orderDetails.items[productIndex].status !== 'Delivered') {
      return res.status(400).json({ message: 'Product is not eligible for return' });
    }

    // Update order status to 'Returned'
    orderDetails.items[productIndex].status = 'Returned';

    // Store return reason in orderDetails
    orderDetails.items[productIndex].returnReason = returnReason;
  
    // Save the updated order details
    await orderDetails.save();

    // Respond with success message
    return res.status(200).json({ message: 'Order returned successfully' });

  } catch (error) {
    console.error('Error in orderReturn:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


 


//--------------------------------RAZORPAY ORDER CREATION-----------------------------------------------

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_key_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});  
 
const razorpayPayment = async (req, res, next) => {
  console.log(totalAmount)
  try {
    // Fetch necessary order details and create a Razorpay order
    const options = {
      amount: totalAmount * 100 , // Replace with the actual amount in paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: 'order_receipt_id_2', // Replace with your order receipt ID
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order', error);
    next(error)
  }
}

//--------------------------------END OF RAZORPAY ORDER CREATION-----------------------------------------------

const invoiceGeneration = async (req, res, next) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.query.orderId)
    const userId = res.locals.user._id

    const userData = await User.findById(userId)
    const orderData = await Order.aggregate([
      {
        $match: {_id: orderId}
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
     
    ]) 

    const addressId =orderData[0].delivery_address
    const addressData = await Address.findOne({user_id: userId})

    const deliveryAddress = addressData.address.find(address => address._id.toString() === addressId)
    // console.log(deliveryAddress)
 
    const data = {
      order: orderData,
      user: userData,
      address: deliveryAddress
    }
    // Render the EJS template
    const ejsTemplate = path.resolve(__dirname, "../views/users/invoice.ejs");
    const ejsData = await ejs.renderFile(ejsTemplate, data);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: 'new', executablePath: '/snap/bin/chromium' });   
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    // Close the browser
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=order_invoice.pdf");
    res.send(pdfBuffer);

  } catch (error) {
    console.log("Invoice error", error)
    next(error);
  } 
}



//===============================================COUPON================================================
const applyCoupon = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({ couponCode: couponCode });

    if (!coupon) {
      console.log("Invalid coupon");
      return res.status(200).json({ message: "Invalid coupon code" });
    }

    // Validate coupon dates and minimum amount
    const currentDate = new Date();

    if (currentDate < coupon.startingDate || currentDate > coupon.expiryDate) {
      return res.status(200).json({ message: "Coupon is not valid during this period" });
    }

    if (cart.totalProductsPrice < coupon.minAmount) {
      return res.status(200).json({ message: "Minimum purchase amount not reached" });
    }

    req.session.couponAmount = coupon.discount

    console.log(req.session.couponAmount)

    // Apply the discount to the cart
    // cart.discount = coupon.discount;
    // cart.totalProductsPrice -= cart.discount;

    // // Save the cart and await the save operation
    // await cart.save();


    // Respond with a success message or updated cart information
    res.json({ success: true, message: "Coupon applied", 
    discount: cart.discount, 
    totalPrice: cart.totalProductsPrice,
    couponAmount: req.session.couponAmount });
    return;
  } catch (error) {
    console.error("Error applying coupon:", error);
    // Handle the error and pass it to the error handling middleware
    next(error);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    if(req.session.couponAmount) {
      delete req.session.couponAmount
    }

    console.log("removecoupon", req.session.couponAmount)
    // Check if a discount exists before attempting to remove it
    // if (cart.discount !== undefined) {
    //   console.log("cart entry")
    //   // Restore the original totalProductsPrice by adding back the discount
    //   cart.totalProductsPrice = cart.totalProductsPrice + cart.discount;

    //   // Remove the discount by setting it to undefined
    //   cart.discount = undefined;

    //   // Save the cart and await the save operation
    //   await cart.save();
    // }


    // Respond with a success message or updated cart information
    res.json({ success: true, message: "Coupon removed successfully", updatedCart: cart });
    // res.redirect('/checkout-details')
  } catch (error) {
    console.error(error);
    // Handle the error and pass it to the error handling middleware
    next(error);
  }
};
//===============================================END OF COUPON================================================





//=======================================================WALLET================================================
const loadWallet = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const wallet = await Wallet.findOne({user_id: userId})
    res.render('user-account-wallet', {wallet, razorpaykey: process.env.RAZORPAY_key_ID})
  } catch (error) {
    console.log(error)
  }
}

const addAmountToWallet = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const { amount } = req.body;
   

    if (!userId) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      const newWallet = new Wallet({
        user_id: userId,
        balance: amount,
        wallet_history: [
          {
            date: new Date(),
            amount: amount,
            description: "Deposited",
            current_balance: amount
          },
        ],
      });

      await newWallet.save();
    } else {
      wallet.balance += Number(amount);
      wallet.wallet_history.push({
        date: new Date(),
        amount: amount,
        description: "Deposited",
        current_balance: wallet.balance
      });

      await wallet.save();
    }

    // Respond with a JSON success message
    res.json({ success: true, message: "Amount added to wallet successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
}; 

const razorpayWalletPayment = async (req, res) => {
  try {
    const {amount} = req.body
    const options = {
      amount: amount * 100, // Replace with the actual amount in paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: 'order_receipt_id_2', // Replace with your order receipt ID
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {
    console.log(error)
  }
}
 
const withdrawAmountFromWallet = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const wallet = await Wallet.findOne({ user_id: userId });
    const { amount } = req.body;

    // Input validation
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      // return res.status(400).json({ message: 'Invalid withdrawal amount' });
      return res.status(400).render('user-account-wallet', {wallet, razorpaykey:process.env.RAZORPAY_key_ID ,message: "Invalid withdrawal amount"})
    }

    if (wallet) {
      // Ensure sufficient balance for withdrawal
      if (wallet.balance < Number(amount)) {
        // return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
        return res.status(400).render('user-account-wallet', {wallet, razorpaykey:process.env.RAZORPAY_key_ID ,message: "Insufficient balance for withdrawal"})
      }

      wallet.balance -= Number(amount);
      wallet.wallet_history.push({
        date: new Date(),
        amount: Number(amount),
        description: 'Withdrawal',
        current_balance: wallet.balance
      });

      await wallet.save();
    }

    res.redirect('/wallet');
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const loadTransactionHistory = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const wallet = await Wallet.findOne({ user_id: userId });

    if (wallet && wallet.wallet_history) {
      // Sort the wallet_history array based on the date field in ascending order
      // wallet.wallet_history.sort((a, b) => a.date - b.date);

      // Alternatively, for descending order
      wallet.wallet_history.sort((a, b) => b.date - a.date);
    }

    res.render('user-account-transactions', { wallet });
  } catch (error) {
    console.log(error);
    next(error)
  }
};

//===============================================END OF WALLET================================================


const loadUserReferral = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const userData = await User.findById(userId)
    const referralCode = userData.referralCode
    res.render('user-account-referral', {referralCode})
  } catch (error) {
    console.log(error)
  }
}

const loadShopGrid = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    // Fetch all products without any filters
    const products = await Product.find()
      .populate('offer')
      .skip((page - 1) * limit)
      .limit(limit);

    const categories = await Category.find();

    // Include necessary information in the rendering context
    res.render('shop-grid', {
      products,
      categories,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      limit,
      selectedCategories: [],
      minPrice: 0,
      maxPrice: Infinity,
    });
  } catch (error) {
    console.error('Error loading all products:', error);
    // Handle error response
    res.status(500).send('Internal Server Error');
  } 
};
 


const loadFilter = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    // Get selected categories and price range from query parameters
    const categoryIds = req.query.categories ? req.query.categories.split(',') : [];
    const minPrice = req.query.minPrice || 0;
    const maxPrice = req.query.maxPrice || Infinity;
 
    const query = {};
     
// Add category filter if categoryIds are present
    if (categoryIds.length > 0) {
      query.category_id = { $in: categoryIds };
    }

    query.price = { $gte: minPrice, $lte: maxPrice };

    // Fetch products and categories with applied filters
    const products = await Product.find(query)
      .populate('offer')
      .skip((page - 1) * limit)
      .limit(limit);

    const categories = await Category.find();

    res.json({
      products,
      categories,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      limit,
      selectedCategories: categoryIds,
      minPrice,
      maxPrice,
    });
   
  } catch (error) {
    console.error('Error applying filters:', error);
    // Handle error response
    res.status(500).send('Internal Server Error');
  }
};


const searchResult = async (req, res) => {
  try {
    const searchTerm = req.query.searchBar;

    // Using a simple regex to perform a case-insensitive search on the product name
    const products = await Product.find({ name: { $regex: new RegExp(searchTerm, 'i') } }).populate('offer');
    console.log(products)
    // res.json({ products });
    res.render('search', {products})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





module.exports = {
  loadUserRegister,
  registerUser,
  resentOtp,
  verifyOtp,
  loadLoginPage,
  userLogin,
  loadForgotPassword,
  forgotPasswordOtp,
  verifyForgotPasswordOtp,
  newPassword,
  loadHomePage,
  loadDashboard,
  loadAccountDetails,
  updateUserAccount,
  userLogout,
  loadCategoriesMiddleware,
  loadWishlist,
  addAddress,
  loadUserAddress,
  deleteAddress,
  editAddress,
  loadChangePassword,
  changePassword,
  loadCheckoutDetails,
  loadCheckoutPayment,
  createOrder,
  loadThankYouPage,
  loadOrders,
  loadOrderFullDetails,
  orderCancel,
  razorpayPayment,
  invoiceGeneration,
  addToWishlist,
  removeFromWishlist,
  fetchWishlistItemCount,
  applyCoupon,
  removeCoupon,
  loadWallet,
  addAmountToWallet,
  withdrawAmountFromWallet,
  razorpayWalletPayment,
  loadTransactionHistory,
  loadUserReferral,
  loadShopGrid,
  loadFilter,
  orderReturn,
  searchResult
  
};
