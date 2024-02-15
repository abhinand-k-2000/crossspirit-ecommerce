const jwt = require('jsonwebtoken');
const User = require('../models/userModel')
const Admin = require('../models/adminModel')


const requireAuth = (req, res, next) => {
//   const token = req.cookies.jwt;
  const token = req.cookies['jwt'];
  
  //check json web token exists and is verified
  if (token) { 
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/login");
      } else {
        console.log("authenticated") 
        // console.log(decodedToken.id);
        next();
        // res.redirect('/')
      }
    })
  } else {
    res.redirect("/login");
  }
};


const checkUser = (req, res, next) => {
    // const token = req.cookies.jwt;
    const token = req.cookies['jwt'];
  
  //check json web token exists and is verified
  if (token) { 
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        // console.log(decodedToken);
        let user = await User.findById(decodedToken.id)
        res.locals.user = user
        next();
      }
    })
  } else {
    res.locals.user = null;
    next()
  }
}





const requireAdminAuth = (req, res, next) => {
  const token = req.cookies["admin-token"];

  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decodeToken) => {
      if(err) {
        console.log(err.message);
        res.redirect('/admin')
      } else{
        // console.log("admin authenticated")
        // console.log(decodeToken.id)
        next();
      }
    })
  }else{
    res.redirect('/admin');
  }
};

// const requireAdminAuth = (req, res, next) => {
//   const token = req.cookies["admin-token"];
//   if (!token) {
//     console.log(" validate token not authenticated");
//     res.redirect("/admin");
    
//   }

//   try {


//     const validToken = jwt.verify(token, process.env.JWT_SECRET);
//     if (validToken) {
//       req.authenticated = true;
//       console.log("authenticated as admin");
//       return next();
//     }
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };


const checkAdmin = (req, res, next) => {
  
  const token = req.cookies["admin-token"];

  if(token){
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
 
      if(err){
        console.log(err.message);
        res.locals.admin = null;
        next();
      }else{  
        // console.log(decodedToken);
        let admin = await Admin.findById(decodedToken.id)
        res.locals.admin = admin 
        next();     
      }
    })

  }else{
    res.locals.admin = null;
    next();

  }
}







module.exports = { requireAuth, checkUser, requireAdminAuth, checkAdmin};
