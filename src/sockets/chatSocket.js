const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const ROOM_PREFIX = 'conv_';

function getConversationRoomId(conversationId) {
  return `${ROOM_PREFIX}${conversationId}`;
}

/**
 * @param {import('socket.io').Server} io
 */
function setupChatSocket(io) {
  io.on('connection', (socket) => {
    logger.info('Socket conectado:', socket.id);

    socket.on('join_conversation', async (payload, callback) => {
      const { conversationId, email, isAdmin } = payload || {};
      const id = parseInt(conversationId, 10);
      if (!id || isNaN(id)) {
        callback?.({ success: false, message: 'conversationId inválido' });
        return;
      }

      try {
        const conversacion = await prisma.conversacionChat.findUnique({
          where: { id }
        });
        if (!conversacion) {
          callback?.({ success: false, message: 'Conversación no encontrada' });
          return;
        }

        if (isAdmin) {
          socket.join(getConversationRoomId(id));
          socket.data.conversationId = id;
          socket.data.isAdmin = true;
          callback?.({ success: true });
          return;
        }

        const emailNorm = email ? String(email).trim().toLowerCase() : '';
        if (conversacion.clienteEmail !== emailNorm) {
          callback?.({ success: false, message: 'Email no coincide con esta conversación' });
          return;
        }
        socket.join(getConversationRoomId(id));
        socket.data.conversationId = id;
        socket.data.email = emailNorm;
        socket.data.isAdmin = false;
        callback?.({ success: true });
      } catch (err) {
        logger.error('Error en join_conversation:', err);
        callback?.({ success: false, message: 'Error al unirse a la conversación' });
      }
    });

    socket.on('send_message', async (payload, callback) => {
      const { conversationId, content, remitente } = payload || {};
      const id = parseInt(conversationId, 10);
      if (!id || isNaN(id) || !content || !remitente) {
        callback?.({ success: false, message: 'Faltan conversationId, content o remitente' });
        return;
      }
      if (!['cliente', 'admin'].includes(remitente)) {
        callback?.({ success: false, message: 'remitente debe ser cliente o admin' });
        return;
      }

      try {
        const conversacion = await prisma.conversacionChat.findUnique({
          where: { id }
        });
        if (!conversacion) {
          callback?.({ success: false, message: 'Conversación no encontrada' });
          return;
        }

        if (remitente === 'cliente') {
          const emailNorm = socket.data.email;
          if (!emailNorm || conversacion.clienteEmail !== emailNorm) {
            callback?.({ success: false, message: 'No autorizado' });
            return;
          }
        }
        // Admin: asumimos que ya hizo join_conversation con isAdmin

        const mensaje = await prisma.mensajeChat.create({
          data: {
            conversacionId: id,
            remitente,
            contenido: String(content).trim()
          }
        });

        await prisma.conversacionChat.update({
          where: { id },
          data: { updatedAt: new Date() }
        });

        const roomId = getConversationRoomId(id);
        io.to(roomId).emit('new_message', {
          id: mensaje.id,
          conversacionId: id,
          remitente: mensaje.remitente,
          contenido: mensaje.contenido,
          createdAt: mensaje.createdAt
        });
        callback?.({ success: true, data: { mensaje } });
      } catch (err) {
        logger.error('Error en send_message:', err);
        callback?.({ success: false, message: 'Error al enviar mensaje' });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket desconectado:', socket.id);
    });
  });
}

module.exports = { setupChatSocket, getConversationRoomId };
