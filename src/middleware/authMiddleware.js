const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // El formato debe ser "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido'
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_key_default'
    );

    // Agregar información del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al verificar token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Opcional: si hay token válido, pone req.user; si no, continúa sin él
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_key_default'
    );
    req.user = decoded;
    next();
  } catch {
    next();
  }
};

module.exports = {
  verificarToken,
  optionalAuth
};

