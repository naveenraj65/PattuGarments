import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveRuntimeConfig, DEV_MONGODB_URI } from './config.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import { QR_DIR, PRODUCT_DIR } from './middleware/upload.js';

const { isProd, PORT, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN } = resolveRuntimeConfig();
process.env.MONGODB_URI = MONGODB_URI;
process.env.JWT_SECRET = JWT_SECRET;
process.env.PORT = String(PORT);
if (CLIENT_ORIGIN) process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return;

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      existing.role = 'ADMIN';
      await existing.save();
    }
    return;
  }

  await User.create({
    name: 'Pattu Garments Admin',
    email: adminEmail,
    phone: '+919999999999',
    role: 'ADMIN',
  });

  console.log(`Admin account ensured for ${adminEmail}`);
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    if (!isProd && MONGODB_URI === DEV_MONGODB_URI) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create({ instance: { dbName: 'voguevibe' } });
        await mongoose.connect(mongoServer.getUri('voguevibe'));
        console.log(`MongoDB connected via in-memory server (${mongoServer.getUri('voguevibe')})`);
      } catch (memoryError) {
        console.error('MongoDB fallback failed:', memoryError);
        throw error;
      }
    } else {
      throw error;
    }
  }

  await ensureAdminUser();

  const app = express();
  app.set('trust proxy', 1);
  app.use(cors({ origin: CLIENT_ORIGIN || false, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

  // Only the QR folder is public. Payment screenshots are NOT served statically.
  app.use('/uploads/qr', express.static(QR_DIR, { setHeaders: (r) => r.set('X-Content-Type-Options', 'nosniff') }));
  app.use('/uploads/products', express.static(PRODUCT_DIR, { setHeaders: (r) => r.set('X-Content-Type-Options', 'nosniff') }));

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(root, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message; }
    else if (err.code === 11000) { status = 409; message = 'Already exists'; }
    else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors)[0]?.message || 'Invalid data'; }
    else if (status >= 500) { console.error(err); message = 'Something went wrong on the server'; }
    res.status(status).json({ message });
  });

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((e) => { console.error('Failed to start:', e); process.exit(1); });
