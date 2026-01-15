const prisma = require('../config/prisma');
const { generateSlug, generateProductSlug } = require('../utils/slugHelper');

async function generateSlugsForExistingData() {
  try {
    console.log('Generando slugs para categorías existentes...');
    
    // Generar slugs para categorías
    const categorias = await prisma.categoria.findMany({
      where: { slug: null }
    });
    
    for (const categoria of categorias) {
      const slug = generateSlug(categoria.nombre);
      let finalSlug = slug;
      let counter = 1;
      
      while (await prisma.categoria.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      await prisma.categoria.update({
        where: { id: categoria.id },
        data: { slug: finalSlug }
      });
      
      console.log(`✓ Categoría "${categoria.nombre}" -> slug: "${finalSlug}"`);
    }
    
    console.log('\nGenerando slugs para productos existentes...');
    
    // Generar slugs para productos
    const productos = await prisma.producto.findMany({
      where: { slug: null },
      include: {
        categoria: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    for (const producto of productos) {
      const slug = generateProductSlug(producto.categoria.nombre, producto.nombre);
      let finalSlug = slug;
      let counter = 1;
      
      while (await prisma.producto.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      await prisma.producto.update({
        where: { id: producto.id },
        data: { slug: finalSlug }
      });
      
      console.log(`✓ Producto "${producto.nombre}" -> slug: "${finalSlug}"`);
    }
    
    console.log('\n✓ Slugs generados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al generar slugs:', error);
    process.exit(1);
  }
}

generateSlugsForExistingData();

