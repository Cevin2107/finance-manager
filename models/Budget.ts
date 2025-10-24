import mongoose from 'mongoose';

export interface IBudget extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
  createdAt: Date;
}

const BudgetSchema = new mongoose.Schema<IBudget>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: [true, 'Danh mục là bắt buộc'],
    trim: true,
  },
  limit: {
    type: Number,
    required: [true, 'Hạn mức là bắt buộc'],
    min: [0, 'Hạn mức phải lớn hơn 0'],
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Chi tiêu không thể âm'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Budget || 
  mongoose.model<IBudget>('Budget', BudgetSchema);