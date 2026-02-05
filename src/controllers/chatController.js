const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// Crear o obtener conversación (público - cliente desde gomu.mx)
const crearObtenerConversacion = async (req, res) => {
  try {
    const { clienteNombre, clienteEmail, ventaId, numeroOrden } = req.body;
    if (!clienteNombre || !clienteEmail) {
      return res.status(400).json({
        success: false,
        message: 'clienteNombre y clienteEmail son requeridos'
      });
    }
    const email = String(clienteEmail).trim().toLowerCase();

    // Si hay numeroOrden, buscar venta para obtener ventaId si no viene
    let ventaIdFinal = ventaId ? parseInt(ventaId, 10) : null;
    let numeroOrdenFinal = numeroOrden ? String(numeroOrden).trim() : null;
    if (numeroOrden && !ventaId) {
      const venta = await prisma.venta.findUnique({
        where: { numeroOrden: numeroOrden.trim() }
      });
      if (venta) {
        ventaIdFinal = venta.id;
        numeroOrdenFinal = venta.numeroOrden;
      }
    }

    // Buscar conversación existente: mismo email y (mismo numeroOrden si hay)
    const where = {
      clienteEmail: email,
      ...(numeroOrdenFinal ? { numeroOrden: numeroOrdenFinal } : { numeroOrden: null })
    };
    let conversacion = await prisma.conversacionChat.findFirst({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { mensajes: { orderBy: { createdAt: 'asc' } } }
    });

    if (conversacion) {
      return res.json({
        success: true,
        data: { conversacion }
      });
    }

    conversacion = await prisma.conversacionChat.create({
      data: {
        clienteNombre: String(clienteNombre).trim(),
        clienteEmail: email,
        ventaId: ventaIdFinal,
        numeroOrden: numeroOrdenFinal
      },
      include: { mensajes: true }
    });

    res.status(201).json({
      success: true,
      data: { conversacion }
    });
  } catch (error) {
    logger.error('Error en crearObtenerConversacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear o obtener conversación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Listar conversaciones (admin - requiere auth)
const listarConversaciones = async (req, res) => {
  try {
    const conversaciones = await prisma.conversacionChat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { mensajes: true } },
        venta: { select: { numeroOrden: true, estado: true } }
      }
    });
    res.json({
      success: true,
      data: { conversaciones }
    });
  } catch (error) {
    logger.error('Error al listar conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar conversaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener mensajes de una conversación
// Para cliente: GET /api/chat/conversations/:id/messages?email=xxx (verifica email)
// Para admin: mismo endpoint con auth (no hace falta email)
const obtenerMensajes = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const emailQuery = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const isAdmin = req.user && req.user.rol; // si pasó authMiddleware

    const conversacion = await prisma.conversacionChat.findUnique({
      where: { id },
      include: { mensajes: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    if (!isAdmin) {
      if (!emailQuery || conversacion.clienteEmail !== emailQuery) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver esta conversación'
        });
      }
    }

    res.json({
      success: true,
      data: {
        conversacion: {
          id: conversacion.id,
          clienteNombre: conversacion.clienteNombre,
          clienteEmail: conversacion.clienteEmail,
          ventaId: conversacion.ventaId,
          numeroOrden: conversacion.numeroOrden,
          createdAt: conversacion.createdAt
        },
        mensajes: conversacion.mensajes
      }
    });
  } catch (error) {
    logger.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear mensaje (usado por REST si hace falta; el flujo principal es por socket)
const crearMensaje = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { remitente, contenido } = req.body;
    if (!remitente || !contenido || !['cliente', 'admin'].includes(remitente)) {
      return res.status(400).json({
        success: false,
        message: 'remitente (cliente|admin) y contenido son requeridos'
      });
    }

    const conversacion = await prisma.conversacionChat.findUnique({ where: { id } });
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const mensaje = await prisma.mensajeChat.create({
      data: {
        conversacionId: id,
        remitente,
        contenido: String(contenido).trim()
      }
    });

    await prisma.conversacionChat.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({
      success: true,
      data: { mensaje }
    });
  } catch (error) {
    logger.error('Error al crear mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear mensaje',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  crearObtenerConversacion,
  listarConversaciones,
  obtenerMensajes,
  crearMensaje
};
