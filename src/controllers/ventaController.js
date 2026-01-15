const prisma = require('../config/prisma');

// Generar número de orden único
function generarNumeroOrden() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
}

// Listar todas las ventas
const listarVentas = async (req, res) => {
  try {
    const { estado, fechaInicio, fechaFin, limit, offset } = req.query;
    
    const where = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.createdAt.lte = new Date(fechaFin);
      }
    }
    
    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    });

    const total = await prisma.venta.count({ where });

    res.json({
      success: true,
      data: { ventas },
      total
    });
  } catch (error) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar ventas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener una venta por ID
const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: { venta }
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear una nueva venta
const crearVenta = async (req, res) => {
  try {
    const {
      nombreCliente,
      apellidoCliente,
      email,
      telefono,
      direccion,
      ciudad,
      estadoDireccion,
      codigoPostal,
      pais,
      metodoPago,
      numeroTarjeta,
      nombreTarjeta,
      fechaExpiracion,
      cvv,
      subtotal,
      descuento,
      envio,
      total,
      productos,
      notas
    } = req.body;

    // Validar campos requeridos
    if (!nombreCliente || !apellidoCliente || !email || !direccion || !ciudad || !codigoPostal) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    // Generar número de orden único
    let numeroOrden = generarNumeroOrden();
    let intentos = 0;
    while (await prisma.venta.findUnique({ where: { numeroOrden } }) && intentos < 10) {
      numeroOrden = generarNumeroOrden();
      intentos++;
    }

    // Guardar solo los últimos 4 dígitos de la tarjeta si existe
    let ultimosDigitos = null;
    if (numeroTarjeta) {
      ultimosDigitos = numeroTarjeta.slice(-4);
    }

    const venta = await prisma.venta.create({
      data: {
        numeroOrden,
        nombreCliente,
        apellidoCliente,
        email,
        telefono: telefono || null,
        direccion,
        ciudad,
        estadoDireccion: estadoDireccion || estado || '',
        codigoPostal,
        pais: pais || 'México',
        metodoPago: metodoPago || 'tarjeta',
        numeroTarjeta: ultimosDigitos,
        nombreTarjeta: nombreTarjeta || null,
        fechaExpiracion: fechaExpiracion || null,
        cvv: null, // Nunca guardar CVV
        subtotal: parseFloat(subtotal),
        descuento: parseFloat(descuento) || 0,
        envio: parseFloat(envio) || 0,
        total: parseFloat(total),
        productos: JSON.stringify(productos),
        notas: notas || null,
        estado: 'pendiente'
      }
    });

    res.status(201).json({
      success: true,
      data: { venta }
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar estado de una venta
const actualizarEstadoVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
    
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const ventaActual = await prisma.venta.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ventaActual) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    const venta = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: {
        estado: estado || ventaActual.estado,
        notas: notas !== undefined ? notas : ventaActual.notas
      }
    });

    res.json({
      success: true,
      data: { venta }
    });
  } catch (error) {
    console.error('Error al actualizar estado de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar una venta
const eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    await prisma.venta.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Venta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas de ventas
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const where = {};
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.createdAt.lte = new Date(fechaFin);
      }
    }

    const totalVentas = await prisma.venta.count({ where });
    const ventasCompletadas = await prisma.venta.count({
      where: { ...where, estado: 'entregado' }
    });
    
    const ventas = await prisma.venta.findMany({ where });
    const ingresosTotales = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ingresosCompletados = ventas
      .filter(v => v.estado === 'entregado')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);

    res.json({
      success: true,
      data: {
        totalVentas,
        ventasCompletadas,
        ingresosTotales,
        ingresosCompletados
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarVentas,
  obtenerVenta,
  crearVenta,
  actualizarEstadoVenta,
  eliminarVenta,
  obtenerEstadisticas
};

