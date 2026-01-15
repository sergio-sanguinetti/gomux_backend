const express = require('express');
const router = express.Router();
const { 
  listarVentasPorMayor,
  obtenerVentaPorMayor,
  crearVentaPorMayor,
  actualizarVentaPorMayor,
  eliminarVentaPorMayor,
  obtenerVentasPorMayorPublicas
} = require('../controllers/ventaPorMayorController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública (sin autenticación) para obtener ventas al por mayor de un producto
router.get('/public/producto/:productoId', obtenerVentasPorMayorPublicas);

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/producto/:productoId', listarVentasPorMayor);
router.get('/:id', obtenerVentaPorMayor);
router.post('/', crearVentaPorMayor);
router.put('/:id', actualizarVentaPorMayor);
router.delete('/:id', eliminarVentaPorMayor);

module.exports = router;

