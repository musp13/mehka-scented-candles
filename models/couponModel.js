const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponName:{
    type: String,
    required:true,
  },
  couponCode: {
    type: String,
    unique: true,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  /* maxUsage: {
    type: Number,
    default: null, // null means no maximum usage limit
  }, */
  minBillAmount: {
    type: Number,
    default: null, // null means no maximum usage limit
  },
  maxUsagePerUser: {
    type: Number,
    default: null, // null means no maximum usage limit per user
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
  },
  // Add a field for tracking users and their usage
  userUsage: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Assuming you have a User model
      ref: 'User', // Replace 'User' with the actual model name for users
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  }],
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
