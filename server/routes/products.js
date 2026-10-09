import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { ah, httpError } from '../utils/http.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadProduct } from '../middleware/upload.js';

const router = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (b) => ({
  name: b.name, description: b.description, price: Number(b.price),
  category: b.category, imageUrl: b.imageUrl,
  ...(Array.isArray(b.images) ? { images: b.images } : {}),
  stock: Number(b.stock),
});
const uploadProductImages = uploadProduct.fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 },
]);
const addUploadedImages = (body, req) => {
  const files = [...(req.files?.images || []), ...(req.files?.image || [])];
  if (files.length) {
    body.images = files.map((file) => `/uploads/products/${file.filename}`);
    body.imageUrl = body.images[0];
  } else if (body.imageUrl) {
    body.images = [body.imageUrl];
  }
};

router.get('/', ah(async (req, res) => {
  const filter = {};
  if (req.query.category && req.query.category !== 'All') filter.category = String(req.query.category);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  res.json(await Product.find(filter).sort({ createdAt: -1 }).limit(limit));
}));

router.get('/:id', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found');
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
}));

router.post('/', requireAdmin, uploadProductImages, ah(async (req, res) => {
  const body = { ...req.body };
  addUploadedImages(body, req);
  if (!body.imageUrl) throw httpError(400, 'Please upload a product image or provide an image URL');
  res.status(201).json(await Product.create(pick(body)));
}));

router.put('/:id', requireAdmin, uploadProductImages, ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found');
  const body = { ...req.body };
  addUploadedImages(body, req);
  const product = await Product.findByIdAndUpdate(req.params.id, pick(body), { new: true, runValidators: true });
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
}));

router.delete('/:id', requireAdmin, ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found');
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default router;
