const express=require('express');
const userRouter=express.Router();
const passport = require('passport');
const {loadUserSignup,userSignupPost,verifyMail,userLoginLoad,userHomeLoad,userLoginPost,userLogout,userForgotLoad,
       forgotVerify,resetPasswordLoad,resetPasswordPost,otpLoginLoad,sendOtp,verifyOtp,
       userProductList,productDetail,addToCart,loadCart,updateCartItemQuantity,removeCartItem,
       addToFavorites,loadFavorites,deleteFavoriteItem,loadCheckout,addAddressCheckout,
       removeAddress,placeOrder,orderDetails,processPayment,userProfile,userAddressDetails,
       fetchOrders,fetchUserProfile,updateUserProfile,addAddressUserProfile,cancelOrder,
       returnOrder,validateCoupon, homeBanner, fetchWalletBalance, profileResetPassword} = require('../controllers/userController');
const {isUserLogIn,isUserLogOut} = require('../auth/protectUser');
const Product = require('../models/productModel');

userRouter.get('/', (req,res)=> res.redirect('/homeBanner'));
userRouter.get('/signup',isUserLogOut, loadUserSignup);
userRouter.post('/user_signup_post',userSignupPost);
userRouter.get('/verify_user',verifyMail);
userRouter.get('/login',isUserLogOut,userLoginLoad);
/* userRouter.get('/home',isUserLogIn,userHomeLoad); */
userRouter.get('/home',isUserLogIn, (req,res)=> res.redirect('/userProductList'));
userRouter.post('/userLoginPost',userLoginPost);
userRouter.get('/logout',isUserLogIn,userLogout);
userRouter.get('/forgot_password',userForgotLoad);
userRouter.post('/forgot_password_post',forgotVerify);
userRouter.get('/reset_password',resetPasswordLoad);
userRouter.post('/reset_password_post',resetPasswordPost);
userRouter.get('/otp_login_load',isUserLogOut,otpLoginLoad);
userRouter.post('/send_otp',sendOtp);
userRouter.post('/verify_otp',verifyOtp);
userRouter.get('/userProductList',isUserLogIn,userProductList);
userRouter.get('/productDetail',isUserLogIn,productDetail);
userRouter.post('/addToCart',addToCart);
userRouter.get('/cart',isUserLogIn, loadCart);
userRouter.post('/update-cart-item-quantity/:userId/:cartItemId',updateCartItemQuantity);
userRouter.delete('/remove-cart-item/:userId/:cartItemId',removeCartItem);
userRouter.post('/add-to-favorites/:userId/:productId',addToFavorites);
userRouter.get('/load-favorites',isUserLogIn,loadFavorites);
userRouter.post('/deleteFavorite/:userId',deleteFavoriteItem);
userRouter.get('/load-checkout',isUserLogIn,loadCheckout);
userRouter.post('/addAddressCheckout',addAddressCheckout);
userRouter.post('/removeAddress/:userId/:addressId',removeAddress);
userRouter.post('/placeOrder',placeOrder);
userRouter.get('/orderDetails/:orderId',isUserLogIn,orderDetails);
userRouter.post('/processPayment',processPayment);
userRouter.get('/userProfile',isUserLogIn,userProfile);
userRouter.get('/userAddressDetails',isUserLogIn,userAddressDetails);
userRouter.get('/fetchOrders',isUserLogIn,fetchOrders);
userRouter.get('/fetchUserProfile',isUserLogIn,fetchUserProfile);
userRouter.post('/updateUserProfile',isUserLogIn,updateUserProfile);
userRouter.post('/addAddressUserProfile',isUserLogIn,addAddressUserProfile);
userRouter.post('/cancelOrder/:orderId',isUserLogIn,cancelOrder);
userRouter.post('/returnOrder/:orderId',isUserLogIn,returnOrder);
userRouter.post('/validateCoupon',isUserLogIn,validateCoupon);
userRouter.get('/homeBanner',homeBanner); // ,isUserLogIn
userRouter.get('/fetchWalletBalance',isUserLogIn,fetchWalletBalance);
userRouter.post('/profileResetPassword',isUserLogIn,profileResetPassword);


module.exports = userRouter;