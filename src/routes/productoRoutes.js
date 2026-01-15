const express = require('express');
const router = express.Router();
const { 
  listarProductos, 
  obtenerProducto,
  obtenerProductoPorSlug, 
  crearProducto, 
  actualizarProducto, 
  eliminarProducto 
} = require('../controllers/productoController');
const { verificarToken } = require('../middleware/authMiddleware');
const { uploadImagenPrincipal, uploadGaleria, upload } = require('../middleware/uploadMiddleware');

// Rutas públicas (sin autenticación)
// IMPORTANTE: La ruta de slug debe ir ANTES de /public/:id para evitar conflictos
router.get('/public', listarProductos);
// Ruta para slug con catch-all para manejar slugs con /
router.get('/public/slug/*', (req, res, next) => {
  // Extraer el slug de la ruta (todo después de /public/slug/)
  // req.params[0] contiene todo lo que viene después de *
  let slug = req.params[0] || '';
  
  // Si el slug está vacío, intentar obtenerlo de req.path
  if (!slug && req.path) {
    slug = req.path.replace(/^\/api\/productos\/public\/slug\//, '').replace(/^\/public\/slug\//, '');
  }
  
  // Decodificar el slug si viene codificado (puede venir como %2F para /)
  try {
    slug = decodeURIComponent(slug);
  } catch (e) {
    // Si falla la decodificación, usar el slug tal cual
    console.warn('Error al decodificar slug, usando tal cual:', slug);
  }
  
  console.log('Slug recibido en ruta:', slug);
  
  // Asignar el slug decodificado a req.params para que el controlador lo use
  req.params.slug = slug;
  obtenerProductoPorSlug(req, res, next);
});
router.get('/public/:id', obtenerProducto);

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', upload.fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeriaImagenes', maxCount: 10 }
]), crearProducto);
router.put('/:id', upload.fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeriaImagenes', maxCount: 10 }
]), actualizarProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;

