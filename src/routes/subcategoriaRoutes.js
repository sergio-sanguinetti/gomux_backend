const express = require('express');
const router = express.Router();
const { 
  listarSubcategorias, 
  obtenerSubcategoria, 
  crearSubcategoria, 
  actualizarSubcategoria, 
  eliminarSubcategoria 
} = require('../controllers/subcategoriaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública para listar subcategorías (sin autenticación)
router.get('/public', listarSubcategorias);

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarSubcategorias);
router.get('/:id', obtenerSubcategoria);
router.post('/', crearSubcategoria);
router.put('/:id', actualizarSubcategoria);
router.delete('/:id', eliminarSubcategoria);

module.exports = router;

