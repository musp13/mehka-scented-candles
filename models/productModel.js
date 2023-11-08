const mongoose = require('mongoose');

const product = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stockLeft: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: parseInt(0),
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
  aromaLevel: {
    type: String,
    enum: ['soft', 'medium', 'strong'],
  },
  aromaType: {
    type: String,
    enum: ['fruits', 'nature', 'parfum'],
  },
  productSize: {
    type: String,
    enum: ['small', 'medium', 'big'],
  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reference to the Category model
  },
  rating: {
    type: Number,
    default:0,
  },
  reviews: [
    {
      reviewerName: String,
      rating: Number,
      reviewText: String,
    },
  ],
  detailDescription: {
    type: String,
  },
  ingredients: {
    type: String,
  },
  howToUse: {
    type: String,
  },
  howToFeel: {
    type: String,
  },
  mainImage: {
    type: String, // Store the image filename/path
    required: true
  },
  auxiliaryImages: [{
    type: String, // Store the image filenames/paths
  }],
  isDeleted: {
    type: Boolean,
    default : false,
  },

});

const Product = mongoose.model('Product', product);

module.exports = Product;

