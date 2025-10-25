import mongoose from 'mongoose';

const SavingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    savingType: {
      type: String,
      enum: ['accumulative', 'long-term'], // 'accumulative' = tích lũy (có thể nạp/rút), 'long-term' = dài hạn (chỉ nạp 1 lần)
      default: 'accumulative',
    },
    hasDeposited: {
      type: Boolean,
      default: false, // Track if long-term saving has already been deposited
    },
  },
  {
    timestamps: true,
  }
);

const Saving = mongoose.models.Saving || mongoose.model('Saving', SavingSchema);

export default Saving;
