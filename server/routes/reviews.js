import { Router } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { ah, httpError } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const checkId = (id) => { if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Product not found'); };

router.get('/product/:productId', ah(async (req, res) => {
  checkId(req.params.productId);
  res.json(await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }));
}));

// Can this user review the product? (needs a DELIVERED order with a not-yet-reviewed item)
router.get('/eligibility/:productId', requireAuth, ah(async (req, res) => {
  checkId(req.params.productId);
  const order = await Order.exists({
    userId: req.user._id, status: 'DELIVERED',
    items: { $elemMatch: { productId: req.params.productId, reviewed: false } },
  });
  res.json({ canReview: !!order });
}));

router.post('/', requireAuth, ah(async (req, res) => {
  const { productId, comment } = req.body;
  const rating = Number(req.body.rating);
  checkId(productId);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Rating must be 1 to 5');
  if (!String(comment || '').trim()) throw httpError(400, 'Write a short comment');

  // atomically mark one delivered item as reviewed -> prevents double reviews
  const order = await Order.findOneAndUpdate(
    { userId: req.user._id, status: 'DELIVERED', items: { $elemMatch: { productId, reviewed: false } } },
    { $set: { 'items.$.reviewed': true } }
  );
  if (!order) throw httpError(403, 'You can review only products you received');

  const review = await Review.create({
    productId, userId: req.user._id, userName: req.user.name, rating,
    comment: String(comment).trim().slice(0, 1000),
  });
  res.status(201).json(review);
}));

export default router;
