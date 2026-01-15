const prisma = require('../config/prisma');
const { generateProductSlug, generateSlug } = require('../utils/slugHelper');

// Listar todos los productos
const listarProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        tipoMaterial: {
          select: {
            id: true,
            nombre: true
          }
        },
        etiquetas: {
          include: {
            etiqueta: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { productos },
      total: productos.length
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un producto por ID
const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            slug: true
          }
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        tipoMaterial: {
          select: {
            id: true,
            nombre: true
          }
        },
        etiquetas: {
          include: {
            etiqueta: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: { producto }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un producto por slug
const obtenerProductoPorSlug = async (req, res) => {
  try {
    // El slug viene de req.params.slug (ya decodificado por la ruta)
    const slug = req.params.slug;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug no proporcionado'
      });
    }
    
    console.log('Buscando producto con slug:', slug);
    
    // Buscar el producto por slug exacto
    const producto = await prisma.producto.findUnique({
      where: { slug: slug },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            slug: true
          }
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        tipoMaterial: {
          select: {
            id: true,
            nombre: true
          }
        },
        etiquetas: {
          include: {
            etiqueta: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: { producto }
    });
  } catch (error) {
    console.error('Error al obtener producto por slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear producto
const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      descripcionDetallada,
      categoriaId,
      subcategoriaId,
      tipoMaterialId,
      etiquetasIds,
      tamano,
      color,
      costoProduccion,
      costoVenta,
      stock,
      esNuevo,
      esDestacado
    } = req.body;

    if (!nombre || !categoriaId || !subcategoriaId || !tipoMaterialId || !costoProduccion || !costoVenta) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Verificar que las relaciones existan
    const [categoria, subcategoria, tipoMaterial] = await Promise.all([
      prisma.categoria.findUnique({ where: { id: parseInt(categoriaId) } }),
      prisma.subcategoria.findUnique({ where: { id: parseInt(subcategoriaId) } }),
      prisma.tipoMaterial.findUnique({ where: { id: parseInt(tipoMaterialId) } })
    ]);

    if (!categoria || !subcategoria || !tipoMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Categoría, subcategoría o tipo de material no encontrado'
      });
    }

    // Manejar imagen principal
    let imagenPrincipalPath = null;
    if (req.files && req.files.imagenPrincipal && req.files.imagenPrincipal.length > 0) {
      imagenPrincipalPath = `/uploads/${req.files.imagenPrincipal[0].filename}`;
    }

    // Manejar galería de imágenes
    let galeriaImagenes = null;
    if (req.files && req.files.galeriaImagenes && req.files.galeriaImagenes.length > 0) {
      const galeriaPaths = req.files.galeriaImagenes.map(file => `/uploads/${file.filename}`);
      galeriaImagenes = JSON.stringify(galeriaPaths);
    }

    // Parsear etiquetasIds si viene como string JSON
    let etiquetasArray = [];
    if (etiquetasIds) {
      try {
        etiquetasArray = typeof etiquetasIds === 'string' ? JSON.parse(etiquetasIds) : etiquetasIds;
        if (!Array.isArray(etiquetasArray)) {
          etiquetasArray = [];
        }
      } catch (e) {
        etiquetasArray = [];
      }
    }

    // Generar slug automáticamente
    const slug = generateProductSlug(categoria.nombre, nombre);
    
    // Verificar si el slug ya existe y agregar un número si es necesario
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.producto.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        slug: finalSlug,
        descripcion: descripcion || null,
        descripcionDetallada: descripcionDetallada || null,
        categoriaId: parseInt(categoriaId),
        subcategoriaId: parseInt(subcategoriaId),
        tipoMaterialId: parseInt(tipoMaterialId),
        tamano: tamano || null,
        color: color || null,
        costoProduccion: parseFloat(costoProduccion),
        costoVenta: parseFloat(costoVenta),
        stock: parseInt(stock) || 0,
        esNuevo: esNuevo === 'true' || esNuevo === true,
        esDestacado: esDestacado === 'true' || esDestacado === true,
        imagenPrincipal: imagenPrincipalPath,
        galeriaImagenes: galeriaImagenes,
        activo: true,
        etiquetas: {
          create: etiquetasArray.map(etiquetaId => ({
            etiquetaId: parseInt(etiquetaId)
          }))
        }
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        tipoMaterial: {
          select: {
            id: true,
            nombre: true
          }
        },
        etiquetas: {
          include: {
            etiqueta: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { producto }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      descripcionDetallada,
      categoriaId,
      subcategoriaId,
      tipoMaterialId,
      etiquetasIds,
      tamano,
      color,
      costoProduccion,
      costoVenta,
      stock,
      esNuevo,
      esDestacado,
      activo
    } = req.body;

    // Obtener el producto actual para mantener las imágenes si no se suben nuevas
    const productoActual = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!productoActual) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener categoría actualizada si cambió
    let categoriaActualizada = null;
    if (categoriaId !== undefined) {
      categoriaActualizada = await prisma.categoria.findUnique({ 
        where: { id: parseInt(categoriaId) } 
      });
      if (!categoriaActualizada) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    } else {
      categoriaActualizada = await prisma.categoria.findUnique({ 
        where: { id: productoActual.categoriaId } 
      });
    }

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (descripcionDetallada !== undefined) updateData.descripcionDetallada = descripcionDetallada;
    if (categoriaId !== undefined) updateData.categoriaId = parseInt(categoriaId);
    if (subcategoriaId !== undefined) updateData.subcategoriaId = parseInt(subcategoriaId);
    if (tipoMaterialId !== undefined) updateData.tipoMaterialId = parseInt(tipoMaterialId);
    if (tamano !== undefined) updateData.tamano = tamano;
    if (color !== undefined) updateData.color = color;
    if (costoProduccion !== undefined) updateData.costoProduccion = parseFloat(costoProduccion);
    if (costoVenta !== undefined) updateData.costoVenta = parseFloat(costoVenta);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (esNuevo !== undefined) updateData.esNuevo = esNuevo === 'true' || esNuevo === true;
    if (esDestacado !== undefined) updateData.esDestacado = esDestacado === 'true' || esDestacado === true;
    if (activo !== undefined) updateData.activo = activo === 'true' || activo === true;

    // Regenerar slug si cambió el nombre o la categoría
    if (nombre !== undefined || categoriaId !== undefined) {
      const nombreProducto = nombre || productoActual.nombre;
      const slug = generateProductSlug(categoriaActualizada.nombre, nombreProducto);
      
      // Verificar si el slug ya existe (excluyendo el producto actual)
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const productoExistente = await prisma.producto.findUnique({ 
          where: { slug: finalSlug } 
        });
        if (!productoExistente || productoExistente.id === parseInt(id)) {
          break;
        }
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      updateData.slug = finalSlug;
    }

    // Manejar imagen principal si se subió una nueva
    if (req.files && req.files.imagenPrincipal && req.files.imagenPrincipal.length > 0) {
      updateData.imagenPrincipal = `/uploads/${req.files.imagenPrincipal[0].filename}`;
    } else {
      // Mantener la imagen existente si no se sube una nueva
      updateData.imagenPrincipal = productoActual.imagenPrincipal;
    }

    // Manejar galería de imágenes si se subieron nuevas
    if (req.files && req.files.galeriaImagenes && req.files.galeriaImagenes.length > 0) {
      const galeriaPaths = req.files.galeriaImagenes.map(file => `/uploads/${file.filename}`);
      updateData.galeriaImagenes = JSON.stringify(galeriaPaths);
    } else {
      // Mantener la galería existente si no se suben nuevas imágenes
      updateData.galeriaImagenes = productoActual.galeriaImagenes;
    }

    // Manejar etiquetas si se proporcionan
    if (etiquetasIds !== undefined) {
      // Parsear etiquetasIds si viene como string JSON
      let etiquetasArray = [];
      try {
        etiquetasArray = typeof etiquetasIds === 'string' ? JSON.parse(etiquetasIds) : etiquetasIds;
        if (!Array.isArray(etiquetasArray)) {
          etiquetasArray = [];
        }
      } catch (e) {
        etiquetasArray = [];
      }

      // Eliminar todas las etiquetas existentes
      await prisma.productoEtiqueta.deleteMany({
        where: { productoId: parseInt(id) }
      });

      // Crear las nuevas relaciones de etiquetas
      if (etiquetasArray.length > 0) {
        await prisma.productoEtiqueta.createMany({
          data: etiquetasArray.map(etiquetaId => ({
            productoId: parseInt(id),
            etiquetaId: parseInt(etiquetaId)
          }))
        });
      }
    }

    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        tipoMaterial: {
          select: {
            id: true,
            nombre: true
          }
        },
        etiquetas: {
          include: {
            etiqueta: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { producto }
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar producto (soft delete)
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarProductos,
  obtenerProducto,
  obtenerProductoPorSlug,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};

