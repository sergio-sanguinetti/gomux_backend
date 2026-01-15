const prisma = require('../config/prisma');

// Listar todos los usuarios (solo administradores)
const listarUsuarios = async (req, res) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { usuarios },
      total: usuarios.length
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un usuario por ID
const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario sea administrador o sea el mismo usuario
    if (req.user.rol !== 'administrador' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { usuario }
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rol, activo } = req.body;

    // Verificar que el usuario sea administrador
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar usuarios'
      });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(rol !== undefined && { rol }),
        ...(activo !== undefined && { activo })
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { usuario: usuarioActualizado }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar usuario (soft delete - desactivar)
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario sea administrador
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar usuarios'
      });
    }

    // No permitir que un administrador se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: false },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true
      }
    });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      data: { usuario }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
};

