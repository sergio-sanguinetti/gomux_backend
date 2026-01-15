const express = require('express');
const router = express.Router();
const { listarUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;

