const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const dbConnect = require('./config/dbConnect')

const app = express();

//Loading environment variables
dotenv.config({path: './config/.env'}); 

//database connecting
dbConnect();

// Creating the session
const session = require('express-session');
app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))




//Load assets
app.use(express.static('assets'))


app.use(express.json())

//Setting up view engine
app.set('view engine', 'ejs')
app.set('views', './views/users')

//loading routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute)






const port = process.env.PORT || 8000
app.listen(port, () => console.log(`server running at http://localhost:${port}`))