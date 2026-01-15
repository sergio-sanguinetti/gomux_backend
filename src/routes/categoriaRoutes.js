const express = require('express');
const router = express.Router();
const { 
  listarCategorias, 
  obtenerCategoria, 
  crearCategoria, 
  actualizarCategoria, 
  eliminarCategoria 
} = require('../controllers/categoriaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública para listar categorías (sin autenticación)
router.get('/public', listarCategorias);

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarCategorias);
router.get('/:id', obtenerCategoria);
router.post('/', crearCategoria);
router.put('/:id', actualizarCategoria);
router.delete('/:id', eliminarCategoria);

module.exports = router;

