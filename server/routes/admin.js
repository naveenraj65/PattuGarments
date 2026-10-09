import { Router } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import { ah, httpError } from '../utils/http.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadQr, removeFile, QR_DIR } from '../middleware/upload.js';
import { restoreStock } from './orders.js';
import { sampleProducts } from '../seedData.js';

const router = Router();
router.use(requireAdmin);

const UPI_RE = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
const findOrder = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Order not found');
  const order = await Order.findById(id);
  if (!order) throw httpError(404, 'Order not found');
  return order;
};

router.get('/stats', ah(async (_req, res) => {
  const [products, users, activeOrders, pendingPayments] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Order.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } }),
    Order.countDocuments({ paymentStatus: 'AWAITING_VERIFICATION', status: { $ne: 'CANCELLED' } }),
  ]);
  res.json({ products, users, activeOrders, pendingPayments });
}));

// ---- orders & payment verification ----
router.get('/orders', ah(async (req, res) => {
  const filter = {};
  if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300).populate('userId', 'name email phone');
  res.json(orders.map((o) => {
    const json = o.toJSON();
    json.customer = o.userId && { id: o.userId.id, name: o.userId.name, email: o.userId.email, phone: o.userId.phone };
    json.userId = o.userId?.id;
    return json;
  }));
}));

router.patch('/orders/:id/payment', ah(async (req, res) => {
  const order = await findOrder(req.params.id);
  if (order.paymentMethod !== 'ONLINE' || order.status === 'CANCELLED') {
    throw httpError(400, 'No online payment to verify on this order');
  }
  if (order.paymentStatus !== 'AWAITING_VERIFICATION') throw httpError(400, 'This payment is already reviewed');

  if (req.body.action === 'verify') {
    order.paymentStatus = 'PAID';
    order.paymentRejectReason = undefined;
    if (order.status === 'PENDING') order.status = 'CONFIRMED';
  } else if (req.body.action === 'reject') {
    order.paymentStatus = 'REJECTED';
    order.paymentRejectReason = String(req.body.reason || 'Payment could not be verified').trim().slice(0, 300);
  } else {
    throw httpError(400, 'action must be verify or reject');
  }
  await order.save();
  res.json(order);
}));

router.patch('/orders/:id/status', ah(async (req, res) => {
  const order = await findOrder(req.params.id);
  const next = req.body.status;
  if (!['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(next)) throw httpError(400, 'Invalid status');
  if (order.status === 'CANCELLED') throw httpError(400, 'Cancelled orders cannot be changed');
  // never ship goods that are not paid for yet (online orders)
  if (['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(next) && order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
    throw httpError(400, 'Verify the payment screenshot before processing this order');
  }
  if (next === 'CANCELLED') await restoreStock(order.items);
  if (next === 'DELIVERED' && order.paymentMethod === 'COD') order.paymentStatus = 'PAID'; // cash collected
  order.status = next;
  await order.save();
  res.json(order);
}));

// ---- payment QR / UPI settings ----
router.post('/payment-qr', uploadQr.single('qr'), ah(async (req, res) => {
  if (!req.file) throw httpError(400, 'Choose a QR image');
  const old = await Setting.findOneAndUpdate({ key: 'payment' }, { qrImage: req.file.filename }, { upsert: true });
  removeFile(QR_DIR, old?.qrImage);
  res.json({ qrUrl: `/uploads/qr/${req.file.filename}` });
}));

router.put('/payment-settings', ah(async (req, res) => {
  const upiId = String(req.body.upiId || '').trim();
  if (upiId && !UPI_RE.test(upiId)) throw httpError(400, 'UPI id looks invalid (example: name@okaxis)');
  await Setting.findOneAndUpdate({ key: 'payment' }, { upiId }, { upsert: true });
  res.json({ upiId });
}));

router.post('/seed-products', ah(async (_req, res) => {
  if (await Product.exists({})) throw httpError(400, 'Products already exist');
  await Product.insertMany(sampleProducts);
  res.json({ ok: true });
}));

export default router;
