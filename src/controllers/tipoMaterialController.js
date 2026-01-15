const prisma = require('../config/prisma');

// Listar todos los tipos de material
const listarTiposMaterial = async (req, res) => {
  try {
    const tiposMaterial = await prisma.tipoMaterial.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { tiposMaterial },
      total: tiposMaterial.length
    });
  } catch (error) {
    console.error('Error al listar tipos de material:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un tipo de material por ID
const obtenerTipoMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoMaterial = await prisma.tipoMaterial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tipoMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de material no encontrado'
      });
    }

    res.json({
      success: true,
      data: { tipoMaterial }
    });
  } catch (error) {
    console.error('Error al obtener tipo de material:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear tipo de material
const crearTipoMaterial = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const tipoMaterial = await prisma.tipoMaterial.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        activo: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tipo de material creado exitosamente',
      data: { tipoMaterial }
    });
  } catch (error) {
    console.error('Error al crear tipo de material:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tipo de material con ese nombre'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar tipo de material
const actualizarTipoMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const tipoMaterial = await prisma.tipoMaterial.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo })
      }
    });

    res.json({
      success: true,
      message: 'Tipo de material actualizado exitosamente',
      data: { tipoMaterial }
    });
  } catch (error) {
    console.error('Error al actualizar tipo de material:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Tipo de material no encontrado'
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tipo de material con ese nombre'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar tipo de material (soft delete)
const eliminarTipoMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tipoMaterial.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Tipo de material eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar tipo de material:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Tipo de material no encontrado'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de material',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarTiposMaterial,
  obtenerTipoMaterial,
  crearTipoMaterial,
  actualizarTipoMaterial,
  eliminarTipoMaterial
};

