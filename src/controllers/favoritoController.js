const prisma = require('../config/prisma');

// Listar favoritos del usuario autenticado
const listarFavoritos = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId },
      include: {
        producto: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: { favoritos }
    });
  } catch (error) {
    console.error('Error al listar favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar favoritos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Añadir favorito
const agregarFavorito = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const { productoId } = req.body;
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }
    if (!productoId) {
      return res.status(400).json({
        success: false,
        message: 'productoId es requerido'
      });
    }
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) }
    });
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    const favorito = await prisma.favorito.upsert({
      where: {
        usuarioId_productoId: { usuarioId, productoId: parseInt(productoId) }
      },
      create: {
        usuarioId,
        productoId: parseInt(productoId)
      },
      update: {},
      include: { producto: true }
    });
    res.status(201).json({
      success: true,
      message: 'Añadido a favoritos',
      data: { favorito }
    });
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar favorito',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Quitar favorito
const quitarFavorito = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const { productoId } = req.params;
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }
    await prisma.favorito.deleteMany({
      where: {
        usuarioId,
        productoId: parseInt(productoId)
      }
    });
    res.json({
      success: true,
      message: 'Eliminado de favoritos'
    });
  } catch (error) {
    console.error('Error al quitar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar favorito',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarFavoritos,
  agregarFavorito,
  quitarFavorito
};
