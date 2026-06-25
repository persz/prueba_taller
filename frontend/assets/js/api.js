/**
 * @file api.js
 * @description Wrapper centralizado para todas las llamadas al backend.
 * Maneja el token JWT automaticamente en cada request.
 * Si el servidor responde 401, cierra la sesion automaticamente.
 */

const API_URL = 'http://localhost:3000/api/v1';

const Api = {
  /**
   * Metodo base para todas las peticiones HTTP.
   * @param {string} endpoint - Ruta relativa (ej: '/clientes')
   * @param {object} options  - Opciones del fetch
   */
  async request(endpoint, options = {}) {
    const token = Auth.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Si el token expiro, cerrar sesion automaticamente
    if (response.status === 401) {
      Auth.logout();
      return;
    }

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error en la solicitud.');
    }

    return data;
  },

  // ── Metodos HTTP ──────────────────────────────────────────────────────────

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body:   JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body:   JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body:   JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ── Endpoints del sistema ─────────────────────────────────────────────────

  // Auth
  login: (body)    => Api.post('/auth/login', body),
  perfil: ()       => Api.get('/auth/perfil'),

  // Usuarios
  getUsuarios: ()       => Api.get('/usuarios'),
  getUsuario:  (id)     => Api.get(`/usuarios/${id}`),
  crearUsuario: (body)  => Api.post('/usuarios', body),
  editarUsuario: (id, body) => Api.put(`/usuarios/${id}`, body),
  toggleUsuario: (id)   => Api.patch(`/usuarios/${id}/toggle-activo`),

  // Clientes
  getClientes: ()          => Api.get('/clientes'),
  getCliente:  (id)        => Api.get(`/clientes/${id}`),
  buscarClientes: (termino) => Api.get(`/clientes/buscar?termino=${termino}`),
  crearCliente: (body)     => Api.post('/clientes', body),
  editarCliente: (id, body) => Api.put(`/clientes/${id}`, body),
  eliminarCliente: (id)    => Api.delete(`/clientes/${id}`),

  // Vehiculos
  decodificarVIN: (vin) => Api.get(`/vehiculos/vin/${vin}`),

  // Inventario
  getPiezas: ()           => Api.get('/inventario'),
  getPieza:  (id)         => Api.get(`/inventario/${id}`),
  getBajoStock: ()        => Api.get('/inventario/bajo-stock'),
  buscarPiezas: (termino) => Api.get(`/inventario/buscar?termino=${termino}`),
  crearPieza: (body)      => Api.post('/inventario', body),
  editarPieza: (id, body) => Api.put(`/inventario/${id}`, body),
  eliminarPieza: (id)     => Api.delete(`/inventario/${id}`),

  // Ordenes
  getOrdenes: ()              => Api.get('/ordenes'),
  getOrden:   (id)            => Api.get(`/ordenes/${id}`),
  crearOrden: (body)          => Api.post('/ordenes', body),
  agregarPieza: (body)        => Api.post('/ordenes/agregar-pieza', body),
  actualizarEstado: (id, body) => Api.patch(`/ordenes/${id}/estado`, body),
  eliminarOrden: (id)         => Api.delete(`/ordenes/${id}`),

  // Facturas
  getFacturas: ()          => Api.get('/facturas'),
  getFactura:  (id)        => Api.get(`/facturas/${id}`),
  generarFactura: (body)   => Api.post('/facturas/generar', body),
  anularFactura: (id, body) => Api.patch(`/facturas/${id}/anular`, body),

  // Reportes
  getDashboard: ()         => Api.get('/reportes/dashboard'),
  getIngresos:  (d, h)     => Api.get(`/reportes/ingresos?desde=${d}&hasta=${h}`),
  getPiezasUsadas: ()      => Api.get('/reportes/piezas-mas-usadas'),
  getPorMecanico: ()       => Api.get('/reportes/por-mecanico'),
};