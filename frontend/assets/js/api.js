/**
 * api.js
 * Wrapper centralizado para todas las llamadas al backend.
 * Maneja el token JWT automaticamente en cada request.
 */

const API_BASE = 'http://localhost:3000/api/v1';

const api = {

  /**
   * Realiza un request al backend.
   * @param {string} endpoint - Ruta relativa, ej: '/clientes'
   * @param {object} options  - Opciones fetch: method, body, etc.
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Si el token expiro, redirigir al login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = 'index.html';
      return;
    }

    return { ok: response.ok, status: response.status, data };
  },

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
};