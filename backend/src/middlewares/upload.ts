import multer from 'multer';
import { ValidationError } from '../exceptions/AppError';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const type = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    const byMime = ALLOWED.has(type);
    const byExt = /\.(jpe?g|png|webp|gif)$/i.test(name);
    if (byMime || (type === 'application/octet-stream' && byExt) || (!type && byExt)) {
      cb(null, true);
      return;
    }
    cb(new ValidationError('Please choose a JPG, PNG, WEBP or GIF image.'));
  },
});
