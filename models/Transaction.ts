import mongoose from 'mongoose';

export interface ITransaction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
}

const TransactionSchema = new mongoose.Schema<ITransaction>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: {
      values: ['income', 'expense'],
      message: 'Type phải là income hoặc expense'
    },
    required: [true, 'Loại giao dịch là bắt buộc'],
  },
  category: {
    type: String,
    required: [true, 'Danh mục là bắt buộc'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Số tiền là bắt buộc'],
    min: [0, 'Số tiền phải lớn hơn hoặc bằng 0'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TransactionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Transaction || 
  mongoose.model<ITransaction>('Transaction', TransactionSchema);