const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with collision-resistant unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(6).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, safeExt)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 20) || 'media';
    cb(null, `${cleanBase}-${Date.now()}-${randomHex}${safeExt}`);
  }
});

// File filter accepting images, videos, and PDF documents
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/svg+xml',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Supported formats: Images (JPEG, PNG, WEBP, AVIF, SVG, GIF), Videos (MP4, WEBM), and PDF documents'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  }
});

module.exports = upload;
