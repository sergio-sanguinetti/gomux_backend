const express = require('express');
const router = express.Router();
const {
  crearObtenerConversacion,
  listarConversaciones,
  obtenerMensajes,
  crearMensaje
} = require('../controllers/chatController');
const { verificarToken, optionalAuth } = require('../middleware/authMiddleware');

// Público: crear o obtener conversación (cliente desde gomu.mx)
router.post('/conversations', crearObtenerConversacion);

// Admin: listar todas las conversaciones
router.get('/conversations', verificarToken, listarConversaciones);

// Obtener mensajes: admin con auth, o cliente con ?email= (optionalAuth para no romper si no hay token)
router.get('/conversations/:id/messages', optionalAuth, obtenerMensajes);

// Crear mensaje por REST (admin; el flujo principal es por socket)
router.post('/conversations/:id/messages', verificarToken, crearMensaje);

module.exports = router;
