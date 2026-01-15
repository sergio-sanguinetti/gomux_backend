const express = require('express');
const router = express.Router();

// Ruta temporal para proveedores (puedes implementarla después)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de proveedores - Por implementar'
  });
});

module.exports = router;

