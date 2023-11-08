const mongoose=require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true,
    },
    quantity:{
        type:Number,
        default:1,
    },
});

const addressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    addressLine: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    pin: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        default: '', // make it optional with a default empty string
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    });

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required:true,
    },
    email:{
        type: String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
    },
    birthday:{
        type:Date,
    },
    gender:{
        type:String,
        enum:['male','female'],
    },
    address:[addressSchema], // Define address as an array of addressSchema
    pin:{
        type:String,
    },
    profileImage:{
        type:String,
        default:'User-avatar.svg',
    },
    cart: [cartItemSchema],
    favorites:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
    }],
    isVerified:{
        type:Boolean,
        default:false,
    },
    token:{
        type:String,
        default:'',
    },
    otp:{
        type:String,
        default:'',
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    walletAmount :{
        type: Number,
        default: 0,
    }
});

const User= mongoose.model('User',userSchema);

module.exports = User;


