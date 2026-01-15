const prisma = require('../config/prisma');

// Listar todas las subcategorías
const listarSubcategorias = async (req, res) => {
  try {
    const subcategorias = await prisma.subcategoria.findMany({
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { subcategorias },
      total: subcategorias.length
    });
  } catch (error) {
    console.error('Error al listar subcategorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategorías',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener una subcategoría por ID
const obtenerSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategoria = await prisma.subcategoria.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true
      }
    });

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: { subcategoria }
    });
  } catch (error) {
    console.error('Error al obtener subcategoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear subcategoría
const crearSubcategoria = async (req, res) => {
  try {
    const { nombre, descripcion, categoriaId } = req.body;

    if (!nombre || !categoriaId) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la categoría son requeridos'
      });
    }

    // Verificar que la categoría existe y está activa
    const categoria = await prisma.categoria.findUnique({
      where: { id: parseInt(categoriaId) }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (!categoria.activo) {
      return res.status(400).json({
        success: false,
        message: 'No se puede crear una subcategoría en una categoría inactiva'
      });
    }

    const subcategoria = await prisma.subcategoria.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        categoriaId: parseInt(categoriaId),
        activo: true
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subcategoría creada exitosamente',
      data: { subcategoria }
    });
  } catch (error) {
    console.error('Error al crear subcategoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear subcategoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar subcategoría
const actualizarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoriaId, activo } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (categoriaId !== undefined) {
      // Verificar que la categoría existe
      const categoria = await prisma.categoria.findUnique({
        where: { id: parseInt(categoriaId) }
      });
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      updateData.categoriaId = parseInt(categoriaId);
    }
    if (activo !== undefined) updateData.activo = activo;

    const subcategoria = await prisma.subcategoria.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Subcategoría actualizada exitosamente',
      data: { subcategoria }
    });
  } catch (error) {
    console.error('Error al actualizar subcategoría:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subcategoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar subcategoría (soft delete)
const eliminarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subcategoria.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Subcategoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar subcategoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarSubcategorias,
  obtenerSubcategoria,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria
};

