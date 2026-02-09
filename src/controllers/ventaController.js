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

// Estadísticas para el dashboard (ventas mes actual, productos activos, ingresos, clientes únicos)
const obtenerDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const ventasDelMes = await prisma.venta.count({
      where: {
        createdAt: { gte: inicioMes, lte: finMes }
      }
    });

    const ventasDelMesList = await prisma.venta.findMany({
      where: {
        createdAt: { gte: inicioMes, lte: finMes }
      },
      select: { total: true }
    });
    const ingresosDelMes = ventasDelMesList.reduce((sum, v) => sum + parseFloat(v.total), 0);

    const productosActivos = await prisma.producto.count({
      where: { activo: true }
    });

    const todasVentas = await prisma.venta.findMany({
      select: { email: true, total: true }
    });
    const clientesUnicos = new Set(todasVentas.map(v => v.email)).size;
    const ingresosTotalesReal = todasVentas.reduce((sum, v) => sum + parseFloat(v.total), 0);

    res.json({
      success: true,
      data: {
        ventasDelMes,
        ingresosDelMes,
        productosActivos,
        clientesUnicos,
        ingresosTotales: ingresosTotalesReal
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ventas agrupadas por estado (para gráfica de estado)
const obtenerVentasPorEstado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const where = {};
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) where.createdAt.lte = new Date(fechaFin);
    }

    const ventas = await prisma.venta.findMany({ where, select: { estado: true } });
    const estados = ['entregado', 'pendiente', 'procesando', 'enviado', 'cancelado'];
    const porEstado = {};
    estados.forEach(e => { porEstado[e] = 0; });
    ventas.forEach(v => {
      if (porEstado[v.estado] !== undefined) porEstado[v.estado]++;
    });

    const total = ventas.length;
    const datos = [
      { estado: 'Completadas', clave: 'entregado', cantidad: porEstado.entregado, porcentaje: total ? Math.round((porEstado.entregado / total) * 1000) / 10 : 0 },
      { estado: 'Pendientes', clave: 'pendiente', cantidad: porEstado.pendiente, porcentaje: total ? Math.round((porEstado.pendiente / total) * 1000) / 10 : 0 },
      { estado: 'En proceso', clave: 'procesando', cantidad: porEstado.procesando + porEstado.enviado, porcentaje: total ? Math.round(((porEstado.procesando + porEstado.enviado) / total) * 1000) / 10 : 0 },
      { estado: 'Canceladas', clave: 'cancelado', cantidad: porEstado.cancelado, porcentaje: total ? Math.round((porEstado.cancelado / total) * 1000) / 10 : 0 }
    ];

    res.json({ success: true, data: { datos, total } });
  } catch (error) {
    console.error('Error al obtener ventas por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por estado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ventas por mes (últimos 12 meses) para gráfica
const obtenerVentasPorMes = async (req, res) => {
  try {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const categorias = [];
    const datosOrdenes = [];
    const datosIngresos = [];

    for (let i = 11; i >= 0; i--) {
      const año = now.getFullYear();
      const mes = now.getMonth() - i;
      let y = año;
      let m = mes;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      const inicio = new Date(y, m, 1);
      const fin = new Date(y, m + 1, 0, 23, 59, 59);
      categorias.push(meses[m]);

      const ventas = await prisma.venta.findMany({
        where: { createdAt: { gte: inicio, lte: fin } },
        select: { id: true, total: true }
      });
      datosOrdenes.push(ventas.length);
      datosIngresos.push(ventas.reduce((sum, v) => sum + parseFloat(v.total), 0));
    }

    res.json({
      success: true,
      data: {
        categorias,
        ordenes: datosOrdenes,
        ingresos: datosIngresos
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas por mes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por mes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mis pedidos del cliente (por email del usuario autenticado)
const obtenerMisPedidos = async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }
    const ventas = await prisma.venta.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: { ventas }
    });
  } catch (error) {
    console.error('Error al obtener mis pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
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
  obtenerEstadisticas,
  obtenerDashboardStats,
  obtenerVentasPorEstado,
  obtenerVentasPorMes,
  obtenerMisPedidos
};

