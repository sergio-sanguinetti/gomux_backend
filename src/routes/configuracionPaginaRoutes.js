const express = require('express');
const router = express.Router();
const { 
  obtenerConfiguracionPagina, 
  actualizarConfiguracionPagina,
  obtenerProductosDestacados,
  subirBannerSlider
} = require('../controllers/configuracionPaginaController');
const { verificarToken } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Ruta pública para obtener productos destacados (sin autenticación)
router.get('/public/productos-destacados', obtenerProductosDestacados);

// Rutas protegidas (requieren autenticación)
router.use(verificarToken);

router.get('/', obtenerConfiguracionPagina);
router.put('/', actualizarConfiguracionPagina);
router.post('/upload-banner', upload.single('banner'), subirBannerSlider);

module.exports = router;

