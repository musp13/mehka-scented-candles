
const express = require('express');
const app = express();
//////////////////////////////
const morgan = require('morgan');
const mongoose=require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGOLAB_URI);

app.use('/path/to/your/fonts', express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine','ejs');

// Initialize and use the session middleware
app.use(session({
    secret: 'my_secret_key', // Replace with a secret key for session encryption
    resave: true,
    saveUninitialized: true,
}));
app.use(cookieParser());

app.use((req,res,next)=>{
    res.header('Cache-Control','no-cache,private,no-store,must-revalidate');
    res.header('Expires','0');
    res.header('Pragma','no-cache');
    next();
});
app.use((req,res,next)=>{
    res.cookie('myCookie', 'Hello, this is my cookie!', { maxAge: 3600000 }); // 1 hour expiration (in milliseconds)
    //const myCookieValue = req.cookies.myCookie;
    next();
});

// Initialize and use the connect-flash middleware
app.use(flash());

//before defining routes
app.use(morgan('combined'));
app.use(express.static('public'));

/* app.get('/',(req,res)=>{res.render('admin_login')}); */
app.use('/admin',require('./routes/adminRoutes'));
app.use('/',require('./routes/userRoutes'));

//start the server
const PORT=3000;
app.listen(PORT, ()=>{
    console.log(`server started on port ${PORT}`);
});
