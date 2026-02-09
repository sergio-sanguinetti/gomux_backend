const express = require('express');
const router = express.Router();
const {
  listarDescuentos,
  obtenerDescuento,
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento,
  descuentosActivos
} = require('../controllers/descuentoController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública para la tienda (gomu.mx)
router.get('/public/activos', descuentosActivos);

// Resto requiere autenticación
router.use(verificarToken);
router.get('/', listarDescuentos);
router.get('/:id', obtenerDescuento);
router.post('/', crearDescuento);
router.put('/:id', actualizarDescuento);
router.delete('/:id', eliminarDescuento);

module.exports = router;
