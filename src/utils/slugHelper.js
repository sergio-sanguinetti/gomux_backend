/**
 * Genera un slug (URL amigable) a partir de un texto
 * @param {string} text - Texto a convertir en slug
 * @returns {string} - Slug generado
 */
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales
    .replace(/á/gi, 'a')
    .replace(/é/gi, 'e')
    .replace(/í/gi, 'i')
    .replace(/ó/gi, 'o')
    .replace(/ú/gi, 'u')
    .replace(/ñ/gi, 'n')
    .replace(/ü/gi, 'u')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    // Eliminar múltiples guiones consecutivos
    .replace(/\-\-+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Genera un slug completo para un producto: categoria-slug/nombre-producto-slug
 * @param {string} categoriaNombre - Nombre de la categoría
 * @param {string} productoNombre - Nombre del producto
 * @returns {string} - Slug completo
 */
function generateProductSlug(categoriaNombre, productoNombre) {
  const categoriaSlug = generateSlug(categoriaNombre);
  const productoSlug = generateSlug(productoNombre);
  return `${categoriaSlug}/${productoSlug}`;
}

module.exports = {
  generateSlug,
  generateProductSlug
};

