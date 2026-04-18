const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    buyPrice: {
      type: Number,
      required: true,
    },
    exchange: {
      type: String,
      enum: ['NSE', 'BSE'],
      default: 'NSE',
    },
  },
  { timestamps: true }
);

// Compound index — the key to fast queries
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);