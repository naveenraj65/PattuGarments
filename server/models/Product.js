import mongoose from 'mongoose';
import { toJSON } from './plugin.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ['Men', 'Women', 'Kids', 'Accessories'] },
    imageUrl: { type: String, required: true },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, toJSON }
);
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);
