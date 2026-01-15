const prisma = require('../config/prisma');
const { generateSlug } = require('../utils/slugHelper');

// Listar todas las categorías
const listarCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { subcategorias: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { categorias },
      total: categorias.length
    });
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener una categoría por ID
const obtenerCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await prisma.categoria.findUnique({
      where: { id: parseInt(id) },
      include: {
        subcategorias: true,
        _count: {
          select: { subcategorias: true }
        }
      }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: { categoria }
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear categoría
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Generar slug automáticamente
    const slug = generateSlug(nombre);
    
    // Verificar si el slug ya existe y agregar un número si es necesario
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.categoria.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const categoria = await prisma.categoria.create({
      data: {
        nombre,
        slug: finalSlug,
        descripcion: descripcion || null,
        activo: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { categoria }
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar categoría
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const updateData = {
      ...(descripcion !== undefined && { descripcion }),
      ...(activo !== undefined && { activo })
    };

    // Regenerar slug si cambió el nombre
    if (nombre !== undefined) {
      updateData.nombre = nombre;
      const slug = generateSlug(nombre);
      
      // Verificar si el slug ya existe (excluyendo la categoría actual)
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const categoriaExistente = await prisma.categoria.findUnique({ 
          where: { slug: finalSlug } 
        });
        if (!categoriaExistente || categoriaExistente.id === parseInt(id)) {
          break;
        }
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      updateData.slug = finalSlug;
    }

    const categoria = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { categoria }
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar categoría (soft delete)
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene subcategorías activas
    const categoria = await prisma.categoria.findUnique({
      where: { id: parseInt(id) },
      include: {
        subcategorias: {
          where: { activo: true }
        }
      }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (categoria.subcategorias.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene subcategorías activas'
      });
    }

    await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};

