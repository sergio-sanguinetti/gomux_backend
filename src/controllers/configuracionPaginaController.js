const prisma = require('../config/prisma');

// Obtener configuración de página (solo una configuración)
const obtenerConfiguracionPagina = async (req, res) => {
  try {
    let configuracion = await prisma.configuracionPagina.findFirst();

    // Si no existe, crear una configuración por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracionPagina.create({
        data: {
          productosTop: JSON.stringify([]),
          productosRecienLlegados: JSON.stringify([]),
          productosMasVendidos: JSON.stringify([]),
          bannersSliderPrincipal: JSON.stringify([]),
          bannersSlider: JSON.stringify([]),
          topbarTexto: 'ENVÍO GRATIS SOBRE $599',
          topbarColorFondo: '#FF69B4',
          topbarColorTexto: '#000000',
          topbarVisible: true
        }
      });
    }

    // Parsear los JSON strings
    const configuracionParsed = {
      ...configuracion,
      productosTop: configuracion.productosTop ? JSON.parse(configuracion.productosTop) : [],
      productosRecienLlegados: configuracion.productosRecienLlegados ? JSON.parse(configuracion.productosRecienLlegados) : [],
      productosMasVendidos: configuracion.productosMasVendidos ? JSON.parse(configuracion.productosMasVendidos) : [],
      bannersSliderPrincipal: configuracion.bannersSliderPrincipal ? JSON.parse(configuracion.bannersSliderPrincipal) : [],
      bannersSlider: configuracion.bannersSlider ? JSON.parse(configuracion.bannersSlider) : []
    };

    res.json({
      success: true,
      data: { configuracion: configuracionParsed }
    });
  } catch (error) {
    console.error('Error al obtener configuración de página:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de página',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar configuración de página
const actualizarConfiguracionPagina = async (req, res) => {
  try {
    const {
      productosTop,
      productosRecienLlegados,
      productosMasVendidos,
      bannersSliderPrincipal,
      bannersSlider,
      topbarTexto,
      topbarColorFondo,
      topbarColorTexto,
      topbarVisible
    } = req.body;

    // Obtener configuración existente o crear una nueva
    let configuracion = await prisma.configuracionPagina.findFirst();

    const updateData = {};
    
    if (productosTop !== undefined) {
      updateData.productosTop = JSON.stringify(Array.isArray(productosTop) ? productosTop : []);
    }
    if (productosRecienLlegados !== undefined) {
      updateData.productosRecienLlegados = JSON.stringify(Array.isArray(productosRecienLlegados) ? productosRecienLlegados : []);
    }
    if (productosMasVendidos !== undefined) {
      updateData.productosMasVendidos = JSON.stringify(Array.isArray(productosMasVendidos) ? productosMasVendidos : []);
    }
    if (bannersSliderPrincipal !== undefined) {
      updateData.bannersSliderPrincipal = JSON.stringify(Array.isArray(bannersSliderPrincipal) ? bannersSliderPrincipal : []);
    }
    if (bannersSlider !== undefined) {
      updateData.bannersSlider = JSON.stringify(Array.isArray(bannersSlider) ? bannersSlider : []);
    }
    if (topbarTexto !== undefined) updateData.topbarTexto = topbarTexto;
    if (topbarColorFondo !== undefined) updateData.topbarColorFondo = topbarColorFondo;
    if (topbarColorTexto !== undefined) updateData.topbarColorTexto = topbarColorTexto;
    if (topbarVisible !== undefined) updateData.topbarVisible = topbarVisible === 'true' || topbarVisible === true;

    if (configuracion) {
      // Actualizar configuración existente
      configuracion = await prisma.configuracionPagina.update({
        where: { id: configuracion.id },
        data: updateData
      });
    } else {
      // Crear nueva configuración
      configuracion = await prisma.configuracionPagina.create({
        data: {
          productosTop: JSON.stringify(productosTop || []),
          productosRecienLlegados: JSON.stringify(productosRecienLlegados || []),
          productosMasVendidos: JSON.stringify(productosMasVendidos || []),
          bannersSliderPrincipal: JSON.stringify(bannersSliderPrincipal || []),
          bannersSlider: JSON.stringify(bannersSlider || []),
          topbarTexto: topbarTexto || 'ENVÍO GRATIS SOBRE $599',
          topbarColorFondo: topbarColorFondo || '#FF69B4',
          topbarColorTexto: topbarColorTexto || '#000000',
          topbarVisible: topbarVisible === 'true' || topbarVisible === true || topbarVisible === undefined
        }
      });
    }

    // Parsear los JSON strings para la respuesta
    const configuracionParsed = {
      ...configuracion,
      productosTop: configuracion.productosTop ? JSON.parse(configuracion.productosTop) : [],
      productosRecienLlegados: configuracion.productosRecienLlegados ? JSON.parse(configuracion.productosRecienLlegados) : [],
      productosMasVendidos: configuracion.productosMasVendidos ? JSON.parse(configuracion.productosMasVendidos) : [],
      bannersSliderPrincipal: configuracion.bannersSliderPrincipal ? JSON.parse(configuracion.bannersSliderPrincipal) : [],
      bannersSlider: configuracion.bannersSlider ? JSON.parse(configuracion.bannersSlider) : []
    };

    res.json({
      success: true,
      message: 'Configuración de página actualizada exitosamente',
      data: { configuracion: configuracionParsed }
    });
  } catch (error) {
    console.error('Error al actualizar configuración de página:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de página',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener productos destacados para la página pública (sin autenticación)
const obtenerProductosDestacados = async (req, res) => {
  try {
    const configuracion = await prisma.configuracionPagina.findFirst();

    if (!configuracion) {
      return res.json({
        success: true,
        data: {
          productosTop: [],
          productosRecienLlegados: [],
          productosMasVendidos: [],
          bannersSliderPrincipal: [],
          bannersSlider: [],
          topbarTexto: 'ENVÍO GRATIS SOBRE $599',
          topbarColorFondo: '#FF69B4',
          topbarColorTexto: '#000000',
          topbarVisible: true
        }
      });
    }

    // Parsear los JSON strings
    const productosTopIds = configuracion.productosTop ? JSON.parse(configuracion.productosTop) : [];
    const productosRecienLlegadosIds = configuracion.productosRecienLlegados ? JSON.parse(configuracion.productosRecienLlegados) : [];
    const productosMasVendidosIds = configuracion.productosMasVendidos ? JSON.parse(configuracion.productosMasVendidos) : [];
    const bannersSliderPrincipal = configuracion.bannersSliderPrincipal ? JSON.parse(configuracion.bannersSliderPrincipal) : [];
    const bannersSlider = configuracion.bannersSlider ? JSON.parse(configuracion.bannersSlider) : [];

    // Obtener productos con sus relaciones
    const [productosTop, productosRecienLlegados, productosMasVendidos] = await Promise.all([
      productosTopIds.length > 0
        ? prisma.producto.findMany({
            where: {
              id: { in: productosTopIds },
              activo: true
            },
            include: {
              categoria: {
                select: { id: true, nombre: true }
              },
              subcategoria: {
                select: { id: true, nombre: true }
              },
              tipoMaterial: {
                select: { id: true, nombre: true }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        : [],
      productosRecienLlegadosIds.length > 0
        ? prisma.producto.findMany({
            where: {
              id: { in: productosRecienLlegadosIds },
              activo: true
            },
            include: {
              categoria: {
                select: { id: true, nombre: true }
              },
              subcategoria: {
                select: { id: true, nombre: true }
              },
              tipoMaterial: {
                select: { id: true, nombre: true }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        : [],
      productosMasVendidosIds.length > 0
        ? prisma.producto.findMany({
            where: {
              id: { in: productosMasVendidosIds },
              activo: true
            },
            include: {
              categoria: {
                select: { id: true, nombre: true }
              },
              subcategoria: {
                select: { id: true, nombre: true }
              },
              tipoMaterial: {
                select: { id: true, nombre: true }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        : []
    ]);

    // Mantener el orden de los IDs
    const productosTopOrdenados = productosTopIds
      .map(id => productosTop.find(p => p.id === id))
      .filter(p => p !== undefined);

    const productosRecienLlegadosOrdenados = productosRecienLlegadosIds
      .map(id => productosRecienLlegados.find(p => p.id === id))
      .filter(p => p !== undefined);

    const productosMasVendidosOrdenados = productosMasVendidosIds
      .map(id => productosMasVendidos.find(p => p.id === id))
      .filter(p => p !== undefined);

    res.json({
      success: true,
      data: {
        productosTop: productosTopOrdenados,
        productosRecienLlegados: productosRecienLlegadosOrdenados,
        productosMasVendidos: productosMasVendidosOrdenados,
        bannersSliderPrincipal,
        bannersSlider,
        topbarTexto: configuracion.topbarTexto || 'ENVÍO GRATIS SOBRE $599',
        topbarColorFondo: configuracion.topbarColorFondo || '#FF69B4',
        topbarColorTexto: configuracion.topbarColorTexto || '#000000',
        topbarVisible: configuracion.topbarVisible !== undefined ? configuracion.topbarVisible : true
      }
    });
  } catch (error) {
    console.error('Error al obtener productos destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Subir banner del slider
const subirBannerSlider = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const bannerPath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Banner subido exitosamente',
      data: {
        path: bannerPath,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error al subir banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir banner',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerConfiguracionPagina,
  actualizarConfiguracionPagina,
  obtenerProductosDestacados,
  subirBannerSlider
};

