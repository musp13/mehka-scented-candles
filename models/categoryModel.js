const mongoose = require('mongoose');

const category = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
    },
    /* parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Reference to itself for hierarchical categories
    }, */
    description: String,
    /* imageUrl: String, */
    createdAt: {
      type: Date,
      default: Date.now,
    },
    hidden: {
      type: Boolean,
      default:false,
    }
  });

const Category = mongoose.model("Category",category);

module.exports = Category;
  