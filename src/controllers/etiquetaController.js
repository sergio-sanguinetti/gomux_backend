const prisma = require('../config/prisma');

// Listar todas las etiquetas
const listarEtiquetas = async (req, res) => {
  try {
    const etiquetas = await prisma.etiqueta.findMany({
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { etiquetas },
      total: etiquetas.length
    });
  } catch (error) {
    console.error('Error al listar etiquetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener etiquetas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener una etiqueta por ID
const obtenerEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const etiqueta = await prisma.etiqueta.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { productos: true }
        }
      }
    });

    if (!etiqueta) {
      return res.status(404).json({
        success: false,
        message: 'Etiqueta no encontrada'
      });
    }

    res.json({
      success: true,
      data: { etiqueta }
    });
  } catch (error) {
    console.error('Error al obtener etiqueta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener etiqueta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear etiqueta
const crearEtiqueta = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const etiqueta = await prisma.etiqueta.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        activo: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Etiqueta creada exitosamente',
      data: { etiqueta }
    });
  } catch (error) {
    console.error('Error al crear etiqueta:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una etiqueta con ese nombre'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear etiqueta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar etiqueta
const actualizarEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const etiqueta = await prisma.etiqueta.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo })
      }
    });

    res.json({
      success: true,
      message: 'Etiqueta actualizada exitosamente',
      data: { etiqueta }
    });
  } catch (error) {
    console.error('Error al actualizar etiqueta:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Etiqueta no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar etiqueta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar etiqueta (soft delete)
const eliminarEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.etiqueta.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Etiqueta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Etiqueta no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar etiqueta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarEtiquetas,
  obtenerEtiqueta,
  crearEtiqueta,
  actualizarEtiqueta,
  eliminarEtiqueta
};

