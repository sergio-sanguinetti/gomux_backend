const express = require('express');
const router = express.Router();
const { 
  listarEtiquetas, 
  obtenerEtiqueta, 
  crearEtiqueta, 
  actualizarEtiqueta, 
  eliminarEtiqueta 
} = require('../controllers/etiquetaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarEtiquetas);
router.get('/:id', obtenerEtiqueta);
router.post('/', crearEtiqueta);
router.put('/:id', actualizarEtiqueta);
router.delete('/:id', eliminarEtiqueta);

module.exports = router;

