const express = require('express');
const router = express.Router();
const { cotizarEnvio } = require('../controllers/envioController');

router.post('/cotizar', cotizarEnvio);

module.exports = router;
