const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const dbConnect = require('./config/dbConnect')

const app = express();
 
//Loading environment variables
dotenv.config({path: './config/.env'}); 

//database connecting  
dbConnect();

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

app.use('/', user_route)
app.use('/admin', admin_route)
app.use('/admin', category_route)
app.use('/admin', product_route)


const port = process.env.PORT || 8000
app.listen(port, () => console.log(`server running at http://localhost:${port}`))