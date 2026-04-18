const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
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
    targetPrice: {
      type: Number,
      required: [true, 'Target price is required'],
    },
    condition: {
      type: String,
      enum: ['ABOVE', 'BELOW'],
      required: true,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// "Get all active alerts for a user"
alertSchema.index({ userId: 1, triggered: 1 });

// "Get all untriggered alerts for a symbol" — used by job processor
alertSchema.index({ symbol: 1, triggered: 1 });

module.exports = mongoose.model('Alert', alertSchema);