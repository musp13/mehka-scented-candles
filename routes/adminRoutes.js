const express=require('express');
const adminRouter=express.Router();
const multer  =require('multer');
const Product = require('../models/productModel');

const {adminLoginView,generateAdmin,adminLoginPost,adminLogout,userManagementLoad,
    blockUser,adminSearchUser,
    categoryManagementLoad,addCategoryPost,deleteCategory,editCategoryLoad,editCategoryPost,
    productManagementLoad,addNewProductLoad,addProductPost,deleteProduct,updateProductLoad,
    updateProductPost,deleteAuxiliaryImage,orderManagementLoad,updatePaymentReceived,
    updateOrderStatus,getCategories,listUnlistCategory,manageCouponsLoad,addCouponLoad,
    addCouponPost,editCouponLoad,editCouponPost,deleteCoupon,salesReport, salesReportByDate,
    getAllSalesReport,getcategorySalesReport,bannerList,addBanner,addBannerPost,editBanner,
    editBannerPost,deleteBanner,dashboard,expandUserDetails,adminProductDetail,
    salesReportToday,salesReportThisWeek,salesReportThisMonth} = require('../controllers/adminController');
const {isAdminLogIn,isAdminLogOut} = require('../auth/protectAdmin');
const upload = require('../multer/multer_setup');
const bannerUpload = require('../multer/multer_banner');
const { cropImage,cropOptions }= require('../image_utility/imageUtils');

//----------only for developer to gnerate an admin---------------
/* adminRouter.get('/create_admin',generateAdmin); */
//----------only for developer-----------------------------------

adminRouter.get('/',isAdminLogOut,adminLoginView);
adminRouter.post('/login_post',adminLoginPost);
adminRouter.get('/dashboard',dashboard);//isAdminLogIn,
adminRouter.get('/logout',isAdminLogIn,adminLogout);
adminRouter.get('/user_management_load',isAdminLogIn,userManagementLoad);
adminRouter.post('/block_user',isAdminLogIn,blockUser);
/* //adminRouter.get('/user_info',userInfo); */
adminRouter.post('/adminSearchUser',adminSearchUser);
//adminRouter.get('/addNewUserLoad',isAdminLogIn,addNewUserLoad);
/* adminRouter.post('/addUserPost',addUserPost); */
adminRouter.get('/categoryManagementLoad',isAdminLogIn,categoryManagementLoad);
adminRouter.get('/getCategories',isAdminLogIn,getCategories);
adminRouter.post('/addCategoryPost',addCategoryPost);
adminRouter.get('/delete_category',isAdminLogIn,deleteCategory);
adminRouter.get('/edit_category_load',isAdminLogIn,editCategoryLoad);
adminRouter.post('/editCategoryPost',editCategoryPost);
adminRouter.get('/productManagementLoad',isAdminLogIn,productManagementLoad);
adminRouter.get('/addNewProductLoad',isAdminLogIn,addNewProductLoad);
adminRouter.post('/addProductPost',upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'auxiliaryImages', maxCount: 6 },
  ]), addProductPost);
adminRouter.delete('/delete_product',isAdminLogIn,deleteProduct);
adminRouter.get('/updateProductLoad',isAdminLogIn,updateProductLoad);
adminRouter.post('/updateProductPost',upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'auxiliaryImages', maxCount: 6 },
  ]),updateProductPost);
adminRouter.post('/delete_auxiliary_image',deleteAuxiliaryImage);
adminRouter.get('/orderManagementLoad',isAdminLogIn,orderManagementLoad);
adminRouter.post('/update_payment_received',updatePaymentReceived);
adminRouter.post('/update_order_status',updateOrderStatus);
adminRouter.post('/listUnlistCategory',listUnlistCategory);
adminRouter.get('/manageCouponsLoad',isAdminLogIn,manageCouponsLoad);
adminRouter.get('/addCouponLoad',isAdminLogIn,addCouponLoad);
adminRouter.post('/addCouponPost',addCouponPost);
adminRouter.get('/editCouponLoad',isAdminLogIn,editCouponLoad);
adminRouter.post('/editCouponPost',isAdminLogIn,editCouponPost);
adminRouter.delete('/deleteCoupon',isAdminLogIn,deleteCoupon);
adminRouter.get('/salesReport',isAdminLogIn,salesReport);
adminRouter.get('/salesReportByDate',isAdminLogIn,salesReportByDate);
adminRouter.get('/getAllSalesReport',isAdminLogIn,getAllSalesReport);
adminRouter.get('/getcategorySalesReport',isAdminLogIn,getcategorySalesReport); // isAdminLogIn,
adminRouter.get('/bannerList',isAdminLogIn,bannerList);
adminRouter.get('/addBanner',isAdminLogIn,addBanner);
adminRouter.post('/addBannerPost',bannerUpload.single('image'),addBannerPost);
adminRouter.get('/editBanner',isAdminLogIn,editBanner);
adminRouter.post('/editBannerPost',isAdminLogIn,editBannerPost);
adminRouter.delete('/deleteBanner/:bannerId',isAdminLogIn,deleteBanner);
adminRouter.get('/expandUserDetails',expandUserDetails);
adminRouter.get('/adminProductDetail',adminProductDetail);
adminRouter.get('/salesReportToday', salesReportToday);
adminRouter.get('/salesReportThisWeek', salesReportThisWeek);
adminRouter.get('/salesReportThisMonth', salesReportThisMonth);


module.exports = adminRouter;
