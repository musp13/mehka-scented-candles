const User = require('../models/userModel');

const isUserLogIn = async(req,res,next)=>{
    try {
        if(req.session.user_id)
        {
            const userId = req.session.user_id;
            const user = await User.findById(userId);
            if (user && !user.isBlocked) {
                next(); // User is logged in and not blocked, proceed to the next middleware/route
            } else {
                // User is blocked or not found, redirect to login
                /* req.session.destroy((error) =>{
                    if(error) {
                        console.log(error);
                    } */
                    //res.clearCookie('myCookie');
                    req.session.user_id = null;
                    res.redirect('/login');
                /* }) */
                
            }
        }
        else
        {
            res.redirect('/login');
        }
        

    } catch (error) {
        console.log(error.message);
        res.redirect('/login'); // Handle errors by redirecting to login
    }
}

const isUserLogOut = async(req,res,next)=>{
    try {
        if(req.session.user_id)
        {
            res.redirect('/userProductList');
        }
        next();

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
                    isUserLogIn,isUserLogOut
                 }
