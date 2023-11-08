const mongoose=require('mongoose');

const admin = mongoose.Schema({
    username:{
        type    :String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:true,
    },
});

const Admin = mongoose.model("Admin",admin);

module.exports = Admin;