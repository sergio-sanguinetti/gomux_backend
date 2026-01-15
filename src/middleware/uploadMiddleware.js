const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Determinar el prefijo según el campo del formulario
    let prefix = 'producto-';
    if (file.fieldname === 'banner') {
      prefix = 'banner-';
    }
    
    cb(null, prefix + uniqueSuffix + ext);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB límite por archivo
    files: 11 // máximo 11 archivos (1 principal + 10 galería)
  },
  fileFilter: fileFilter
});

// Middleware para una imagen principal
const uploadImagenPrincipal = upload.single('imagenPrincipal');

// Middleware para múltiples imágenes (galería)
const uploadGaleria = upload.array('galeriaImagenes', 10); // máximo 10 imágenes

module.exports = {
  uploadImagenPrincipal,
  uploadGaleria,
  upload
};

