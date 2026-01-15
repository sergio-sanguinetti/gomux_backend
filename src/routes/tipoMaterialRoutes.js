const express = require('express');
const router = express.Router();
const { 
  listarTiposMaterial, 
  obtenerTipoMaterial, 
  crearTipoMaterial, 
  actualizarTipoMaterial, 
  eliminarTipoMaterial 
} = require('../controllers/tipoMaterialController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública para listar tipos de material (sin autenticación)
router.get('/public', listarTiposMaterial);

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarTiposMaterial);
router.get('/:id', obtenerTipoMaterial);
router.post('/', crearTipoMaterial);
router.put('/:id', actualizarTipoMaterial);
router.delete('/:id', eliminarTipoMaterial);

module.exports = router;

