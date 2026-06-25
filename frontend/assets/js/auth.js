/**
 * @file auth.js
 * @description Manejo de autenticacion JWT en el frontend.
 * Guarda y recupera el token de localStorage.
 * Protege las paginas que requieren sesion activa.
 */

const Auth = {
  /**
   * Retorna el token JWT almacenado.
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Retorna los datos del usuario autenticado.
   */
  getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  /**
   * Verifica si hay una sesion activa.
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Verifica si el usuario es administrador.
   */
  isAdmin() {
    const usuario = this.getUsuario();
    return usuario && usuario.rol === 'admin';
  },

  /**
   * Cierra la sesion eliminando los datos del localStorage
   * y redirige al login.
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
  },

  /**
   * Protege una pagina verificando que haya sesion activa.
   * Si no hay sesion, redirige al login.
   * Llamar al inicio de cada pagina protegida.
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /**
   * Protege una pagina verificando que el usuario sea admin.
   * Si no es admin, redirige al dashboard.
   */
  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },
};