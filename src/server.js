const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar rutas
const proveedorRoutes = require('./routes/proveedorRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const subcategoriaRoutes = require('./routes/subcategoriaRoutes');
const tipoMaterialRoutes = require('./routes/tipoMaterialRoutes');
const productoRoutes = require('./routes/productoRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const configuracionPaginaRoutes = require('./routes/configuracionPaginaRoutes');
const etiquetaRoutes = require('./routes/etiquetaRoutes');
const ventaPorMayorRoutes = require('./routes/ventaPorMayorRoutes');
const ventaRoutes = require('./routes/ventaRoutes');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Importar Prisma Client
const prisma = require('./config/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Verificar conexión a la base de datos al iniciar
prisma.$connect()
  .then(() => {
    logger.info('✅ Conectado a la base de datos MySQL');
  })
  .catch((error) => {
    logger.error('❌ Error al conectar a la base de datos:', error);
  });

// Middleware de seguridad
// Configurar Helmet para permitir archivos estáticos
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Desactivar CSP para archivos estáticos
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// Middleware de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.GOMUX_URL || 'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos los orígenes en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware para parsear JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para servir archivos estáticos (DEBE estar ANTES de las rutas de la API)
// __dirname apunta a backend/src, entonces ../uploads apunta a backend/uploads
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  logger.info('📁 Directorio uploads creado:', uploadsPath);
}
const filesInUploads = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
logger.info('📁 Ruta de uploads configurada:', uploadsPath);
logger.info('📁 Archivos en uploads:', filesInUploads.length);
if (filesInUploads.length > 0) {
  logger.info('📁 Primeros archivos:', filesInUploads.slice(0, 3));
}

// Ruta específica para servir archivos de uploads
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsPath, filename);
  
  logger.info(`🔍 Solicitud de archivo: ${filename}`);
  logger.info(`📁 Ruta completa: ${filePath}`);
  logger.info(`📁 ¿Existe?: ${fs.existsSync(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    logger.error(`❌ Archivo no encontrado: ${filePath}`);
    return res.status(404).json({
      success: false,
      message: 'Archivo no encontrado',
      path: req.originalUrl,
      searchedPath: filePath
    });
  }
  
  // Enviar el archivo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.sendFile(filePath);
});

// También mantener el middleware estático como respaldo
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  },
  dotfiles: 'ignore',
  etag: true,
  index: false
}));

// Middleware para logging de todas las peticiones a /api/ventas
app.use('/api/ventas', (req, res, next) => {
  logger.info(`📥 Petición recibida: ${req.method} ${req.originalUrl}`);
  logger.info(`📋 Headers:`, req.headers);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/subcategorias', subcategoriaRoutes);
app.use('/api/tipo-material', tipoMaterialRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/configuracion-pagina', configuracionPaginaRoutes);
app.use('/api/etiquetas', etiquetaRoutes);
app.use('/api/ventas-por-mayor', ventaPorMayorRoutes);
app.use('/api/ventas', ventaRoutes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Konfío - Sistema de Gestión de Proveedores',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      proveedores: '/api/proveedores'
    }
  });
});

// Middleware para manejar rutas no encontradas
// NOTA: Este middleware solo se ejecuta si ningún middleware anterior respondió
app.use((req, res) => {
  // Si llegamos aquí, ninguna ruta coincidió
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
  logger.info(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 URL: http://localhost:${PORT}`);
  logger.info(`📋 Documentación: http://localhost:${PORT}/api-docs`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  logger.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Promesa rechazada no manejada:', err);
  process.exit(1);
});

module.exports = app;

