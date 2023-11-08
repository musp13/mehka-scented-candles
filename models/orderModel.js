const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon', // Reference to the User model
    default: null,
  },
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  deliveryDate: {
    type: Date,
  },
  isReturned : {
    type: Boolean,
    default: false,
  },
  totalAmount: {
    type: Number,
    required: true
  },
  address: {
    // Define the subdocument schema for address
    // You can include fields like fullName, addressLine, city, state, landmark, pin, phoneNumber, etc.
    fullName: String,
    addressLine: String,
    city: String,
    state: String,
    landmark: String,
    pin: String,
    phoneNumber: String
  },
  paymentMethod: {
    type: String,
    required: true
  },
  orderItems: [
    {
      // Define the subdocument schema for order items
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      discount :{
        type: Number,
        required: true
      },
      discountedPrice :{
        type: Number,
      }
    }
  ],
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled','placed','return','returnedBack'],
    default: 'pending',
    required: true
  },
  trackingNumber: {
    type: String
  },
  paymentReceived: {
    type: Boolean,
    default: false
  },
  isRefunded: {
    type: Boolean,
    default: false,
  },
  paymentId: String,
  invoiceId: String,
  signature: String,
  couponDiscountAmount: Number,
  cartAmount:Number,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
