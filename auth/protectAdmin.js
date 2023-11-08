const isAdminLogIn = async (req,res,next)=>{
    try {
        
        if(req.session.admin_id)
        {
            next();
        }
        else
        {
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const isAdminLogOut = async (req,res,next)=>{
    try {
        
        if(req.session.admin_id)
        {
            res.redirect('/admin/dashboard')
        }
        else
        {
            next();
        }

    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
                    isAdminLogIn,isAdminLogOut
                 }