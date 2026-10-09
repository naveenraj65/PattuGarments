import mongoose from 'mongoose';

// Single document (key: 'payment') holding the admin's UPI QR + UPI id
const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  upiId: { type: String, default: '' },
  qrImage: { type: String, default: '' }, // file name inside uploads/qr
});

export default mongoose.model('Setting', settingSchema);
