const express = require('express');
const router = express.Router();
const {
  listarFavoritos,
  agregarFavorito,
  quitarFavorito
} = require('../controllers/favoritoController');
const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken);

router.get('/', listarFavoritos);
router.post('/', agregarFavorito);
router.delete('/:productoId', quitarFavorito);

module.exports = router;
