const logger = require('../utils/logger');

/**
 * Middleware global de errores. Nunca debe lanzar; si la respuesta ya se envió, no hace nada.
 */
function errorHandler(err, req, res, next) {
  // No enviar respuesta si ya se envió (evita "Cannot set headers after they are sent")
  if (res.headersSent) {
    logger.warn('Error después de enviar respuesta:', err.message);
    return next(err);
  }

  try {
    logger.error('Error en petición:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method
    });
  } catch (logErr) {
    console.error('Error al loguear:', logErr);
  }

  const dev = process.env.NODE_ENV === 'development';

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors || err.message
    });
  }

  // Error de Multer (subida de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. El tamaño máximo permitido es 20MB por archivo.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. El máximo permitido es 11 archivos (1 imagen principal + 10 de galería).'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Error al subir archivo: ' + (err.message || 'Error desconocido')
    });
  }

  // Error de Prisma (conexión, consulta, etc.)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    const status = err.code === 'P2025' ? 404 : 500; // P2025 = registro no encontrado
    return res.status(status).json({
      success: false,
      message: status === 404 ? 'Recurso no encontrado' : 'Error en la base de datos',
      error: dev ? err.message : undefined
    });
  }

  // Cualquier otro error
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';
  return res.status(status).json({
    success: false,
    message,
    error: dev ? err.stack : undefined
  });
}

module.exports = errorHandler;

