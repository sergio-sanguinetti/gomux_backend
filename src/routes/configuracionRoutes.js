const express = require('express');
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion } = require('../controllers/configuracionController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Obtener configuración
router.get('/', obtenerConfiguracion);

// Actualizar configuración
router.put('/', actualizarConfiguracion);

module.exports = router;

