import mongoose from 'mongoose';
import { toJSON } from './plugin.js';

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    imageUrl: String,
    quantity: { type: Number, required: true, min: 1 },
    reviewed: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], required: true },
    shippingAddress: {
      fullName: String, phone: String, address: String, city: String, state: String, pincode: String,
    },
    subtotal: Number,
    shipping: Number,
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], required: true },
    // COD_PENDING: pay on delivery | AWAITING_VERIFICATION: screenshot uploaded, admin must check
    // PAID: admin verified (or COD delivered) | REJECTED: admin rejected the screenshot
    paymentStatus: {
      type: String,
      enum: ['COD_PENDING', 'AWAITING_VERIFICATION', 'PAID', 'REJECTED'],
      required: true,
    },
    paymentProof: { type: String },          // file name inside uploads/proofs (private)
    transactionId: { type: String, uppercase: true, trim: true },
    paymentRejectReason: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    toJSON: {
      ...toJSON,
      transform: (doc, ret) => {
        toJSON.transform(doc, ret);
        ret.hasPaymentProof = !!ret.paymentProof;
        delete ret.paymentProof; // never leak the stored file name
        return ret;
      },
    },
  }
);
// One UTR/transaction id can only be used on one order (blocks re-using the same payment)
orderSchema.index({ transactionId: 1 }, { unique: true, partialFilterExpression: { transactionId: { $type: 'string' } } });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
