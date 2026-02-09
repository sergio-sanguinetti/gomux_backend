const prisma = require('../config/prisma');

const listarDescuentos = async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    const where = {};
    if (estado === 'activo') {
      where.activo = true;
      where.fechaInicio = { lte: new Date() };
      where.fechaFin = { gte: new Date() };
    } else if (estado === 'finalizado') {
      where.OR = [{ activo: false }, { fechaFin: { lt: new Date() } }];
    }
    if (tipo) where.tipo = tipo;

    const descuentos = await prisma.descuento.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        producto: { select: { id: true, nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { descuentos }, total: descuentos.length });
  } catch (error) {
    console.error('Error al listar descuentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar descuentos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const obtenerDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const descuento = await prisma.descuento.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: { select: { id: true, nombre: true } },
        producto: { select: { id: true, nombre: true } }
      }
    });
    if (!descuento) {
      return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
    }
    res.json({ success: true, data: { descuento } });
  } catch (error) {
    console.error('Error al obtener descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener descuento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const crearDescuento = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      codigo,
      tipo,
      categoriaId,
      productoId,
      porcentaje,
      temporada,
      fechaInicio,
      fechaFin,
      activo
    } = req.body;

    if (!nombre || tipo === undefined || !porcentaje || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, tipo, porcentaje, fechaInicio, fechaFin'
      });
    }

    const tiposValidos = ['global', 'categoria', 'producto'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'tipo debe ser: global, categoria o producto'
      });
    }

    const data = {
      nombre,
      descripcion: descripcion || null,
      codigo: codigo || null,
      tipo,
      porcentaje: parseFloat(porcentaje),
      temporada: temporada || null,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      activo: activo !== false
    };
    if (tipo === 'categoria' && categoriaId) data.categoriaId = parseInt(categoriaId);
    else data.categoriaId = null;
    if (tipo === 'producto' && productoId) data.productoId = parseInt(productoId);
    else data.productoId = null;

    const descuento = await prisma.descuento.create({ data });
    res.status(201).json({ success: true, data: { descuento } });
  } catch (error) {
    console.error('Error al crear descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear descuento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const actualizarDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      codigo,
      tipo,
      categoriaId,
      productoId,
      porcentaje,
      temporada,
      fechaInicio,
      fechaFin,
      activo
    } = req.body;

    const actual = await prisma.descuento.findUnique({ where: { id: parseInt(id) } });
    if (!actual) {
      return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
    }

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (codigo !== undefined) data.codigo = codigo;
    if (tipo !== undefined) {
      const tiposValidos = ['global', 'categoria', 'producto'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'tipo inválido' });
      }
      data.tipo = tipo;
      if (tipo === 'categoria') {
        data.categoriaId = categoriaId ? parseInt(categoriaId) : null;
        data.productoId = null;
      } else if (tipo === 'producto') {
        data.productoId = productoId ? parseInt(productoId) : null;
        data.categoriaId = null;
      } else {
        data.categoriaId = null;
        data.productoId = null;
      }
    }
    if (porcentaje !== undefined) data.porcentaje = parseFloat(porcentaje);
    if (temporada !== undefined) data.temporada = temporada;
    if (fechaInicio !== undefined) data.fechaInicio = new Date(fechaInicio);
    if (fechaFin !== undefined) data.fechaFin = new Date(fechaFin);
    if (activo !== undefined) data.activo = !!activo;

    const descuento = await prisma.descuento.update({
      where: { id: parseInt(id) },
      data
    });
    res.json({ success: true, data: { descuento } });
  } catch (error) {
    console.error('Error al actualizar descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar descuento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const eliminarDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const descuento = await prisma.descuento.findUnique({ where: { id: parseInt(id) } });
    if (!descuento) {
      return res.status(404).json({ success: false, message: 'Descuento no encontrado' });
    }
    await prisma.descuento.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Descuento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar descuento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Público: descuentos activos aplicables (para gomu.mx)
// Sin params: devuelve todos los descuentos activos (global + por categoría + por producto) para aplicar en listados.
// Con ?productoId=1 y/o ?categoriaId=1: devuelve solo los aplicables a ese producto/categoría.
const descuentosActivos = async (req, res) => {
  try {
    const ahora = new Date();
    const productoId = req.query.productoId ? parseInt(req.query.productoId, 10) : null;
    const categoriaId = req.query.categoriaId ? parseInt(req.query.categoriaId, 10) : null;

    const where = {
      activo: true,
      fechaInicio: { lte: ahora },
      fechaFin: { gte: ahora }
    };

    if (productoId != null && !isNaN(productoId)) {
      where.OR = [
        { tipo: 'global' },
        { tipo: 'categoria', categoriaId: categoriaId != null && !isNaN(categoriaId) ? categoriaId : undefined },
        { tipo: 'producto', productoId }
      ];
    } else if (categoriaId != null && !isNaN(categoriaId)) {
      where.OR = [{ tipo: 'global' }, { tipo: 'categoria', categoriaId }];
    }
    // Sin params: no añadir OR, devolver todos los descuentos activos

    const descuentos = await prisma.descuento.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        categoriaId: true,
        productoId: true,
        porcentaje: true,
        codigo: true,
        fechaInicio: true,
        fechaFin: true
      }
    });

    res.json({ success: true, data: { descuentos } });
  } catch (error) {
    console.error('Error al obtener descuentos activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener descuentos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarDescuentos,
  obtenerDescuento,
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento,
  descuentosActivos
};
