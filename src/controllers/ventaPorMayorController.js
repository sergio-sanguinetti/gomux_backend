const prisma = require('../config/prisma');

// Listar todas las ventas al por mayor de un producto
const listarVentasPorMayor = async (req, res) => {
  try {
    const { productoId } = req.params;
    const ventas = await prisma.ventaPorMayor.findMany({
      where: { productoId: parseInt(productoId) },
      orderBy: { cantidadMinima: 'asc' }
    });

    res.json({
      success: true,
      data: { ventasPorMayor: ventas }
    });
  } catch (error) {
    console.error('Error al listar ventas al por mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar ventas al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener una venta al por mayor por ID
const obtenerVentaPorMayor = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await prisma.ventaPorMayor.findUnique({
      where: { id: parseInt(id) },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            costoVenta: true
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta al por mayor no encontrada'
      });
    }

    res.json({
      success: true,
      data: { ventaPorMayor: venta }
    });
  } catch (error) {
    console.error('Error al obtener venta al por mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear una venta al por mayor
const crearVentaPorMayor = async (req, res) => {
  try {
    const { productoId, cantidadMinima, precioPorCantidad, descuento } = req.body;

    if (!productoId || !cantidadMinima || !precioPorCantidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: productoId, cantidadMinima, precioPorCantidad'
      });
    }

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const venta = await prisma.ventaPorMayor.create({
      data: {
        productoId: parseInt(productoId),
        cantidadMinima: parseInt(cantidadMinima),
        precioPorCantidad: parseFloat(precioPorCantidad),
        descuento: descuento ? parseFloat(descuento) : null,
        activo: true
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            costoVenta: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { ventaPorMayor: venta }
    });
  } catch (error) {
    console.error('Error al crear venta al por mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear venta al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar una venta al por mayor
const actualizarVentaPorMayor = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidadMinima, precioPorCantidad, descuento, activo } = req.body;

    const ventaActual = await prisma.ventaPorMayor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ventaActual) {
      return res.status(404).json({
        success: false,
        message: 'Venta al por mayor no encontrada'
      });
    }

    const venta = await prisma.ventaPorMayor.update({
      where: { id: parseInt(id) },
      data: {
        cantidadMinima: cantidadMinima !== undefined ? parseInt(cantidadMinima) : ventaActual.cantidadMinima,
        precioPorCantidad: precioPorCantidad !== undefined ? parseFloat(precioPorCantidad) : ventaActual.precioPorCantidad,
        descuento: descuento !== undefined ? (descuento ? parseFloat(descuento) : null) : ventaActual.descuento,
        activo: activo !== undefined ? activo : ventaActual.activo
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            costoVenta: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { ventaPorMayor: venta }
    });
  } catch (error) {
    console.error('Error al actualizar venta al por mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar venta al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar una venta al por mayor
const eliminarVentaPorMayor = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await prisma.ventaPorMayor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta al por mayor no encontrada'
      });
    }

    await prisma.ventaPorMayor.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Venta al por mayor eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar venta al por mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar venta al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener ventas al por mayor públicas (para el frontend)
const obtenerVentasPorMayorPublicas = async (req, res) => {
  try {
    const { productoId } = req.params;
    const ventas = await prisma.ventaPorMayor.findMany({
      where: { 
        productoId: parseInt(productoId),
        activo: true
      },
      orderBy: { cantidadMinima: 'asc' },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            costoVenta: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { ventasPorMayor: ventas }
    });
  } catch (error) {
    console.error('Error al obtener ventas al por mayor públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas al por mayor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarVentasPorMayor,
  obtenerVentaPorMayor,
  crearVentaPorMayor,
  actualizarVentaPorMayor,
  eliminarVentaPorMayor,
  obtenerVentasPorMayorPublicas
};

