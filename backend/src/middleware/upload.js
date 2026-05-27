const multer = require('multer');
const path = require('path');
const fs = require('fs');

const LIMITE_BYTES = 20 * 1024 * 1024; // 20 MB — RF02

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `${Date.now()}_${req.user?.id || 'anon'}${ext}`;
    cb(null, nombre);
  },
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png',
    'application/zip',
    'text/plain',
  ];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: LIMITE_BYTES },
  fileFilter,
});

// Middleware que maneja el error de tamaño de multer
const manejarErrorUpload = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Archivo demasiado grande.',
      detalle: `El tamaño máximo permitido es 20 MB. (CP03)`,
    });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

module.exports = { upload, manejarErrorUpload, LIMITE_BYTES };
