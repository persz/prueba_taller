/**
 * auth.js
 * Manejo de sesion, token JWT y control de acceso por rol.
 * Se carga antes del router para garantizar que el usuario este autenticado.
 */

const Auth = {

  /**
   * Retorna el usuario guardado en localStorage.
   */
  getUsuario() {
    try {
      return JSON.parse(localStorage.getItem('usuario')) || null;
    } catch {
      return null;
    }
  },

  /**
   * Retorna el token JWT.
   */
  getToken() {
    return localStorage.getItem('token') || null;
  },

  /**
   * Verifica si hay una sesion activa.
   */
  isLoggedIn() {
    return !!this.getToken() && !!this.getUsuario();
  },

  /**
   * Verifica si el usuario autenticado es administrador.
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
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
  },

  /**
   * Inicializa la sesion en el dashboard.
   * Redirige al login si no hay sesion activa.
   * Configura la UI segun el rol del usuario.
   */
  init() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }

    const usuario = this.getUsuario();

    // Datos del usuario en sidebar
    const avatarEl   = document.getElementById('user-avatar');
    const nameEl     = document.getElementById('user-name');
    const roleEl     = document.getElementById('user-role');
    const topbarUser = document.getElementById('topbar-user');

    if (avatarEl)   avatarEl.textContent   = usuario.nombre.charAt(0).toUpperCase();
    if (nameEl)     nameEl.textContent     = usuario.nombre;
    if (roleEl)     roleEl.textContent     = usuario.rol === 'admin' ? 'Administrador' : 'Empleado';
    if (topbarUser) topbarUser.textContent = usuario.nombre;

    // Ocultar elementos exclusivos de admin si el usuario es empleado
    if (!this.isAdmin()) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
      });
    }

    // Boton de logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }
  },
};

// Inicializar al cargar
Auth.init();