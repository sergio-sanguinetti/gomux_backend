const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { 
  listarVentas,
  obtenerVenta,
  crearVenta,
  actualizarEstadoVenta,
  eliminarVenta,
  obtenerEstadisticas
} = require('../controllers/ventaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta pública para crear ventas (desde el frontend)
router.post('/public', crearVenta);

// Ruta pública para obtener venta por número de orden (sin autenticación)
router.get('/public/orden/:numeroOrden', async (req, res) => {
  try {
    // Decodificar el número de orden por si viene codificado
    let { numeroOrden } = req.params;
    numeroOrden = decodeURIComponent(numeroOrden);
    
    console.log('🔍 Buscando venta con número de orden:', numeroOrden);
    console.log('📋 Parámetros recibidos:', req.params);
    
    const venta = await prisma.venta.findUnique({
      where: { numeroOrden: numeroOrden }
    });

    console.log('✅ Venta encontrada:', venta ? 'Sí' : 'No');

    if (!venta) {
      console.log('❌ Venta no encontrada para:', numeroOrden);
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    console.log('✅ Enviando venta:', venta.numeroOrden);
    res.json({
      success: true,
      data: { venta }
    });
  } catch (error) {
    console.error('❌ Error al obtener venta por número de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Todas las demás rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarVentas);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/:id', obtenerVenta);
router.put('/:id/estado', actualizarEstadoVenta);
router.delete('/:id', eliminarVenta);

module.exports = router;

