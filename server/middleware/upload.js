import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { httpError } from '../utils/http.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');
export const QR_DIR = path.join(root, 'qr');          // served publicly
export const PROOF_DIR = path.join(root, 'proofs');   // private, served only via authenticated route
export const PRODUCT_DIR = path.join(root, 'products');
fs.mkdirSync(QR_DIR, { recursive: true });
fs.mkdirSync(PROOF_DIR, { recursive: true });
fs.mkdirSync(PRODUCT_DIR, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const make = (dir, maxFiles = 1) =>
  multer({
    storage: multer.diskStorage({
      destination: dir,
      // random name + extension from the verified mime type; the client's file name is never used
      filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) =>
      EXT[file.mimetype] ? cb(null, true) : cb(httpError(400, 'Only JPG, PNG or WEBP images are allowed')),
  });

export const uploadQr = make(QR_DIR);
export const uploadProof = make(PROOF_DIR);
export const uploadProduct = make(PRODUCT_DIR, 10);

export const removeFile = (dir, name) => {
  if (name) fs.unlink(path.join(dir, path.basename(name)), () => {});
};
