// // checkBlockedStatus.js

// const jwt = require('jsonwebtoken');
// const User = require('../models/userModel'); // Adjust the path based on your project structure

// const checkBlockedStatus = async (req, res, next) => {
//   try {
//     const token = req.cookies['jwt'];

//     // Check if the JWT exists and is verified
//     if (token) {
//       jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
//         if (err) {
//           console.log(err.message);
//           res.locals.user = null;
//           next();
//         } else {
//           // Check if the user is blocked
//           let user = await User.findById(decodedToken.id);
//           if (user && user.isBlocked) {
//             // If user is blocked, return an unauthorized response
//             return res.status(401).json({ error: 'User is blocked. Unauthorized access.' });
        
//           }

//           // Attach the user object to res.locals for later use
//           res.locals.user = user;
//           next();
//         }
//       });
//     } else {
//       res.locals.user = null;
//       next();
//     }
//   } catch (error) {
//     // Handle errors
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// module.exports = checkBlockedStatus;

// checkBlockedStatus.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Adjust the path based on your project structure

// const checkBlockedStatus = async (req, res, next) => {
//   try {
//     const token = req.cookies['jwt'];

//     // Check if the JWT exists and is verified
//     if (token) {
//       jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
//         if (err) {
//           console.log(err.message);
//           res.locals.user = null;
//           next();
//         } else {
//           // Check if the user is blocked
//           let user = await User.findById(decodedToken.id);
//           if (user && user.isBlocked) {
//             // If user is blocked, redirect to the login page
//             return res.redirect('/login');
//           }

//           // Attach the user object to res.locals for later use
//           res.locals.user = user;
//           next();
//         }
//       });
//     } else {
//       res.locals.user = null;
//       next();
//     }
//   } catch (error) {
//     // Handle errors
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// module.exports = checkBlockedStatus;




const checkBlockedStatus = async (req, res, next) => {
    try {
      const token = req.cookies['jwt'];
  
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
          if (err) {
            console.log(err.message);
            res.locals.user = null;
          } else {
            let user = await User.findById(decodedToken.id);
            console.log(user);
            next()
           
  
            
          }
          next();
        });
      } 
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  module.exports = checkBlockedStatus;
  
