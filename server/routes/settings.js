import { Router } from 'express';
import Setting from '../models/Setting.js';
import { ah } from '../utils/http.js';

const router = Router();

// Public: checkout page needs the admin's QR + UPI id
router.get('/payment', ah(async (_req, res) => {
  const s = await Setting.findOne({ key: 'payment' });
  res.json({ upiId: s?.upiId || '', qrUrl: s?.qrImage ? `/uploads/qr/${s.qrImage}` : null });
}));

export default router;
