const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registrar, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

// Validaciones para registro
const validacionesRegistro = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rol')
    .optional()
    .isIn(['administrador', 'vendedor'])
    .withMessage('Rol no válido. Solo se permiten: administrador o vendedor')
];

// Validaciones para login
const validacionesLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Rutas
router.post('/registro', validacionesRegistro, registrar);
router.post('/login', validacionesLogin, login);
router.get('/perfil', verificarToken, perfil);

module.exports = router;

