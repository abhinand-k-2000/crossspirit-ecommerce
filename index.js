require('dotenv').config()
const express = require('express');
const path = require('path');
const session = require('express-session')
const cookieParser = require('cookie-parser'); 
const dbConnect = require('./config/dbConnect')



const app = express();

//database connecting  
dbConnect();
 



app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({extended: true}))



 
// Cache clearing     
app.use((req, res, next) => {
    if (res.headersSent) {
        return next();
    }
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    next();
});

 


//Load assets for user and admin
app.use(express.static('assets'))
app.use(express.static('uploads'))
 


app.use(express.json())
app.use(express.urlencoded({extended: true}))

//Setting up view engine
app.set('view engine', 'ejs')
  

//Loading Middleware to fetch category data and make it available globally
const userController = require('./controllers/userController')
app.use(userController.loadCategoriesMiddleware);
 


app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) { 
      app.set('views', './views/admin');
    } else {
      app.set('views', './views/users');
    }
    next();
  });



//loading routes
const user_route = require('./routes/userRoute');
const admin_route = require('./routes/adminRoute');
const category_route = require('./routes/categoryRoute');
const product_route = require('./routes/productRoute');
const cart_route = require('./routes/cartRoute')
const offer_route = require('./routes/offerRoute')
const banner_route = require('./routes/bannerRoute')
     
app.use('/', user_route, cart_route)
app.use('/admin', admin_route, category_route, product_route, offer_route, banner_route )
// app.use('/admin', category_route)
// app.use('/admin', product_route)


// Importing error handling middleware
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on the server`
  // })
  res.render('404')
})
  



const port = process.env.PORT || 3000
app.listen(port, () => console.log(`hi hello , server running at http://localhost:${port}`))


   