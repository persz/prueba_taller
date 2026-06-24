const express  = require('express');
const router   = express.Router();
const { verifyToken }    = require('../../middlewares/auth.middleware');
const { adminOEmpleado } = require('../../middlewares/roles.middleware');
const { decodificarVIN } = require('./vehiculos.controller');

router.get('/vin/:vin', verifyToken, adminOEmpleado, decodificarVIN);

module.exports = router;