const express    = require('express');
const router     = express.Router();
const { verifyToken }  = require('../../middlewares/auth.middleware');
const { soloAdmin }    = require('../../middlewares/roles.middleware');
const { validar }      = require('../../middlewares/validate.middleware');
const {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  toggleActivoUsuario,
} = require('./usuarios.controller');

router.get('/', verifyToken, soloAdmin, listarUsuarios);
router.get('/:id', verifyToken, soloAdmin, obtenerUsuarioPorId);
router.post(
  '/',
  verifyToken,
  soloAdmin,
  validar([
    { campo: 'nombre',   tipo: 'string', requerido: true  },
    { campo: 'email',    tipo: 'email',  requerido: true  },
    { campo: 'password', tipo: 'string', requerido: true  },
    { campo: 'rol',      tipo: 'string', requerido: false },
  ]),
  crearUsuario
);
router.put('/:id', verifyToken, soloAdmin, actualizarUsuario);
router.patch('/:id/toggle-activo', verifyToken, soloAdmin, toggleActivoUsuario);

module.exports = router;