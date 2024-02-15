

const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Adjust the path based on your project structure


const checkBlockedUser = async (req, res, next) => {
  try {
    // Check if the user is authenticated
    if (res.locals.user) {
      // Fetch the latest user data from the database
      const user = await User.findById(res.locals.user._id);

      // Check if the user is blocked (isDeleted is true)
      if (user && user.isBlocked) {
        // Perform logout actions (clear token, etc.)
        res.clearCookie('jwt');  // Assuming you're using cookies for authentication
        res.locals.user = null;
        // You might want to redirect the user to the login page or display a message
        // res.redirect('/login'); 

        // Alternatively, you can send a response indicating that the user is blocked
        // return res.status(401).json({ message: 'User is blocked. Please log in again.' });
        
      }
    }

    // If the user is not blocked or not authenticated, proceed to the next middleware
    next();
  } catch (error) {
    console.error(error);
    // Handle any errors that occur during the process
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};





  
  module.exports = checkBlockedUser;
  
