const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const { upload: uploadConfig } = require('../config/env');

const uploadDir = path.resolve(process.cwd(), uploadConfig.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    const ok =
      allowed.includes(file.mimetype) ||
      (file.mimetype && file.mimetype.startsWith('image/'));
    if (ok) return cb(null, true);
    return cb(new Error('Only images (JPEG, PNG, WebP) or PDF are allowed'));
  },
  limits: { fileSize: uploadConfig.maxFileSizeMb * 1024 * 1024 },
});

const kycFields = [
  { name: 'aadhaarImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'ownerPhoto', maxCount: 1 },
  { name: 'shopPhoto', maxCount: 1 },
];

const uploadKycDocuments = upload.fields(kycFields);

module.exports = { uploadKycDocuments, kycFields };
