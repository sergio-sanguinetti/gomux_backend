const prisma = require('../config/prisma');

// Obtener configuración (solo hay una configuración)
const obtenerConfiguracion = async (req, res) => {
  try {
    let configuracion = await prisma.configuracion.findFirst();

    // Si no existe, crear una configuración por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracion.create({
        data: {
          nombreTienda: 'Tienda de Llaveros',
          emailContacto: 'contacto@tiendallaveros.com',
          telefono: '+52 55 1234 5678',
          direccion: 'Calle Principal 123, Ciudad, País',
          alertasStockBajo: true,
          stockMinimo: 10,
          actualizacionAutomaticaInventario: true,
          notificacionesEmail: true,
          notificacionesNuevasOrdenes: true,
          notificacionesProductosAgotados: false,
          reportesSemanales: true
        }
      });
    }

    res.json({
      success: true,
      data: { configuracion }
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar configuración
const actualizarConfiguracion = async (req, res) => {
  try {
    const {
      nombreTienda,
      emailContacto,
      telefono,
      direccion,
      alertasStockBajo,
      stockMinimo,
      actualizacionAutomaticaInventario,
      notificacionesEmail,
      notificacionesNuevasOrdenes,
      notificacionesProductosAgotados,
      reportesSemanales
    } = req.body;

    // Buscar configuración existente
    let configuracion = await prisma.configuracion.findFirst();

    if (!configuracion) {
      // Si no existe, crear una nueva
      configuracion = await prisma.configuracion.create({
        data: {
          nombreTienda: nombreTienda || 'Tienda de Llaveros',
          emailContacto: emailContacto || null,
          telefono: telefono || null,
          direccion: direccion || null,
          alertasStockBajo: alertasStockBajo !== undefined ? alertasStockBajo : true,
          stockMinimo: stockMinimo !== undefined ? parseInt(stockMinimo) : 10,
          actualizacionAutomaticaInventario: actualizacionAutomaticaInventario !== undefined ? actualizacionAutomaticaInventario : true,
          notificacionesEmail: notificacionesEmail !== undefined ? notificacionesEmail : true,
          notificacionesNuevasOrdenes: notificacionesNuevasOrdenes !== undefined ? notificacionesNuevasOrdenes : true,
          notificacionesProductosAgotados: notificacionesProductosAgotados !== undefined ? notificacionesProductosAgotados : false,
          reportesSemanales: reportesSemanales !== undefined ? reportesSemanales : true
        }
      });
    } else {
      // Actualizar la existente
      const updateData = {};
      if (nombreTienda !== undefined) updateData.nombreTienda = nombreTienda;
      if (emailContacto !== undefined) updateData.emailContacto = emailContacto;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (direccion !== undefined) updateData.direccion = direccion;
      if (alertasStockBajo !== undefined) updateData.alertasStockBajo = alertasStockBajo;
      if (stockMinimo !== undefined) updateData.stockMinimo = parseInt(stockMinimo);
      if (actualizacionAutomaticaInventario !== undefined) updateData.actualizacionAutomaticaInventario = actualizacionAutomaticaInventario;
      if (notificacionesEmail !== undefined) updateData.notificacionesEmail = notificacionesEmail;
      if (notificacionesNuevasOrdenes !== undefined) updateData.notificacionesNuevasOrdenes = notificacionesNuevasOrdenes;
      if (notificacionesProductosAgotados !== undefined) updateData.notificacionesProductosAgotados = notificacionesProductosAgotados;
      if (reportesSemanales !== undefined) updateData.reportesSemanales = reportesSemanales;

      configuracion = await prisma.configuracion.update({
        where: { id: configuracion.id },
        data: updateData
      });
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: { configuracion }
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion
};

