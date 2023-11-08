const Razorpay = require('razorpay');
const User= require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Banner = require('../models/bannerModel');
/* const session= require('express-session'); */
const bcrypt=require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring=require('randomstring');
const {emailUser,emailPassword}=require('../config/config');
const dotenv = require('dotenv');
dotenv.config();
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,     //razorpayConfig.key_id,
    key_secret: process.env.RAZORPAY_KEY_SECRET,  //razorpayConfig.key_secret,
  });

const crypto = require('crypto');

function hmac_sha256(data, key) {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
}

const loadUserSignup= async (req,res)=>{
    try
    {
        res.render('userSignup',{ formValue: null });
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const sendVerifyMail=async (name,email,user_id)=>{
    try
    {
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: emailUser,
                pass: emailPassword
            }
        });
        const mailOptions = {
            from:emailUser,
            to: email,
            subject:'For Email Verification',
            html:'<p>Hi '+name+'. Please click here to <a href="http://localhost:3000/verify_user?id='+user_id+'">verify your email</a>. </p>'
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error)
            {
                console.log(error);
            }
            else
            {
                console.log("Email has been sent.",info.response);
            }
        })
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const verifyMail = async (req,res)=>{
    try
    {
        const updateInfo = await User.updateOne({_id:req.query.id},{$set:{isVerified:true}});
        console.log(updateInfo);
        res.render('email_verified_page');
        
    }
    catch(err)
    {
        console.log(err.message);
        console.error("Error verifying user's email:", err);

        let errorMessage = "An error occurred while verifying the email.";

        if (err.name === "CastError" && err.kind === "ObjectId") {
            errorMessage = "Invalid user ID provided.";
        }

        if (err.code === 11000) {
            errorMessage = "Email has already been verified.";
        }

        res.render('userSignup', {message:errorMessage });
    }
}

const userSignupPost=async (req,res)=>{
    try
    {
        console.log('inside user signup post',req.user);
        //Generate a salt for password hashing
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);

        //HAsh the password
        const hashedPassword= await bcrypt.hash(req.body.password,salt);

        const user= new User({
            fullName:req.body.fullName,
            email:req.body.email,
            password:hashedPassword,
        });

        const foundUser = await User.findOne({email:user.email});
        if(foundUser)
        {
            console.log('email found');
            return res.render('userSignup',{formValue:null,message:'User already registered.'});
        }

        const errors = {};

        if (req.body.password !== req.body['retype-password']) {
            errors.passwordMismatch = { message: 'Passwords do not match' };
            // You can also add this error to your `req.flash` for displaying it using connect-flash
        }

        if (Object.keys(errors).length > 0) {
            let formValue=user;
            return res.render('userSignup', { errors ,formValue});
        }
        
        const userData = await user.save();
        if(userData)
        {
            sendVerifyMail(req.body.fullName,req.body.email,userData._id);
            res.render('userSignup',{formValue:null,message:'Regsitration Successful. Please verify your mail'});
        }
        else
        {
            res.render('userSignup',{formValue:null,message:'Regsitration Failed.'});
        }
    }
    catch(err)
    {
        if (err.code === 11000 && err.keyValue && err.keyValue.email) {
            res.render('userSignup', { formValue: null, message: 'User with this email already exists.'});
        } else {
            console.log(err.message);
            res.render('userSignup',{formValue:null,message:'Regsitration Failed.'});
        }   
    }
}

const userLoginLoad=(req,res)=>{
    res.render('userLogin');
}

const userLoginPost  = async (req,res)=>{
    try {
        console.log('hello, whats wrong. login post reached')
        const {email,password} = req.body;
        if(!email || !password)
        {
            console.log("Please fill in all the fields");
            res.render('userLogin',{message:'Please fill in all the fields'});
        }
        const userData = await User.findOne({email:email});
        if(userData)
        {
             const passwordMatch = await bcrypt.compare(password,userData.password);

            if(!(passwordMatch))
            {
                res.render('userLogin',{message:'Email and Password is Incorrect'});
            }
            else if(!userData.isVerified)
            {
                res.render('userLogin',{message:'Please Verify your Email.'});
            }
            else if(userData.isBlocked)
            {
                res.render('userLogin',{message:'User is Blocked'});
            }
            else{
                req.session.user_id=userData._id;
                res.redirect('/userProductList');
            }
        }
        else
        {
            res.render('userLogin',{message:'Email and Password is Incorrect'});
        }
    } catch (error) {
        console.log(error.message);
    } 
};

const userHomeLoad=(req,res)=>{
    res.render('landingPage');
}

const userLogout=async (req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }

}

const userForgotLoad=(req,res)=>{
    res.render('user_forgot');
}

//to send password reset link to email
const forgotVerify= async (req,res)=>{

    try
    {
        const email=req.body.email;
        const userData = await User.findOne({email:email});
        if(userData)
        {
            if(userData.isVerified===false)
            {
                res.render('user_forgot',{message:"Please verify your email"});
            }
            else
            {
                const randString= randomstring.generate();
                const updatedUser = await User.updateOne({email:email},{$set:{token:randString}});
                sendResetMail(userData.fullName,userData.email,randString);
                res.render('user_forgot',{message:'Please check your email to reset your password'});

            }
        }
        else{
            res.render('user_forgot',{message:'Incorrect Email!'});
        }
    }
    catch(err)
    {
        console.log(err.message);
    }
};

//for reset password send mail
const sendResetMail=async (name,email,token)=>{
    try
    {
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: emailUser,
                pass: emailPassword
            }
        });
        const mailOptions = {
            from:emailUser,
            to: email,
            subject:'For Reset Password',
            html:'<p>Hi '+name+'. Please click here to <a href="http://localhost:3000/reset_password?token='+token+'">reset your password</a>. </p>'
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error)
            {
                console.log(error);
            }
            else
            {
                console.log("Email has been sent.",info.response);
            }
        })
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const resetPasswordLoad=async (req,res)=>{
    try
    {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData)
        {
            res.render('reset_password',{userId:tokenData._id});
        }
        else
        {
            res.render('404',{message:'Invalid Token.'});
        }
    }
    catch(err)
    {
        console.log(err.message);
    }
}

const resetPasswordPost = async (req,res)=>{

    try
    {
        const password=req.body.password;
        const userId=req.body.userId;

        //Generate a salt for password hashing
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);

        //HAsh the password
        const hashedPassword= await bcrypt.hash(password,salt);

        const updatedData = await User.findByIdAndUpdate({_id:userId},{$set:{password:hashedPassword,token:''}});  

        res.redirect('/login');
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const otpLoginLoad = (req,res)=>{
    res.render('otpLoginLoad');
}


const sendOtpMail = async (name,email,otp)=>{
    try
    {
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: emailUser,
                pass: emailPassword
            }
        });
         // Modify your email sending logic to include the OTP
         const mailOptions = {
            from: emailUser,
            to: email,
            subject: 'Your OTP for Login',
            html: `<p>Hi ${name}, your OTP for login is: ${otp}</p>`
        };
        // Send the OTP email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("OTP Email has been sent.", info.response);
            }
        });
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const sendOtp= async(req,res)=>{

    try {
        const email=req.body.email;
        const userData = await User.findOne({email:email});
        if(userData)
        {
            if(userData.isVerified===false)
            {
                res.render('otpLoginLoad',{message:"Please verify your email"});
            }
            else
            {
                // generate OTP
                const otp = randomstring.generate();
                const updatedUser = await User.updateOne({email:email},{$set:{otp:otp}});
                sendOtpMail(userData.fullName, userData.email, otp);

                console.log('inside send otp, userData=',userData);
                res.render('enterOtp', { message: 'Please enter the OTP sent to your email.' ,userId:userData._id});
            }
        }
        else
        {
            res.render('otpLoginLoad',{message:'Incorrect Email!'});
        }
                
    } catch (err) {
        console.log(err.message);
    }
};

const verifyOtp = async (req,res)=>{
    try
    {
        console.log("inside verify otp. req.body=",req.body);
        const userId = req.body.userId;
        const enteredOtp = req.body.otp;
        const user = await User.findOne({ _id: userId });


        if (!user || user.otp !== enteredOtp) {
            return res.render('enterOtp', { message: 'Invalid OTP',userId:req.body.userId });
        }
        else
        {
            req.session.user_id=user._id;
            res.redirect('/userProductList');
            //res.send('OTP Success');
            /* req.body.email = user.email;
            req.body.password=user.password; */
            /* passport.authenticate("otp-local",{
                successRedirect: "/home",
                failureRedirect: "/login",
                failureFlash: true,
            })(req,res); */
        }
    }
    catch(err)
    {
        console.log(err.message);
    }

    
}


const userProductList = async (req,res)=>{
    try {

        // Fetch categories that are not hidden
        const nonHiddenCategories = await Category.find({ hidden: false });

        // Get an array of category IDs from non-hidden categories
        const nonHiddenCategoryIds = nonHiddenCategories.map((category) => category._id);

        const userId = req.session.user_id;
        /* const user = await User.findById(userId); */

        let search = '';
        if(req.query.search){
            search=req.query.search;
        }

        let page = parseInt(1);
        if(req.query.page){
            page=req.query.page;
        }

        let sort = null;
        if(req.query.sort){
            sort=req.query.sort;
        }
        
        if(sort == '1')
        {
            sort = 1;
        }
        if(sort == '-1')
        {
            sort = -1;
        }

        let sortOption;
        if(sort == null)
        {
            sortOption = { addedDate : -1 };
        }
        else
        {
            sortOption = { price: sort };
        }

        let productSize = '';
        if(req.query.productSize)
            productSize=req.query.productSize;
        
        let aromaType = '';
        if(req.query.aromaType)
            aromaType=req.query.aromaType;

        let aromaLevel = '';
        if(req.query.aromaLevel)
            aromaLevel=req.query.aromaLevel;

        let price = '';
        let priceOption='';
        if(req.query.price)
            price=req.query.price;
        if(price == 'belowHundred')
        {
            priceOption = { $lte: 100 };
        }
        if(price == 'aboveHundred')
        {
            priceOption = { $gt: 100 };
        }
        const filterOptions = {};

        if (productSize) {
            filterOptions.productSize = productSize;
        }
        if (aromaType) {
            filterOptions.aromaType = aromaType;
        }
        if (aromaLevel) {
            filterOptions.aromaLevel = aromaLevel;
        }
        if (price) {
            filterOptions.price = priceOption;
        }
        console.log("this is th filtroption",filterOptions);
        

        const limit = 8;

        const categories = await Category.find();
        
        const searchRegex = new RegExp('.*' + search + '.*', 'i'); // Create regex pattern for string fields

        // Convert search to numeric value for quantity and price
        const numericSearch = parseFloat(search);

        const products = await Product.find({
            $and: [ 
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } },
                        /* { category: { $regex: searchRegex } }, */
                        { detailDescription: { $regex: searchRegex } },
                        { ingredients: { $regex: searchRegex } },
                        { aromaLevel: { $regex: searchRegex } },
                        { aromaType: { $regex: searchRegex } },
                        { productSize: { $regex: searchRegex } },
                        { howToUse: { $regex: searchRegex } },
                        { howToFeel: { $regex: searchRegex } },
                    ],
                },
                { category: { $in: nonHiddenCategoryIds } }, // Filter by non-hidden categories
                {isDeleted : {$ne: true}}, // why can't i just add like this to get only non deleted products
                filterOptions,
            ],
        }).sort(sortOption)
        .limit(limit*1)
        .skip((page-1)*limit);

        const count = await Product.find({
            $and: [ 
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } },
                        /* { category: { $regex: searchRegex } }, */
                        { detailDescription: { $regex: searchRegex } },
                        { ingredients: { $regex: searchRegex } },
                        { aromaLevel: { $regex: searchRegex } },
                        { aromaType: { $regex: searchRegex } },
                        { productSize: { $regex: searchRegex } },
                        { howToUse: { $regex: searchRegex } },
                        { howToFeel: { $regex: searchRegex } },
                    ],
                },
                { category: { $in: nonHiddenCategoryIds } }, // Filter by non-hidden categories
                filterOptions,
            ],
            }).countDocuments();

        res.render('productListNew',
        {
            userId:userId,
            products:products,
            categories:categories,
            totalPages: Math.ceil(count/limit),
            currentPage: page,
            previousPage : parseInt(page)-1,
            nextPage: parseInt(page)+1,
            search:search,
            sort:sort,
            price:price,
            productSize:productSize,
            aromaType:aromaType,
            aromaLevel:aromaLevel
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const productDetail = async (req,res)=>{
    try {
        userId = req.session.user_id;
        const product_id=req.query.product_id;
        const product = await Product.findById({_id:product_id})
        res.render('userProductDetail',{product:product,userId:userId});
    } catch (error) {
        console.log(error.message);
    }
};

const addToCart = async (req,res)=>{
    try {
        
        const { userId, productId } = req.body;

        //Find the usr by userId
        const user = await User.findById(userId);

        if(!user)
        {
            return res.status(404).json({ message: 'User not found' });
        }

        //Check id the product already exist in the cart
        const existingCartItem = user.cart.find((item)=> item.productId.toString()===productId);

        // Find the product by productId
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (existingCartItem) {
            // If it exists, update the quantity
            if (product.stockLeft > existingCartItem.quantity) {
                existingCartItem.quantity++;
                // Save the updated user object
                await user.save();
                return res.status(200).json({ message: 'Product added to cart successfully' });
            } else {
                return res.status(200).json({ message: 'Cart quantity exceeds stock' });
            }
        } else {
            // If it doesn't exist, create a new cart item if the product is in stock
            if (product.stockLeft > 0) {
                user.cart.push({ productId, quantity: 1 });
                // Save the updated user object
                await user.save();
                return res.status(200).json({ message: 'Product added to cart successfully' });
            } else {
                return res.status(200).json({ message: 'Out of Stock' });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Function to calculate the total summary price of all products in the cart
const calculateCartSummaryPrice = async (userId) => {
    try {
        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        let cartSummaryPrice = 0;

        // Iterate through the cart items
        for (const cartItem of user.cart) {
            // Fetch the product details including price and discount
            const product = await Product.findById(cartItem.productId);

            if (!product) {
                throw new Error('Product not found');
            }

            // Calculate the total price for the cart item with discounts
            //const discountedPrice = applyDiscounts(product.price, cartItem.quantity, product.discount);
            const totalProductPrice = (parseFloat(product.price) - parseFloat(product.price) * (parseFloat(product.discount) / 100)) * cartItem.quantity;

            // Add the total price to the summary price
            cartSummaryPrice += totalProductPrice;
        }

        console.log('cartSummaryPrice:',cartSummaryPrice);

        return cartSummaryPrice;
    } catch (error) {
        throw error; // You can handle errors as needed
    }
};

const loadCart= async (req,res)=>{
    try {
        // Get the currently logged-in user (you need to implement user authentication)
        const userId = req.session.user_id;
        console.log(userId);
        // Populate the cart items with product details
        const user = await User.findById(userId)
        .populate({
        path: 'cart.productId',
        model: 'Product',
        populate: {
                    path : 'category',
                    model: 'Category'
                }
        });
        /* .exec(); */

        // Check and update cart items based on product stock
        /* for (const cartItem of user.cart) {
            const product = cartItem.productId;
            if (product.stockLeft <= 0) {
            // Remove item from cart if no stock left
            user.cart.pull(cartItem._id);
            } else if (cartItem.quantity > product.stockLeft) {
            // Set cart item quantity to available stock
            cartItem.quantity = product.stockLeft;
            }
        } */

         // Fetch categories that are not hidden
         const nonHiddenCategories = await Category.find({ hidden: false });

         // Get an array of category IDs from non-hidden categories
         const nonHiddenCategoryIds = nonHiddenCategories.map((category) => category._id);
 
        // Calculate the total price here
        let totalPrice = 0;
        for (const cartItem of user.cart) {
            const price = parseFloat(cartItem.productId.price);
            const discount = parseFloat(cartItem.productId.discount || 0);
            const quantity = cartItem.quantity;
            const totalDiscountedPrice = (price - price * (discount / 100)) * quantity;
            totalPrice += totalDiscountedPrice;
        }
        //await user.save();
        console.log('lets check the cart',user);
        res.render('cart', { user: user, totalPrice: totalPrice, nonHiddenCategoryIds: nonHiddenCategoryIds }); // Render your cart page

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateCartItemQuantity= async (req,res)=>{
    const userId = req.params.userId;
    const cartItemId = req.params.cartItemId;
    const newQuantity = req.body.quantity;
    try {
        console.log('hello, reached cart update');
        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find the cart item by its ID
        const cartItem = user.cart.id(cartItemId);
        //console.log(cartItem);

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Fetch the product details including price and discount using populate
        const productDetails = await Product.findById(cartItem.productId);
        //console.log('productDetails:',productDetails);

        // Access the product details
        //const product = populatedCartItem.productId;
        
        if (!productDetails) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the quantity of the cart item
        cartItem.quantity = newQuantity;

        
        // Save the updated cart item to the database
        await user.save();

        /* // Calculate the updated total price (you may have your own logic here)
        const updatedTotalPrice = cartItem.productId.price * newQuantity;
 */     const totalProductPrice = (productDetails.price - productDetails.price * (productDetails.discount / 100)) * newQuantity;
        const cartSummaryPrice =  await calculateCartSummaryPrice(user._id);
        console.log('cartSummaryPrice:',cartSummaryPrice);
        // Respond with the updated total price or any other data you need
        res.json({ totalProductPrice, cartSummaryPrice });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const removeCartItem= async (req,res)=>{
    try {
        const userId = req.params.userId;
        const cartItemId = req.params.cartItemId;

        // Find the user by userId and remove the item from their cart
        const user = await User.findById(userId);

        if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }

        // Find the cart item to remove
        const removedItem = user.cart.find(item => item._id.toString() === cartItemId);
        const productDetails = await Product.findById(removedItem.productId);

        if (!productDetails) {
          return res.status(404).json({ error: 'Product details not found' });
        }

        // Use filter to create a new cart array without the item to remove
        user.cart = user.cart.filter((item) => item._id.toString() !== cartItemId);

        // Calculate the updated total price with discounts
        let totalPrice = 0;

        for (const cartItem of user.cart) {
        const quantity = cartItem.quantity;

        // Fetch product details for each item in the cart
        const product = await Product.findById(cartItem.productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' }); // Handle missing product details gracefully
        }

        // Calculate the total price for this item with discounts
        const price = product.price;
        const discount = product.discount || 0; // Default to 0 if no discount
        const discountedPrice = price * (1 - discount / 100);
        const itemTotalPrice = discountedPrice * quantity;

        totalPrice += itemTotalPrice;
        }


        // Save the updated user data
        const updatedUser = await user.save();
        const cartSummaryPrice = await calculateCartSummaryPrice(user._id);

        res.status(200).json({ message: 'Item removed from cart', totalPrice , cartSummaryPrice});

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });        
    }
};

const addToFavorites = async (req,res)=>{
    const userId = req.params.userId;
    const productId = req.params.productId;

    try {
        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(200).json({ error: 'Please Log In' }); // Handle missing product details gracefully
        }

        // Check if the product is already in the favorites array
        if (user.favorites.includes(productId)) {
            return res.status(200).json({ alreadyInFavorites: true });
        }

        // Add the product ID to the favorites array
        user.favorites.push(productId);

        // Save the updated user document
        await user.save();

        res.status(200).json({ addedToFavorites: true});

    } catch (error) {
        console.error("Failed to add product to favorites:", error);
        return res.status(500).json({ error: 'Failed to add product to favorites' });

    }
};

const loadFavorites = async (req,res)=>{
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);

        // Fetch categories that are not hidden
        const nonHiddenCategories = await Category.find({ hidden: false });

        // Get an array of category IDs from non-hidden categories
        const nonHiddenCategoryIds = nonHiddenCategories.map((category) => category._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('user.favorites', user.favorites);

        // Retrieve the product details for the favorites using the product IDs in the user's favorites array
        const favoriteProducts = await Product.find({
                                                        _id: { $in: user.favorites },
                                                        isDeleted : {$ne : true},
                                                        category: { $in : nonHiddenCategoryIds},
                                                     });

        // Pass the favorite products to your template
        res.render('favorites', { user, favoriteProducts });

    } catch (error) {
        console.error('Error retrieving favorites:', error);
        res.status(500).json({ message: 'Internal server error' });

    }
};

const deleteFavoriteItem = async (req, res) => {
    try {
      const userId = req.params.userId;
      const productId = req.body.productId;
  
      // Find the user by their ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if the product exists in the favorites array
      const favoriteIndex = user.favorites.indexOf(productId);
  
      if (favoriteIndex === -1) {
        return res.status(404).json({ message: 'Favorite item not found' });
      }
  
      // Remove the product from the favorites array
      user.favorites.splice(favoriteIndex, 1);
  
      // Save the updated user document
      await user.save();
  
      res.status(200).json({ message: 'Favorite item deleted successfully' });
    } catch (error) {
      console.error('Error deleting favorite item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  async function isCartItemValid(cartItem) {
    const product = cartItem.productId;

    if(product.isDeleted || product.stockLeft<1)
        return false;// Product is deleted or out of stock

    // Check if the product category is hidden
    const category = await Category.findById(product.category);
    if(category && category.hidden)
        return false;// Product category is hidden

    // Check if cart item quantity is within stock limits
    if(cartItem.quantity>product.stockLeft)
        return false;// Quantity exceeds stock limits

    return true;// Cart item is valid

  }

  const loadCheckout = async (req,res)=>{
    try {
        const userId = req.session.user_id;

        const user = await User.findById(userId)
        .populate({
            path: 'cart.productId',
            model: 'Product',
            populate: {
                        path : 'category',
                        model: 'Category'
                    }
            })
        .exec();

        const totalAmount =  parseFloat(await calculateCartSummaryPrice(userId));
        console.log(totalAmount);

        // Fetch categories that are not hidden
        const nonHiddenCategories = await Category.find({ hidden: false });

        // Get an array of category IDs from non-hidden categories
        const nonHiddenCategoryIds = nonHiddenCategories.map((category) => category._id);

        const invalidCartItems = [];

        // Check the validity of each cart item
        for(const cartItem of user.cart)
        {
            const isValid = await isCartItemValid(cartItem);
            if (!isValid) {
                invalidCartItems.push(cartItem.productId);
              }
        }

        // If there are invalid cart items, re-render the cart page with an invalidCart variable
        if(invalidCartItems.length>0)
        {
            res.render('cart', { user: user, totalPrice: totalAmount, nonHiddenCategoryIds: nonHiddenCategoryIds,invalidCart: true,invalidCartItems:invalidCartItems }); // Render your cart page
        }
        else
        {
            res.render('checkout_sample3',{user:user,totalAmount:totalAmount});
        }

       // 
        
        

    } catch (error) {
        console.log(error.message);
    }
    
  };

  const addAddressCheckout = async (req,res)=>{  /* Add Address to the checkout Page */
    try {

        // Get the form data from the request body
        const {
            userId,
            fullName,
            addressLine,
            state,
            city,
            pin,
            landmark,
            phoneNumber,
        } = req.body;

        console.log(req.body);

         // Find the user by their ID (you may need to pass the user's ID in the request)
         const user = await User.findById(userId);

         if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create a new address object
        const newAddress = {
            fullName,
            addressLine,
            state,
            city,
            pin,
            landmark,
            phoneNumber,
        };

        // Add the new address to the user's address array
        user.address.push(newAddress);

        // Save the updated user object
        await user.save();

        // Send a success response
        res.json({ success: true, message: 'Address added successfully',user:user });

        
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });

    }
  }

const removeAddress = async (req,res)=>{  // function to remove single address from the user's address field
    
    const { userId,addressId } = req.params;

    try {
            // Find the user by ID (you may need to adjust this based on your schema)
            const user = await User.findById(userId);

            // Filter out the address to be removed
            user.address = user.address.filter((address)=> address._id.toString() !== addressId);

            // Save the updated user object
            await user.save();

            res.json({success:true, message: 'Address Removed Successfully'})

    } catch (error) {
        console.error('Error removing address',error.message);
        res.status(500).json({success:false, message:'Failed to remove address'});
    }
};

const clearCart = async (userId) => {
    try {
      // Find the user by ID and update their cart to an empty array
      const updatedUser = await User.findByIdAndUpdate(userId, { cart: [] });
  
      if (!updatedUser) {
        // Handle the case where the user is not found
        return { success: false, error: 'User not found' };
      }
  
      // Optionally, you can respond with a success message
      return { success: true, message: 'Cart cleared successfully' };
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Handle any errors that occur during the process
      return { success: false, error: 'An error occurred while clearing the cart' };
    }
  };

// Function to calculate discounted price
function calculateDiscountedPrice(originalPrice, discount) {
    // You may adjust the discount calculation logic based on your requirements
    return originalPrice - (originalPrice * discount / 100);
}

function calculateFinalDiscountedPrice(productDiscountedPrice, couponDiscountAmount, totalAmount, quantity, totalQuantity, cartAmount) {
    
    const itemPercentage = (productDiscountedPrice/cartAmount)*100;
    //console.log('itemPercentage',itemPercentage);

    // Calculate the discount amount for this item based on the percentage
    const itemDiscountAmount = couponDiscountAmount * (itemPercentage/100);
    //console.log('itemDiscountAmount',itemDiscountAmount);

    // Calculate the final discounted price after applying both product and coupon discounts
    const finalDiscountedPrice = productDiscountedPrice - itemDiscountAmount;
    //console.log('finalDiscountedPrice',finalDiscountedPrice);

    // Ensure that the final price is not negative
    return Math.max(finalDiscountedPrice, 0);
}

const placeOrder = async (req, res)=>{
    try {
        
        // Parse the order details from the request body
        const { userId, addressId, paymentMethod, totalAmount , couponDiscountAmount, cartAmount, couponId} = req.body;

        let orderCouponId = couponId;
        //console.log('reached placeorder,Order coupoId value before: ', orderCouponId);

        if(orderCouponId === "")
            orderCouponId = null;

        //console.log('reached placeorder,Order coupoId value before: ', orderCouponId);
    
        //console.log('reached placeorder, coupoId value: ', couponId);
        // process the order and save it to your database
        // Perform any necessary validation and business logic here
        const user = await User.findById(userId).populate('cart.productId');
        //console.log(user.cart);

        let invalidCartItems = [];

        // Check the validity of each cart item
        for(const cartItem of user.cart)
        {
            const isValid = await isCartItemValid(cartItem);
            if (!isValid) {
                invalidCartItems.push(cartItem.productId);
              }
        }

        // If there are invalid cart items, re-render the cart page with an invalidCart variable
        if(invalidCartItems.length>0)
        {
            return res.status(500).json({ success: false, message: "Please Remove invalid items from cart" });
            //res.render('cart', { user: user, totalPrice: totalAmount, nonHiddenCategoryIds: nonHiddenCategoryIds,invalidCart: true,invalidCartItems:invalidCartItems }); // Render your cart page
        }

        // Check if payment method is wallet and wallet does have enough balance
        if (paymentMethod=== 'wallet' && user.walletAmount< totalAmount) {
            return res.status(500).json({ success: false, message: "There's no enough balance in the Wallet. Please choose another payment option." });
        }

         // Create an array to store order items
        const orderItems = [];

        //set coupon discount amount to 0 if it's not set.
        if(typeof couponDiscountAmount == 'undefined')
        {
            let couponDiscountAmount = 0;
        }

        // Calculate the total quantity of items in the cart
        const totalQuantity = user.cart.reduce((acc, cartItem) => acc + cartItem.quantity, 0);

        // Create an array to store promises for updating product stock
        const updateStockPromises = [];

        // Loop through the items in the cart and create order items
        for (const cartItem of user.cart) {
            const { productId, quantity } = cartItem;

            // Ensure that the quantity in the order does not exceed the available stock
            if (quantity > productId.stockLeft) {
                return res.json({
                success: false,
                message: `Product "${productId.name}" is out of stock or insufficient quantity available.`,
                });
            }

            // Calculate the new stockLeft for the product
            const newStockLeft = productId.stockLeft - quantity;

            // Calculate the product's discounted price before applying the coupon discount
            const productDiscountedPrice = calculateDiscountedPrice(productId.price, productId.discount);

            // Calculate the final discounted price after applying both product and coupon discounts
            const discountedPrice = calculateFinalDiscountedPrice(productDiscountedPrice, couponDiscountAmount, totalAmount, quantity, totalQuantity, cartAmount);

            // Create and push a promise to update the product stock
            const updateStockPromise = Product.findByIdAndUpdate(productId._id, {stockLeft: newStockLeft});

            updateStockPromises.push(updateStockPromise);
    
            // Add the order item to the array
            orderItems.push({
            productId: productId._id,
            quantity,
            discount : productId.discount,
            price : productId.price,
            discountedPrice,
            });
        }

        /* // Execute all updateStockPromises concurrently
        await Promise.all(updateStockPromises);
 */
            // Retrieve the user's address
        const address = user.address.find((address) => address._id.toString() === addressId);

        let orderStatus;
        
        if(paymentMethod==='COD' || paymentMethod==='wallet')
        {
            /* ---------------again check for cart validity-------------- */
            invalidCartItems = [];

            // Check the validity of each cart item
            for(const cartItem of user.cart)
            {
                const isValid = await isCartItemValid(cartItem);
                if (!isValid) {
                    invalidCartItems.push(cartItem.productId);
                }
            }

            // If there are invalid cart items, re-render the cart page with an invalidCart variable
            if(invalidCartItems.length>0)
            {
                return res.status(500).json({ success: false, message: "Please Remove invalid items from cart" });
                //res.render('cart', { user: user, totalPrice: totalAmount, nonHiddenCategoryIds: nonHiddenCategoryIds,invalidCart: true,invalidCartItems:invalidCartItems }); // Render your cart page
            }

            /* -----------------------cart validity check end----------- */
            orderStatus='placed';
            if(orderCouponId !== null)
            {
                const coupon= await Coupon.findById(orderCouponId)
                // Initialize userUsage if it doesn't exist
                if (!coupon.userUsage) {
                    coupon.userUsage = [];
                }
                // Check if the user has exceeded the max usage per user
                const userUsageIndex = coupon.userUsage.findIndex((usage) => usage.userId.equals(userId));
                if (userUsageIndex !== -1) {
                    // If the userUsage with the same userId exists, increment the usageCount
                    coupon.userUsage[userUsageIndex].usageCount++;
                  } else {
                    // If it doesn't exist, add a new userUsage entry
                    coupon.userUsage.push({ userId, usageCount: 1 });
                  }
                  await coupon.save();
            }
        }
        else{
            orderStatus='pending';
        }

        let paymentReceived = false;
        if(paymentMethod==='wallet')
        {
            paymentReceived = true;
        }

        const newOrder = new Order({
            userId,
            totalAmount,
            address,
            paymentMethod,
            orderItems,
            orderStatus,
            paymentReceived,
            couponDiscountAmount,
            cartAmount,
            couponId : orderCouponId,
        });

        /* if(typeof newOrder.couponId != Object || newOrder.couponId === "")
            newOrder.couponId = null;// check couponId is not a string
  */       
        // Assuming you have successfully created the order and have its ID
        const orderId = newOrder._id.toString();
        console.log(orderId);
        const orderDetails = newOrder.toObject();//here, i'm trying to save all the orderDetails to an object.but it is not working
        //console.log(orderDetails);

        if(paymentMethod==='COD' || paymentMethod==='wallet')
        {
            // Clear the user's cart after the order is placed
            const clearCartResult = await clearCart(userId);
            // For demonstration purposes, you can send a success response
            if(paymentMethod==='wallet')
            {
                user.walletAmount = user.walletAmount - totalAmount;
                await user.save();
            }
            await newOrder.save();
            // Update product stock only after order placement
            await Promise.all(updateStockPromises);
            res.json({ success: true, message: 'Order placed successfully', orderId:orderId, status:true });
        }
        else
        {
            try {
                const options = {
                    amount: totalAmount * 100, // Amount in paise (e.g., 10000 paise = ₹100)
                    currency: 'INR',
                    receipt: orderId, // Unique order ID
                };
                const order = await instance.orders.create(options);
                console.log('razorpay order:', order);
                // Send the `order` object to the client for payment processing
                /* if(order)
                    await newOrder.save(); */
                    console.log('razorpay order',order.id);
                    console.log('let me check orderdetails for couponId', orderDetails);
                res.json({ success: true, order, orderId:order.id,dbOrderId: orderId , newOrder:newOrder, orderDetails:orderDetails,
                           /* updateStockPromises:updateStockPromises */ });
            } catch (error) {
                console.error('Error creating Razorpay order:', error);
                res.status(500).json({ error: 'Payment initiation failed' });
            }
            
        }

      } catch (error) {
        // Handle any errors that occur during order placement
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
      }
};

const orderDetails = async (req,res)=>{
    try {
        const userId = req.session.user_id;
        const orderId = req.params.orderId;

        const user = await User.findById(userId);

        const order = await Order.findById(orderId).populate('orderItems.productId');
        

        res.render('orderDetails',{user:user, order:order});
    } catch (error) {
        console.log(error.message);
    }
}

const processPayment = async (req,res)=>{
    
    try {
        const {paymentId,orderId,signature,newOrder,orderDetails,serverOrderId, /* updateStockPromises *//* ,dbOrderId */} = req.body;
        console.log(req.body);

        const user = await User.findById(orderDetails.userId);


    // Find the existing order document by dbOrderId
    const existingOrder =   new Order();

    /* existingOrder = newOrder; */
    console.log('orderDetails in processPayment',orderDetails);

    

    if(orderDetails.couponId === "")
        orderDetails.couponId = null;// check couponId is not a string

        console.log('orderDetails in processPayment After checking couponid is not a string',orderDetails);


    // Loop through the properties of orderDetails and copy them to existingOrder
    for (const key in orderDetails) {
        if (orderDetails.hasOwnProperty(key)) {
            existingOrder[key] = orderDetails[key];
        }
    };
    
    if (!existingOrder) {
        // Handle the case where the order with dbOrderId doesn't exist
        return res.status(404).json({ error: 'Order not found' });
      } 

    // Update the existing order document with new details
    existingOrder.paymentId = paymentId;
    existingOrder.invoiceId = orderId;
    existingOrder.signature = signature;
    existingOrder.orderStatus = "placed";
    existingOrder.paymentReceived = true;

    generated_signature = hmac_sha256(serverOrderId + "|" + paymentId, process.env.RAZORPAY_KEY_SECRET);

    if (generated_signature == signature) {
        console.log('signature matched');
       // payment is successful


       /* -------------------check for cart validity--------------- */
       let invalidCartItems = [];

       // Check the validity of each cart item
       for(const cartItem of user.cart)
       {
           const isValid = await isCartItemValid(cartItem);
           if (!isValid) {
               invalidCartItems.push(cartItem.productId);
             }
       }

       // If there are invalid cart items, re-render the cart page with an invalidCart variable
       if(invalidCartItems.length>0)
       {
           return res.json({ success: false, message: "Please Remove invalid items from cart" });
           //res.render('cart', { user: user, totalPrice: totalAmount, nonHiddenCategoryIds: nonHiddenCategoryIds,invalidCart: true,invalidCartItems:invalidCartItems }); // Render your cart page
       }

       /* ------------check for cart validity end-------------- */

       // Save the updated order document
        await existingOrder.save();

        // Clear the user's cart after the order is placed
        const clearCartResult = await clearCart(existingOrder.userId);

        // Update product stock for online payment
        for(const orderItem of existingOrder.orderItems)
        {
            const product = await Product.findById(orderItem.productId);
            if(product)
            {
                // Update the product stock here
                const newStockLeft = product.stockLeft - orderItem.quantity;
                await Product.findByIdAndUpdate(product._id, {stockLeft:newStockLeft});
            }
        }

        /* await Promise.all(updateStockPromises); */ // Update product stock
        console.log('before coupon update process payment: couponId',existingOrder.couponId);

        //update the coupon count while placing order
        if(existingOrder.couponId !== null)
            {
                const userId = existingOrder.userId;
                console.log('inside coupon update process payment');
                const coupon= await Coupon.findById(existingOrder.couponId)
                // Initialize userUsage if it doesn't exist
                if (!coupon.userUsage) {
                    coupon.userUsage = [];
                }
                // Check if the user has exceeded the max usage per user
                const userUsageIndex = coupon.userUsage.findIndex((usage) => usage.userId.equals(userId));
                console.log('userUsageIndex',userUsageIndex);
                if (userUsageIndex !== -1) {
                    // If the userUsage with the same userId exists, increment the usageCount
                    coupon.userUsage[userUsageIndex].usageCount++;
                  } else {
                    // If it doesn't exist, add a new userUsage entry
                    coupon.userUsage.push({ userId, usageCount: 1 });
                  }
                  await coupon.save();
            }

       // Respond with a success message or any other desired response
        res.status(200).json({ message: 'Order details updated successfully',dbOrderId:existingOrder._id,status:true });
    }
    else
    {
        console.error('Error updating order details:', error);
        res.status(500).json({ error: 'Signatures do not match while processing the payment' }); 
    }

    

    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error updating order details:', error);
        res.status(500).json({ error: 'An error occurred while processing the payment' });
        
    }
    
};

const userProfile = async (req,res)=>{ 
    try {
        const userId = req.session.user_id;

        const user = await User.findById(userId);

        const orders = await Order.find({userId:userId});
        //console.log(orders);

        // Fetch categories that are not hidden
        const nonHiddenCategories = await Category.find({ hidden: false });

        // Get an array of category IDs from non-hidden categories
        const nonHiddenCategoryIds = nonHiddenCategories.map((category) => category._id);

        // Query for the number of favorite products that meet the criteria
        const numFavorites = await Product.countDocuments({
            _id: { $in : user.favorites},
            isDeleted : {$ne : true},
            category : { $in: nonHiddenCategoryIds},
        }); 

        res.render('userProfileNew',{user:user,orders:orders,numFavorites:numFavorites});
    } catch (error) {
        console.log(error.message);
    }
};



const userAddressDetails = async (req,res)=>{
    const userId= req.session.user_id;

    const user = await User.findById(userId);
    
    res.render('userAddressDetailsPage',{user:user});
}

const fetchOrders = async (req,res)=>{
    const userId= req.session.user_id;  
    const user = await User.findById(userId);
    const orders = await Order.find({userId:userId}).sort({ orderDate: -1 });
    res.status(200).json({user:user, orders:orders });

};

const fetchUserProfile = async (req,res)=>{
    const userId= req.session.user_id;  
    const user = await User.findById(userId);
    res.status(200).json({user:user});
};

const updateUserProfile = async (req,res)=>{
    try {
        console.log('reached update user');

        const userId= req.session.user_id;
        const {fullName, phone} = req.body;

        // Update the user's profile in the database
        const updatedUser = await User.findByIdAndUpdate(userId, 
                                                         {fullName, phone}, 
                                                         {new:true}  // Return the updated user document
                                                         );
        // Check if the update was successful
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If successful, send a success response with the updated user data
        res.status(200).json({ success: true, updatedUser });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });

    }
}

const addAddressUserProfile = async (req,res)=>{
    try {

        const userId= req.session.user_id;
        // Get the form data from the request body
        const {
            fullNameAddress,
            addressLine,
            state,
            city,
            pin,
            landmark,
            phoneNumber,
        } = req.body;

         // Find the user by their ID (you may need to pass the user's ID in the request)
         const user = await User.findById(userId);

         if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create a new address object
        const newAddress = {
            fullName : fullNameAddress,
            addressLine,
            state,
            city,
            pin,
            landmark,
            phoneNumber,
        };

        // Add the new address to the user's address array
        user.address.push(newAddress);

        console.log(newAddress);
        // Save the updated user object
        await user.save();

        
        // Send a success response
        res.json({ success: true, message: 'Address added successfully',user:user});

        
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });

    }
};

const cancelOrder = async (req,res)=>{
    const { orderId } = req.params;

    try {
        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order status allows cancellation (e.g., 'pending' or 'placed')
        if (order.orderStatus === 'pending' || order.orderStatus === 'placed') {
            // Perform cancellation logic here (e.g., update order status to 'canceled')
            order.orderStatus = 'cancelled';

             // Fetch the products associated with the order
             //const productsInOrder = await Product.find({_id: {$in: order.orderItems.map(product=>product.productId)} });

            // Check if the order meets the conditions for refunding to the user's wallet
            if (order.paymentReceived && !order.isRefunded) {
                // Add the order's totalAmount to the user's walletAmount
                const user = await User.findById(order.userId);
                user.walletAmount += order.totalAmount;
                user.isRefunded = true;
                await user.save();
            }

            // Increment the stock of each product in the order
            for(const orderItem of order.orderItems){
                const product = await Product.findById(orderItem.productId);

                if(product)
                {
                    product.stockLeft += orderItem.quantity;
                    await product.save();
                }
            }

            await order.save();

            return res.status(200).json({ message: 'Order canceled successfully' });
        } else {
            return res.status(400).json({ message: 'Order cannot be canceled' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const returnOrder = async (req,res)=>{
    console.log('inside return order');
    const { orderId } = req.params;

    try {
        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order status allows cancellation (e.g., 'pending' or 'placed')
        if (order.orderStatus === 'delivered') {
            // Perform cancellation logic here (e.g., update order status to 'canceled')
            order.orderStatus = 'return';
            await order.save();

            return res.status(200).json({ message: 'Order return request is processing' });
        } else {
            return res.status(400).json({ message: 'Order cannot be returned' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }   
};

const validateCoupon = async (req,res)=>{
    try {
        const { couponCode, userId, cartAmount, couponApplied } = req.body;

        // Simulate a database query to check if the coupon code is valid
        const coupon = await Coupon.findOne({couponCode});

        if(couponApplied === 'true')
        {
            return res.json({ valid: false, message: 'CouponCode already applied' });
        }


        if(couponCode.trim()=='')
        {
            return res.json({ valid: false, message: 'CouponCode cannot be empty' });
        }

        if (!coupon) {
            return res.json({ valid: false, message: 'Invalid coupon code' });
        }
  
        // Check if the coupon is active
        if (!coupon.isActive) {
            return res.json({ valid: false, message: 'Coupon is not active' });
        }

        // Check if the coupon is expired
        if (coupon.expiryDate < new Date()) {
            return res.json({ valid: false, message: 'Coupon has expired' });
        }
        
        
        // Check if the user has exceeded the max usage per user
        if (coupon.maxUsagePerUser !== null) {
            console.log('hello max usage per user is',coupon.maxUsagePerUser, userId );
            const userUsage = coupon.userUsage.find((usage) => usage.userId.equals(userId));
            console.log('userUsage', userUsage);

            if ((typeof userUsage !== 'undefined') && userUsage.usageCount >= coupon.maxUsagePerUser) {
                return res.json({ valid: false, message: 'User has exceeded the maximum usage of the coupon' });
            }
        }
        
        // Initialize userUsage if it doesn't exist
        if (!coupon.userUsage) {
            coupon.userUsage = [];
        }

        // Check if the user has exceeded the max usage per user
        const userUsageIndex = coupon.userUsage.findIndex((usage) => usage.userId.equals(userId));


        // Check if the cart amount meets the minimum bill amount requirement (if specified)
        if (coupon.minBillAmount !== null && cartAmount < coupon.minBillAmount) {
            return res.json({ valid: false, message: 'Minimum bill amount not met' });
        }
    
        // Calculate the discount based on the type (percentage or fixed)
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cartAmount * coupon.discountAmount) / 100;
        } else if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountAmount;
        }

        await coupon.save();

        // Return a JSON response with validation result
        res.json({
            valid: true,
            discountAmount,
            couponId:coupon._id,
        });
    } catch (error) {
        console.error(' error:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};

const homeBanner = async (req,res)=>{
    try {
        const banners = await Banner.find();
        res.render('homeBanner',{banners:banners});
    } catch (error) {
        console.error(' error:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};

const fetchWalletBalance = async (req,res)=>{
    try {
        console.log('hello server side wallet balance');
        const userId = req.session.user_id;
        const user = await User.findById(userId,{walletAmount:1,_id:0});
        const walletBalance = user.walletAmount;
        console.log(" walletBalance", walletBalance);
        return res.status(200).json({ walletBalance : walletBalance });

    } catch (error) {
        console.error(' error:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};

const profileResetPassword = async (req,res)=>{
    const userId = req.session.user_id;
    
    const newPassword = req.body.password;

    try {
        // Hash the new password before storing it
        const saltRounds = 10; // Adjust the number of salt rounds for security
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const newUser = await User.findByIdAndUpdate(userId, {$set : {password: hashedPassword} } );

        if(newUser)
            console.log('password udated');

        return res.status(200).json({success:true, message:'Your password has been successfully updated.'});
    } catch (error) {
        console.error(' error:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
}

module.exports={
    loadUserSignup,
    userSignupPost,
    verifyMail,
    userLoginLoad,
    userHomeLoad,
    userLoginPost,
    userLogout,
    userForgotLoad,
    forgotVerify,
    resetPasswordLoad,
    resetPasswordPost,
    otpLoginLoad,
    sendOtp,
    verifyOtp,
    userProductList,
    productDetail,
    addToCart,
    loadCart,
    updateCartItemQuantity,
    removeCartItem,
    addToFavorites,
    loadFavorites,
    deleteFavoriteItem,
    loadCheckout,
    addAddressCheckout,
    removeAddress,
    placeOrder,
    orderDetails,
    processPayment,
    userProfile,
    userAddressDetails,
    fetchOrders,
    fetchUserProfile,
    updateUserProfile,
    addAddressUserProfile,
    cancelOrder,
    returnOrder,
    validateCoupon,
    homeBanner,
    fetchWalletBalance,
    profileResetPassword,
};