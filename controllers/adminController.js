const Admin=require('../models/adminModel');
const User=require('../models/userModel');
const mongoose=require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring=require('randomstring');
const {emailUser,emailPassword}=require('../config/config');
const Category = require('../models/categoryModel'); //
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel'); 
const Banner = require('../models/bannerModel'); 
const multer =require('multer');
const fs = require('fs');
const { cropImage,cropOptions }= require('../image_utility/imageUtils');
const { bannerCropImage,bannerCropOptions }= require('../image_utility/bannerImageUtils');
const { log } = require('console');

/* const upload = multer({ storage: storage }); // Use the custom storage configuration
 */

const generateAdmin = async (req,res)=>{
    
    // Your custom admin data
            const adminData = { 
                username: 'admin',
                password: 'helloadmin',
            };
    try{
        //Generate a salt for password hashing
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);

        //HAsh the password
        const hashedPassword= await bcrypt.hash(adminData.password,salt);

        //Update the adminData object with the hashed password
        adminData.password=hashedPassword;

        // Create an instance of the Admin model with the provided data
        const admin=new Admin(adminData);
        console.log('created adminData object instance',admin);
        
        // Save the admin to the databasea
        const savedAdmin= await admin.save();

        console.log('Admin saved successfully:', savedAdmin);
        res.send('Admin saved successfully');
    }
    catch(err)
    {
        console.error('Error saving admin:', err);
        res.status(500).send('Error saving admin');
    }
}

const adminLoginView = (req,res)=>{
    res.render('admin_login');
};

const adminLoginPost  = async (req,res)=>{
    try {

        const {admin_username,admin_password} = req.body;
        const adminData = await Admin.findOne({username:admin_username});
        if(adminData)
        {
            const passwordMatch =await bcrypt.compare(admin_password,adminData.password);
            if(passwordMatch)
            {
                if(adminData.isAdmin)
                {
                    req.session.admin_id=adminData.id;
                    res.redirect('/admin/dashboard');   
                }
                else
                {
                    res.render('admin_login',{message:"Email and password is incorrect"});
                }
            }
            else
            {
                res.render('admin_login',{message:"Email and password is incorrect"});
            }
        }
        else
        {
            res.render('admin_login',{message:"Email and password is incorrect"});
        }
        
    } catch (error) {
        console.log(error.message);
    }
};

const adminLogout= async (req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
            console.log();
    }
}

const userManagementLoad=async (req,res)=>{
    try{
        const users= await User.find();
        //console.log('inside load users view',users)
        res.render('adminViewUsers',{users:users});
    }
    catch(err)
    {
        console.log(err.message);
    }
};

const blockUser= async (req, res)=>{
    try
    {
        console.log('reached blobk user');
        const userId=req.body.userId;
        console.log(userId+' is the id to be blocked/unblocked')
        // Find the user by ID
        const user = await User.findById(userId);

        // Toggle the isBlocked property
        const isBlocked = !user.isBlocked;

        // Update the user's isBlocked property
        await User.findByIdAndUpdate(userId, { $set: { isBlocked: isBlocked } });

        // Send a success response to the client
        res.status(200).json({ message: 'User block/unblock successful' });
    }
    catch(error)
    {
        console.log(error.message);
        // Send an error response to the client
        res.status(500).json({ error: 'An error occurred while processing the request' });

    }
}


const adminSearchUser= async (req,res)=>{
    try{
        
        const foundUser = await User.findOne({email:req.body.email});
        res.render('adminUserDetail',{user:foundUser});
        
    }
    catch(error)
    {
        console.log(error.message)
    }
}

const categoryManagementLoad =async (req,res)=>{
    try {
        const categories= await Category.find().sort({createdAt:-1});
        /* console.log('inside load users view',users) */
        res.render('adminCategoryManagement',{categories:categories});

    } catch (error) {
        console.log(error.message);
    }
};

const getCategories = async (req, res) => {
    try {
        console.log('inside getCategories');
      // Fetch all categories sorted by creation date
      const categories = await Category.find().sort({ createdAt: -1 });
  
      // Render the categories list as HTML
      res.json({success:true, categories });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching categories' });
    }
  };

const addCategoryPost= async (req,res)=>{
    try {
        const { categoryName, categoryDescription } = req.body;

        // Check if a category with the same name (case-sensitive) already exists
        const existingCategory = await Category.findOne({ name: { $regex: categoryName, $options: 'i' } });

        if (existingCategory) {
            // Category with the same name already exists, handle accordingly (e.g., show an error message)
            const categories= await Category.find();
            res.json({ message: 'Category with this name already exists.',categories:categories });
        }
        else
        {
            // Create a new category object
            const newCategory = new Category({
            name: categoryName,
            description: categoryDescription
            });

            // Save the new category to the database
            const savedCategory = await newCategory.save();

            // Return a JSON response with the new category data
            res.json({ success: true, category: savedCategory });
            //res.redirect('/admin/categoryManagementLoad'); // Redirect to the category management page
            
        }
    } catch (error) {
        console.log(error.message);
    }
};

const deleteCategory= async (req,res)=>{
    try {
        
        const id=req.query.id;
        /* console.log(id+' is the id to be deleted') */
        await Category.deleteOne({_id:id});
        res.redirect('/admin/categoryManagementLoad');

    } catch (error) {
        console.log(error.message);
    }
};

const editCategoryLoad = async (req,res)=>{
    try {
        const id=req.query.id;
        const category = await  Category.findById({_id:id});
        res.render('adminUpdateCategory',{category:category});
    } catch (error) {
        console.log(error.message);
    }
};

const editCategoryPost = async (req,res)=>{
    try
    {
        console.log(req.body);
        const category = await Category.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,description:req.body.description}});
        res.redirect('/admin/categoryManagementLoad');
    }
    catch(error)
    {
        console.log(error.message);
    }
};

const productManagementLoad = async (req,res)=>{
    try {
        const categories = await Category.find();
        //const products = await Product.find().sort({addedDate:-1});
        const products = await Product.aggregate([
            {
                $match: {isDeleted:false},
            },
            {
                $lookup : {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind : '$category'
            },
            {
                $match : { 'category.hidden' : {$ne: true} }
            },
            {
                $sort : { addedDate : -1}
            }
        ]); 
        console.log(products);
        res.render('adminManageProducts',{products:products,categories:categories});
    } catch (error) {
        console.log(error.message);
    }
};

const addNewProductLoad= async (req,res)=>{
    try {
        const categories = await Category.find();
        const productNames  = await Product.find({},{_id:0,name:1});
        console.log(productNames);
        const existingProductNames = productNames.map( product => product.name );
        console.log(existingProductNames);
        res.render('adminAddProduct',{ categories: categories, existingProductNames:existingProductNames });
    } catch (error) {
        console.log(error.message);
    }
};


const addProductPost = async (req, res) => {
    try {
        categories = await Category.find();
        console.log("inside add products post", req.file);
        const {
            name,
            description,
            category,
            quantity,
            price,
            stockLeft,
            detailDescription,
            ingredients,
            discount,
            aromaLevel,
            aromaType,
            productSize,
            howToUse,
            howToFeel,
        } = req.body;

        // Process and save the form data to the database
        const newProduct = new Product({
            name,
            description,
            category,
            quantity,
            price,
            stockLeft,
            detailDescription,
            ingredients,
            discount,
            aromaLevel,
            aromaType,
            productSize,
            howToUse,
            howToFeel,
        });

        // Get the filenames of the uploaded images from req.files
        let mainImageFileName = ''; // Initialize an empty string

        if (req.files['mainImage'] && req.files['mainImage'][0]) {
            mainImageFileName = req.files['mainImage'][0].filename; // Assign the filename if it exists
            const mainImageFile = req.files['mainImage'][0];

            // Crop the main image before unlinking the old one
            const croppedMainImageFileName = await cropImage(mainImageFile, cropOptions);

            // Unlink the old main image (if any)
            if (mainImageFileName) {
                try {
                    await fs.promises.unlink(`public/images/products/${mainImageFileName}`);
                    console.log(`Old main image ${mainImageFileName} deleted.`);
                } catch (unlinkError) {
                    console.error(`Error deleting old main image: ${unlinkError}`);
                }
            }

            newProduct.mainImage = croppedMainImageFileName;
        } else {
            return res.render('adminAddProduct', { categories: categories, message: 'Please Add Main Image' });
        }

        console.log('first file field passed');

        // Check if new auxiliary images were selected
        if (req.files['auxiliaryImages']) {
            const auxiliaryImageFiles = req.files['auxiliaryImages'];
            const croppedAuxiliaryImageFileNames = [];

            for (const auxiliaryImageFile of auxiliaryImageFiles) {
                const auxiliaryImageFileName = auxiliaryImageFile.filename;

                // Crop the auxiliary image before unlinking the old one
                const croppedAuxiliaryImageFileName = await cropImage(auxiliaryImageFile, cropOptions);
                croppedAuxiliaryImageFileNames.push(croppedAuxiliaryImageFileName);

                // Unlink the old auxiliary images (if any)
                try {
                    await fs.promises.unlink(`public/images/products/${auxiliaryImageFileName}`);
                    console.log(`Old auxiliary image ${auxiliaryImageFileName} deleted.`);
                } catch (unlinkError) {
                    console.error(`Error deleting old auxiliary image: ${unlinkError}`);
                }
            }

            newProduct.auxiliaryImages.push(...croppedAuxiliaryImageFileNames);
        }

        // Save the updated product
        await newProduct.save();

        res.redirect('/admin/productManagementLoad?categories=categories'); // Redirect after successfully saving the product
    } catch (error) {
        console.log(error.message);
        /* res.render('error-page', { error: 'An error occurred while adding the product' }); */ // Render an error page if something goes wrong
        res.send(error.message);
    }
};

const deleteProduct = async (req,res)=>{
    try {
        const productId = req.query.id;

        // Find the product by ID and delete it
        const deletedProduct = await Product.findByIdAndUpdate(productId,{$set:{isDeleted:true}});

        if (!deletedProduct) {
            
            console.log('Product not found');
            return res.status(404).json({ error: 'Product not found' });
            /* res.redirect('/admin/productManagementLoad'); */
        }

        
        // Send a success response
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        /* res.status(500).json({ error: 'An error occurred while deleting the product' }); */
        res.status(500).json({ error: 'An error occurred while deleting the product' });

    }
};

const updateProductLoad = async (req,res)=>{
    try {

        const productId = req.query.id;
        const product = await Product.findById(productId);
        const categories= await Category.find();

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Retrieve the current product name
        const currentProductName = product.name;

        // Query the database to get all product names excluding the current product name
        const productNames = await Product.find({ name: { $ne: currentProductName } }, { _id: 0, name: 1 });

        // Extract the product names from the query result
        const existingProductNames = productNames.map((product) => product.name);


        // Render the update product EJS file and pass the 'product' object
        res.render('adminEditProduct', { product:product , categories:categories, existingProductNames: existingProductNames});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the product' });
    }
};

const updateProductPost = async (req, res) => {
    try {
        const productId = req.query.productId; // Get the product ID from the URL
        const {
            name,
            description,
            category,
            quantity,
            price,
            stockLeft,
            detailDescription,
            ingredients,
            discount,
            aromaLevel,
            aromaType,
            productSize,
            howToUse,
            howToFeel,
        } = req.body;

        // Fetch the existing product from the database by its ID
        const existingProduct = await Product.findById(productId);

        if (!existingProduct) {
            return res.status(404).send('Product not found'); // Handle the case when the product doesn't exist
        }

        // Update the fields with the new values
        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.category = category;
        existingProduct.quantity = quantity;
        existingProduct.price = price;
        existingProduct.stockLeft = stockLeft;
        existingProduct.detailDescription = detailDescription;
        existingProduct.ingredients = ingredients;
        existingProduct.discount = discount;
        existingProduct.aromaLevel = aromaLevel;
        existingProduct.aromaType = aromaType;
        existingProduct.productSize = productSize;
        existingProduct.howToUse = howToUse;
        existingProduct.howToFeel = howToFeel;

        // Handle file uploads

        /* const cropOptions = { width: 500, height: 500 }; // Adjust crop dimensions as needed */

        if (req.files) {
            // Check if a new main image was selected
            if (req.files['mainImage']) {
                const mainImageFileName = req.files['mainImage'][0].filename;
                const mainImageFile = req.files['mainImage'][0];
                const croppedMainImageFileName = await cropImage(mainImageFile, cropOptions);

                // Unlink the old main image (if any)
                if (existingProduct.mainImage) {
                    try {
                        await fs.promises.unlink(`public/images/products/${mainImageFileName}`);
                        console.log(`Old main image ${mainImageFileName} deleted.`);
                    } catch (unlinkError) {
                        console.error(`Error deleting old main image: ${unlinkError}`);
                    }
                }

                existingProduct.mainImage = croppedMainImageFileName;
            }

            // Check if new auxiliary images were selected
            if (req.files['auxiliaryImages']) {
                const auxiliaryImageFiles = req.files['auxiliaryImages'];
                const croppedAuxiliaryImageFileNames = [];

                for (const auxiliaryImageFile of auxiliaryImageFiles) {
                    const auxiliaryImageFileName = auxiliaryImageFile.filename;
                    const croppedAuxiliaryImageFileName = await cropImage(auxiliaryImageFile, cropOptions);
                    croppedAuxiliaryImageFileNames.push(croppedAuxiliaryImageFileName);

                    // Unlink the old auxiliary images (if any)
                    try {
                        await fs.promises.unlink(`public/images/products/${auxiliaryImageFileName}`);
                        console.log(`Old auxiliary image ${auxiliaryImageFileName} deleted.`);
                    } catch (unlinkError) {
                        console.error(`Error deleting old auxiliary image: ${unlinkError}`);
                    }
                }

                existingProduct.auxiliaryImages.push(...croppedAuxiliaryImageFileNames);

            }
        }

        // Save the updated product
        await existingProduct.save();

        res.redirect('/admin/productManagementLoad'); // Redirect after successfully updating the product
    } catch (error) {
        console.log(error.message);
        res.send(error.message);
    }
};

const deleteAuxiliaryImage= async (req,res)=>{
    console.log('delete button clicked');
    const imageToDelete = req.body.image;

    try {
        // Locate and delete the image from the server's storage
        fs.unlinkSync(`D:/musP/brocamp/week_11/public/images/products/${imageToDelete}`);

        // Remove the image from the product document in the database
        const product = await Product.findOne({ _id: req.body.productId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        console.log('product is fuond');
        console.log('image to delete',imageToDelete);
        console.log('auxiliary image array',product.auxiliaryImages);

        const updatedAuxiliaryImages = product.auxiliaryImages.filter((image) => image !== imageToDelete);
        product.auxiliaryImages = updatedAuxiliaryImages;

        await product.save();

        return res.json({ success: true, message: 'Image deleted successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error deleting image.' });
    }
};

const orderManagementLoad = async (req,res)=>{
    try {
        const orders = await Order.find()
                        .populate('orderItems.productId')
                        .populate('userId')
                        .sort({orderDate:-1}); // Sort in descending order of createdAt

        res.render('adminOrderManagement',{orders:orders});
    } catch (error) {
        console.log(error.message);
    }
};

const updatePaymentReceived = async (req,res)=>{
    const { id, value } = req.query;
    console.log(req.query);
    
    try {
        // Find the order in the database using 'id' and update 'paymentReceived' with 'value'
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.paymentReceived = value === 'true'; // Convert value to a boolean
        await order.save();
        res.status(200).json({ message: 'Payment Received updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateOrderStatus = async (req,res)=>{
    const { id, value } = req.query;
    
    try {
        // Find the order in the database using 'id' and update 'orderStatus' with 'value'
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if(value==='returnedBack')
        {
            order.isReturned=true;
        }
        // If the order is being marked as 'cancelled' or 'returnedBack'
        if (['cancelled', 'returnedBack'].includes(value) && order.paymentReceived && !order.isRefunded) {
            // Calculate the refund amount (You need to define how the refund amount is calculated)
            const refundAmount = order.totalAmount;
    
            // Update the 'walletAmount' in the user collection by adding the refund amount
            const user = await User.findById(order.userId);
            user.walletAmount += refundAmount;
            order.isRefunded = true;
            await user.save();
        }
        
        order.orderStatus = value;

        // If 'value' is 'delivered', set 'deliveryDate' to the current date
        if(value==='delivered')
            order.deliveryDate = new Date();
        
        await order.save();
        // If the order is canceled or returned, update the product stock
        if (value === 'cancelled' || value === 'returnedBack') {
            for (const orderItem of order.orderItems) {
                const { productId, quantity } = orderItem;

                // Update the product document in the product collection
                const product = await Product.findById(productId);
                product.stockLeft += quantity;
                await product.save();
            }
        }
        res.status(200).json({ message: 'Order Status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const listUnlistCategory = async (req, res) => {
    try {
      
      const { categoryId, isHidden } = req.body;
  
      // Find the category by ID and update the hidden field
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      category.hidden = !category.hidden;
      console.log(category);
      await category.save();
  
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

const manageCouponsLoad = async (req, res)=>{
    try {
        const coupons = await Coupon.find();
        res.render('adminCouponManagement',{coupons:coupons});
    } catch (error) {
        console.log(error.message);
    }
};

const addCouponLoad = async (req,res)=>{
    try {
        const couponCodes = await Coupon.find({},{couponCode:1,_id:0});
        const couponCodesArray = couponCodes.map(coupon=>coupon.couponCode);
        console.log(couponCodesArray);
        res.render('adminAddCoupon',{couponCodes:couponCodesArray});
    } catch (error) {
        console.log(error.message);
    }
};

const addCouponPost = async (req,res)=>{
    try {
        const {
            couponName,
            couponCode,
            discountType,
            discountAmount,
            expiryDate,
            minBillAmount,
            maxUsagePerUser,
            description,
            isActive,
        } = req.body;

        // Create a new coupon document using your Mongoose model
        const newCoupon = new Coupon({
            couponName,
            couponCode,
            discountType,
            discountAmount,
            expiryDate,
            minBillAmount,
            maxUsagePerUser,
            description,
            isActive: isActive === 'true',// Convert the value to a boolean
        });

        // Save the new coupon to the database
        await newCoupon.save();

        // Redirect to a success page or do something else
        res.redirect('/admin/manageCouponsLoad');
    } catch (error) {
        console.log(error.message);
    }
};

const editCouponLoad = async (req,res)=>{
    try {
        const couponId = req.query.couponId;
        console.log(couponId)

        //find couponcodes to check for unique value
        const couponCodes = await Coupon.find({_id:{$ne:couponId}},{couponCode:1,_id:0});
        const couponCodesArray = couponCodes.map(coupon=>coupon.couponCode);

        //find the current coupon
        const coupon = await Coupon.findById(couponId);

        res.render('adminEditCoupon',{coupon:coupon,couponCodes:couponCodesArray});

    } catch (error) {
        console.log(error.message);
    }
};

const editCouponPost = async (req,res)=>{
    try {
        const couponId = req.body.couponId; // Assuming you have an input field with the couponId in the form
        const updatedCouponData = {
            couponName : req.body.couponName,
            couponCode : req.body.couponCode,
            discountType : req.body.discountType,
            discountAmount : req.body.discountAmount,
            expiryDate : req.body.expiryDate,
            maxUsage : req.body.maxUsage,
            maxUsagePerUser : req.body.maxUsagePerUser,
            description : req.body.description,
            isActive : req.body.isActive,
        } = req.body;

        await Coupon.findByIdAndUpdate(couponId, updatedCouponData);

        // Redirect to a success page or update form
        res.redirect('/admin/manageCouponsLoad'); 
        
    } catch (error) {
        console.log(error.message);
    }
};

const deleteCoupon = async (req,res)=>{
    try {
        const couponId = req.body.couponId; // Extract the couponId from the request
        console.log('reached delete copon',couponId);

        // Use Mongoose or your database library to delete the coupon by its ID
        await Coupon.findByIdAndRemove(couponId);

        res.send('Coupon deleted successfully');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error deleting coupon');
    }
};

const salesReport = async (req,res)=>{
    try {

        const orders = await Order.find({paymentReceived: true})
        .populate('userId','fullName')
        .populate('orderItems.productId','name');
        res.render('salesReport',{orders:orders});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error loading Sales Report');
    }
};

const salesReportByDate = async (req,res)=>{
    try {
        console.log('hello reached server side');
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const reportType = req.query.reportType;

        // Perform a database query or data retrieval based on the date range
        const salesData = await Order.find({
            orderDate:{$gte: new Date(startDate),$lte: new Date(endDate)}, paymentReceived: true
        })
        .populate('userId','fullName')
        .populate('orderItems.productId','name');

        const tableHead = `
            <input type="hidden" id="reportType" name="reportType" value="allSales">
            <thead>
            <tr>
                <th scope="col">ORDER ID</th>
                <th scope="col">USER NAME</th>
                <th scope="col">ITEM NAME</th>
                <th scope="col">PRICE</th>
                <th scope="col">PAYMENT MODE</th>
                <th scope="col">DATE</th>
            </tr>
            </thead>
            <tbody id="sales-report-table-body">
        `;

        const tableEnd = `
                </tbody>
            </table>
        `;

        if(salesData.length>0)
        {
            // Construct the HTML for the sales report table rows
            const tableRows = salesData.map((order)=>{
                return `
                <tr>
                    <th scope="row" style="color: #666666;">${order._id}</th>
                    <td>${order.userId.fullName}</td>
                    <td>
                    ${order.orderItems.map((item, index) => `
                        ${index + 1}) ${item.productId.name} <span style="color: red">x ${item.quantity}</span><br>
                    `).join('')}
                    </td>
                    <td>${order.totalAmount}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${new Date(order.orderDate).toLocaleString()}</td>
                </tr> 
                `;
            });
            
            // Update the innerHTML of the sales report table container
            //document.getElementById('salesReportTable').innerHTML = tableHead+ tableRows.join('') + tableEnd;
            res.send(tableHead+ tableRows.join('') + tableEnd)
        } else {
            // If no sales data is found, send a message indicating so
            //document.getElementById('salesReportTable').innerHTML = tableHead+ '<tr><td colspan="6">No Sales Found</td></tr>' + tableEnd;
            res.send(tableHead+ '<tr><td colspan="6">No Sales Found</td></tr>' + tableEnd);
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error loading Sales Report by date');
    }
};

const getAllSalesReport = async (req,res)=>{
    try{
        const salesData = await Order.find({paymentReceived: true})
            .populate('userId','fullName')
            .populate('orderItems.productId','name');
            const tableHead = `
                <input type="hidden" id="reportType" name="reportType" value="allSales">
                <thead>
                <tr>
                    <th scope="col">ORDER ID</th>
                    <th scope="col">USER NAME</th>
                    <th scope="col">ITEM NAME</th>
                    <th scope="col">PRICE</th>
                    <th scope="col">PAYMENT MODE</th>
                    <th scope="col">DATE</th>
                </tr>
                </thead>
                <tbody id="sales-report-table-body">
            `;

            const tableEnd = `
                    </tbody>
                </table>
            `;

            if(salesData.length>0)
        {
            // Construct the HTML for the sales report table rows
            const tableRows = salesData.map((order)=>{
                return `
                <tr>
                    <th scope="row" style="color: #666666;">${order._id}</th>
                    <td>${order.userId.fullName}</td>
                    <td>
                    ${order.orderItems.map((item, index) => `
                        ${index + 1}) ${item.productId.name} <span style="color: red">x ${item.quantity}</span><br>
                    `).join('')}
                    </td>
                    <td>${order.totalAmount}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${new Date(order.orderDate).toLocaleString()}</td>
                </tr> 
                `;
            });
            
            // Update the innerHTML of the sales report table container
            //document.getElementById('salesReportTable').innerHTML = tableHead+ tableRows.join('') + tableEnd;
            res.send(tableHead+ tableRows.join('') + tableEnd)
        } else {
            // If no sales data is found, send a message indicating so
            //document.getElementById('salesReportTable').innerHTML = tableHead+ '<tr><td colspan="6">No Sales Found</td></tr>' + tableEnd;
            res.send(tableHead+ '<tr><td colspan="6">No Sales Found</td></tr>' + tableEnd);
        }
    }catch (error) {
        console.log(error.message);
        res.status(500).send('Error loading All Sales Report');
    }
};

const getcategorySalesReport = async (req,res)=>{
    try {
            const categorySalesData = await Order.aggregate([
                {
                    $match: {
                        paymentReceived: true // Filter orders with specific statuses
                    }
                },
                {
                    $unwind: '$orderItems' // Split order items into separate documents
                },
                {
                    $lookup: {
                      from: 'products', // Name of the Product collection
                      localField: 'orderItems.productId', // Field in the Order collection
                      foreignField: '_id', // Field in the Product collection
                      as: 'product',
                    },
                },
                {
                    $lookup: {
                      from: 'categories', // Name of the category collection
                      localField: 'product.category', // Field in the Order collection
                      foreignField: '_id', // Field in the Product collection
                      as: 'category',
                    },
                },
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
                            }
                        },
                        sales: {
                            $push: {
                                _id: '$_id',
                                // Add other fields that you want to keep from each document
                                orderItems: '$orderItems', // Keep the orderItems array
                                category: { $arrayElemAt: ['$category.name', 0] },
                                productId: '$product._id',
                                product: { $arrayElemAt: ['$product.name', 0] },
                                price: '$orderItems.discountedPrice', // Extract discountedPrice from orderItems
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id.date', // Group by date
                        categories: {
                            $push: {
                                category: '$_id.category',
                                sales: '$sales'
                            }
                        }
                    }
                }
            ]);

            console.dir(categorySalesData, { depth: null });

            let salesData = []; // Create an array to store results

            if (categorySalesData.length > 0) {
            categorySalesData.forEach((dateCategorySales) => {
                const date = dateCategorySales._id;
                let previousCategory = null; // Keep track of the previous category

                dateCategorySales.categories.forEach((category) => {
                const categoryName = category.sales[0].category;
                const totalQuantity = category.sales.reduce((acc, sale) => acc + sale.orderItems.quantity, 0);
                const totalSalesAmount = category.sales.reduce((acc, sale) => acc + sale.orderItems.price, 0);

                if (previousCategory !== categoryName) {
                    salesData.push({
                    date,
                    category: categoryName,
                    quantity: totalQuantity,
                    totalAmount: totalSalesAmount,
                    });
                } else {
                    salesData.push({
                    date,
                    category: '', // Empty string for category if it's a duplicate date
                    quantity: totalQuantity,
                    totalAmount: totalSalesAmount,
                    });
                }

                previousCategory = categoryName;
                });
            });

            // At this point, you have the salesData array with the required information

          const tableHead = `
          <input type="hidden" id="reportType" name="reportType" value="categorySales">
          <thead>
          <tr>
              <th scope="col">DATE</th>
              <th scope="col">CATEGORY</th>
              <!--<th scope="col">ITEM NAMES</th>-->
              <th scope="col">QUANTITY</th>
              <th scope="col">SALES AMOUNT</th>
          </tr>
          </thead>
          <tbody id="category-sales-report-table-body">
      `;
  
      const tableEnd = `
          </tbody>
      </table>
      `;

        const tableRows = salesData.map((data) => `
            <tr>
            <td>${data.date}</td>
            <td>${data.category}</td>
            <td>${data.quantity}</td>
            <td>${data.totalAmount}</td>
            </tr>
        `);
        // Send the HTML response to the client
        res.send(tableHead + tableRows.join('') + tableEnd);
      } else {
        // If no category sales data is found, send a message indicating so
        res.send(tableHead + '<tr><td colspan="5">No Category Sales Found</td></tr>' + tableEnd);
      }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error loading Category Sales Report');
    }
};

const bannerList = async (req,res)=>{
    try {
        const banners = await Banner.find();
        res.render('adminBannerList',{banners:banners});
    } catch (error) {
        console.log(error.message);
    }
};

const addBanner = async (req, res)=>{
    try {
        res.render('adminAddBanner');
    } catch (error) {
        console.log(error.message);
    }
};

const addBannerPost = async (req,res)=>{
    try {
        const {
            title,
            link,
            description,
        } = req.body;

        const newBanner = new Banner({
            title,
            link,
            description,  
        });

        let mainImageFileName = ''; // Initialize an empty string

        if (req.file) {
            console.log('error here?');
            mainImageFileName = req.file.filename; // Assign the filename if it exists
            const mainImageFile = req.file;// Access the uploaded image
            console.log('mainImageFileName',mainImageFileName);

            // Crop the main image before unlinking the old one
            const croppedMainImageFileName = await bannerCropImage(mainImageFile, bannerCropOptions);

            // Unlink the old main image (if any)
            if (mainImageFileName) {
                try {
                    await fs.promises.unlink(`public/images/banners/uploaded/${mainImageFileName}`);
                    console.log(`Old main image ${mainImageFileName} deleted.`);
                } catch (unlinkError) {
                    console.error(`Error deleting old main image: ${unlinkError}`);
                }
            }

            newBanner.image = croppedMainImageFileName;
        }
        else {
            console.log('error adding image name');
            return res.redirect('/admin/addBanner');
        }

        // Save the new banner
        await newBanner.save();
        
        res.redirect('/admin/bannerList');

    } catch (error) {
        console.log(error.message);
    }
};

const editBanner = async (req,res)=>{
    try {
        const bannerId = req.query.id;
        const banner = await Banner.findById(bannerId);
        res.render('adminEditBanner', {banner:banner});
    } catch (error) {
        console.log(error.message);
    }
}

const editBannerPost = async (req,res)=>{
    try {
        const bannerId = req.body.bannerId; // Get the banner ID from the form data
        console.log(req.body);

        // Find the banner by ID from your database
        const banner = await Banner.findById(bannerId);

        if (!banner) {
            // Handle the case where the banner with the given ID is not found
            return res.status(404).send('Banner not found');
        }

        // Update the banner properties based on the form data
        banner.title = req.body.title;
        banner.description = req.body.description;
        banner.link = req.body.link;

        // Save the updated banner
        await banner.save();

        // Redirect to the banner list page or any other page as needed
        res.redirect('/admin/bannerList');
    
    } catch (error) {
        console.log(error.message);
    }
}

const deleteBanner = async (req,res)=>{
    try {
        const bannerId = req.params.bannerId;
        console.log('inside delete banner');

        const deleted = await Banner.findByIdAndDelete(bannerId);

        res.json({ message: 'Banner deleted successfully' });

    } catch (error) {
        console.log(error.message);
    }
    
};

const getOnlineCount = async () => {
    try {
      const onlinePayments = await Order.aggregate([
        {
          $match: {
            paymentMethod: "Online Payment", // Replace with your specific online payment method criteria
            paymentReceived: true, // Replace with your specific status criteria
            orderStatus: {
                $nin: ['returnedBack', 'cancelled'] // Order status not in ['returnedBack', 'cancelled']
            },
          }
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('hello inside online pay count',onlinePayments[0]);
      /* return onlinePayments[0];  */// Assuming you expect a single result
      if ((typeof onlinePayments[0]) ==='undefined')
        return {_id: null, totalPriceSum: 0, count: 0};
      return onlinePayments[0]; 
    } catch (error) {
      console.error("Error fetching online payment data: " + error);
      return null;
    }
  };

  const getWalletCount = async () => {
    try {
      const walletPayments = await Order.aggregate([
        {
          $match: {
            paymentMethod: "wallet", // Replace with your specific wallet payment method criteria
            paymentReceived: true // Replace with your specific status criteria
          }
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ]);
      if ((typeof walletPayments[0]) ==='undefined')
        return {_id: null, totalPriceSum: 0, count: 0};
      return walletPayments[0]; // Assuming you expect a single result
    } catch (error) {
      console.error("Error fetching wallet payment data: " + error);
      return null;
    }
  };

  const getCodCount = async () => {
    try {
      const codPayments = await Order.aggregate([
        {
          $match: {
            paymentMethod: "COD", // Replace with your specific COD payment method criteria
            paymentReceived: true // Replace with your specific status criteria
          }
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        },
      ]);
      if ((typeof codPayments[0]) ==='undefined')
        return {_id: null, totalPriceSum: 0, count: 0};
      return codPayments[0]; // Assuming you expect a single result
    } catch (error) {
      console.error("Error fetching COD payment data: " + error);
      return null;
    }
  };
  

const dashboard = async (req,res)=>{
    try {
        const orders = await Order.aggregate([
            {
              $match: {
                paymentReceived: true,  // Consider only completed orders
                orderStatus: {$not:{$in:['cancelled','returnedBack']}},
              }
            },
            { $unwind: "$orderItems" },
            {
              $group: {
                _id: null,
                totalPriceSum: { $sum: { $toInt: "$totalAmount" } },
                count: { $sum: 1 }
              }
            },
      
          ]);
          console.log('orders',orders);
          console.dir(orders, { depth: null });
          

            const categorySales = await Order.aggregate([
                {
                    $match: {
                    paymentReceived: true,  // Replace with your specific status criteria
                    orderStatus: {$not:{$in:['cancelled','returnedBack']}},
                    }
                },
                { $unwind: "$orderItems" },
                {
                    $lookup: {
                    from: 'products', // The name of the User collection
                    localField: 'orderItems.productId', // Assuming userId is the user's _id field
                    foreignField: '_id',
                    as: 'product'
                    }
                },
                {
                    $lookup: {
                    from: 'categories', // The name of the User collection
                    localField: 'product.category', // Assuming userId is the user's _id field
                    foreignField: '_id',
                    as: 'category'
                    }
                },
                {
                $group: {
                    _id: "$category.name", // Assuming "category" references the Category model
                    PriceSum: { $sum: "$orderItems.discountedPrice" }
                }
                },
                {
                $project: {
                    categoryName: { $arrayElemAt: ["$_id", 0] },
                    PriceSum: 1,
                    _id: 0
                }
                }
            ]);
          
          const salesData = await Order.aggregate([
            {
                $match: {
                  paymentReceived: true,  // Replace with your specific status criteria
                  orderStatus: {$not:{$in:['cancelled','returnedBack']}},
                }
            },
            { $unwind: "$orderItems" },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$orderDate"
                  }
                },
                dailySales: { $sum: "$orderItems.discountedPrice" }
              }
            },
            {
              $sort: {
                _id: 1
              }
            }
          ]);

          const salesCount = await Order.aggregate([
            {
              $match: {
                paymentReceived: true,  // Replace with your specific status criteria
                orderStatus: {$not:{$in:['cancelled','returnedBack']}},
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$orderDate"
                  }
                },
                orderCount: { $sum: 1 }
              }
            },
            {
              $sort: {
                _id: 1
              }
            }
          ]);

            const productsCount = await Product.countDocuments({});
            const categoryCount = await Category.countDocuments({});
            const onlinePay = await getOnlineCount();
            const walletPay = await getWalletCount();
            const codPay = await getCodCount();
            console.log('codPay',codPay);
            
            const latestorders = await Order.aggregate([
                {
                    $match: {
                      "orderStatus": {
                        $ne: "pending" // Exclude orders with 'pending' status
                      }
                    }
                },
                /* { $unwind: "$orderItems" }, */
                { $sort: { "orderDate": -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                      from: 'users', // The name of the User collection
                      localField: 'userId', // Assuming userId is the user's _id field
                      foreignField: '_id',
                      as: 'user'
                    }
                },
                {
                    $project: {
                      _id: "$_id",
                      name: "$user.fullName",
                      total: "$totalAmount",
                      status: "$orderStatus",
                      date: "$orderDate",
                      // Adjust this based on your User schema
                      // Include other fields from the Order collection as needed
                    }
                  }
              ]);
      
              console.log('categorySales',categorySales);
            
    
            res.render('admin_dashboard',{orders,productsCount,categoryCount,
                onlinePay,salesData,latestorders:latestorders,salesCount,
                walletPay,codPay,categorySales})
    } catch (error) {
        console.log(error.message);
    }
};

const expandUserDetails = async (req,res)=>{
    try {
        const userId = req.query.userId;
        const user = await User.findById(userId);

        res.render('adminUserDetail',{user:user});
    } catch (error) {
        console.log(error.message);
    }
};

const adminProductDetail = async (req, res)=>{
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);
        const category = await Category.findById(product.category);

        res.render('adminProductDetail',{product:product,category:category.name});
    } catch (error) {
        console.log(error.message);
    }
}
const salesReportToday = async (req,res)=>{
    const today = new Date();
    today.setHours(0,0,0,0);// Set to the beginning of the day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate()+1);// Set to the next day

    try
    {
        const orders = await Order.find({paymentReceived: true,
                                         orderDate: {$gte: today, $lt: tomorrow }
                                        })
                                        .populate('userId', 'fullName')
                                        .populate('orderItems.productId','name');
        res.render('salesReport',{orders:orders,startDate:today,endDate:tomorrow});

    }
    catch(error)
    {
        console.log(error);
        res.status(500).send('Error loading Sales Report for today');
    }
};

const salesReportThisWeek = async (req,res)=>{

};

const salesReportThisMonth = async (req,res)=>{

};

module.exports= {adminLoginView,generateAdmin, adminLoginPost,adminLogout,
                 userManagementLoad,/* deleteUser, */blockUser,/* userInfo, */adminSearchUser,
                 /* addNewUserLoad, *//* addUserPost, */categoryManagementLoad,addCategoryPost,deleteCategory,
                 editCategoryLoad,editCategoryPost,productManagementLoad,
                 addNewProductLoad,addProductPost,deleteProduct,updateProductLoad,updateProductPost,
                 deleteAuxiliaryImage,orderManagementLoad,updatePaymentReceived,updateOrderStatus,getCategories,
                 listUnlistCategory,manageCouponsLoad,addCouponLoad,addCouponPost,editCouponLoad,editCouponPost,
                 deleteCoupon,salesReport, salesReportByDate,getAllSalesReport,getcategorySalesReport,bannerList,
                 addBanner,addBannerPost,editBanner,editBannerPost,deleteBanner,dashboard,expandUserDetails, adminProductDetail,
                 salesReportToday,salesReportThisWeek,salesReportThisMonth};