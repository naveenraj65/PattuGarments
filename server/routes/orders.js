import { Router } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ah, httpError } from '../utils/http.js';
import { normalizePhone } from '../utils/identity.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadProof, removeFile, PROOF_DIR } from '../middleware/upload.js';

const router = Router();
const FREE_SHIPPING_ABOVE = 100;
const SHIPPING_FEE = 15;
const round2 = (n) => Math.round(n * 100) / 100;
const TXN_RE = /^[A-Za-z0-9]{6,30}$/;

export const restoreStock = (items) =>
  Promise.all(items.map((i) => Product.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } })));

router.post('/', requireAuth, uploadProof.single('screenshot'), ah(async (req, res) => {
  const file = req.file;
  try {
    // ---- items (prices always come from the DB, never from the browser) ----
    let raw;
    try { raw = JSON.parse(req.body.items); } catch { throw httpError(400, 'Invalid cart'); }
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) throw httpError(400, 'Your cart is empty');

    const qtyById = new Map();
    for (const r of raw) {
      const qty = Number(r.quantity);
      if (!mongoose.isValidObjectId(r.productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw httpError(400, 'Invalid cart item');
      }
      qtyById.set(String(r.productId), (qtyById.get(String(r.productId)) || 0) + qty);
    }
    const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
    if (products.length !== qtyById.size) throw httpError(400, 'Some products are no longer available');

    const items = products.map((p) => ({
      productId: p._id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity: qtyById.get(p.id),
    }));

    // ---- address ----
    const a = req.body;
    const phone = normalizePhone(a.phone);
    const shippingAddress = {
      fullName: String(a.fullName || '').trim().slice(0, 100),
      phone,
      address: String(a.address || '').trim().slice(0, 300),
      city: String(a.city || '').trim().slice(0, 80),
      state: String(a.state || '').trim().slice(0, 80),
      pincode: String(a.pincode || '').trim().slice(0, 12),
    };
    if (!phone || Object.values(shippingAddress).some((v) => !v)) throw httpError(400, 'Fill all delivery details');

    // ---- payment ----
    const paymentMethod = a.paymentMethod;
    if (!['COD', 'ONLINE'].includes(paymentMethod)) throw httpError(400, 'Choose a payment method');
    let transactionId;
    if (paymentMethod === 'ONLINE') {
      if (!file) throw httpError(400, 'Upload your payment screenshot');
      if (a.transactionId) {
        if (!TXN_RE.test(String(a.transactionId).trim())) throw httpError(400, 'Transaction/UTR id looks invalid');
        transactionId = String(a.transactionId).trim();
      }
    }

    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const shipping = subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

    // ---- reserve stock atomically, roll back on any failure ----
    const reserved = [];
    try {
      for (const i of items) {
        const r = await Product.updateOne({ _id: i.productId, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity } });
        if (!r.modifiedCount) throw httpError(409, `"${i.name}" does not have enough stock`);
        reserved.push(i);
      }
      const order = await Order.create({
        userId: req.user._id, items, shippingAddress, subtotal, shipping,
        totalAmount: round2(subtotal + shipping), paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'COD_PENDING' : 'AWAITING_VERIFICATION',
        paymentProof: paymentMethod === 'ONLINE' ? file.filename : undefined,
        transactionId,
      });
      res.status(201).json(order);
    } catch (e) {
      await restoreStock(reserved);
      if (e.code === 11000) throw httpError(409, 'This transaction id was already used on another order');
      throw e;
    }
  } catch (e) {
    if (file) removeFile(PROOF_DIR, file.filename);
    throw e;
  }
}));

router.get('/mine', requireAuth, ah(async (req, res) => {
  res.json(await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }));
}));

// Customer re-uploads a screenshot (after admin rejected it, or to replace a wrong one)
router.put('/:id/payment-proof', requireAuth, uploadProof.single('screenshot'), ah(async (req, res) => {
  const file = req.file;
  try {
    if (!file) throw httpError(400, 'Upload your payment screenshot');
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) throw httpError(404, 'Order not found');
    if (order.paymentMethod !== 'ONLINE' || order.status === 'CANCELLED' || !['REJECTED', 'AWAITING_VERIFICATION'].includes(order.paymentStatus)) {
      throw httpError(400, 'Payment proof cannot be changed for this order');
    }
    const oldFile = order.paymentProof;
    order.paymentProof = file.filename;
    order.paymentStatus = 'AWAITING_VERIFICATION';
    order.paymentRejectReason = undefined;
    if (req.body.transactionId) {
      if (!TXN_RE.test(String(req.body.transactionId).trim())) throw httpError(400, 'Transaction/UTR id looks invalid');
      order.transactionId = String(req.body.transactionId).trim();
    }
    try { await order.save(); } catch (e) {
      if (e.code === 11000) throw httpError(409, 'This transaction id was already used on another order');
      throw e;
    }
    removeFile(PROOF_DIR, oldFile);
    res.json(order);
  } catch (e) {
    if (file) removeFile(PROOF_DIR, file.filename);
    throw e;
  }
}));

// Screenshot is private: only the order owner or an admin can view it
router.get('/:id/proof', requireAuth, ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Not found');
  const order = await Order.findById(req.params.id);
  if (!order || !order.paymentProof) throw httpError(404, 'Not found');
  if (req.user.role !== 'ADMIN' && !order.userId.equals(req.user._id)) throw httpError(404, 'Not found');
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
  res.sendFile(path.join(PROOF_DIR, path.basename(order.paymentProof)));
}));

export default router;
