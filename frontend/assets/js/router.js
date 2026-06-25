/**
 * @file router.js
 * @description Enrutador SPA para navegacion sin recargas.
 * Carga las vistas dinamicamente segun la ruta activa.
 * Controla el acceso por rol en cada vista.
 */

const Router = {
  // Vista activa actual
  currentView: null,

  // Mapa de rutas: nombre => { view, adminOnly }
  routes: {
    'dashboard':  { view: 'dashboard',  adminOnly: false },
    'ordenes':    { view: 'ordenes',    adminOnly: false },
    'clientes':   { view: 'clientes',   adminOnly: false },
    'vehiculos':  { view: 'vehiculos',  adminOnly: false },
    'inventario': { view: 'inventario', adminOnly: false },
    'facturas':   { view: 'facturas',   adminOnly: false },
    'reportes':   { view: 'reportes',   adminOnly: true  },
    'usuarios':   { view: 'usuarios',   adminOnly: true  },
  },

  /**
   * Navega a una vista especifica.
   * @param {string} viewName - Nombre de la vista
   */
  async navigate(viewName) {
    const route = this.routes[viewName];

    if (!route) {
      this.navigate('dashboard');
      return;
    }

    // Verificar permiso de admin
    if (route.adminOnly && !Auth.isAdmin()) {
      this.navigate('dashboard');
      return;
    }

    // Actualizar estado activo en el sidebar
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.remove('active');
    });

    const activeNav = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Actualizar titulo del topbar
    const titles = {
      dashboard:  'Dashboard',
      ordenes:    'Ordenes de Trabajo',
      clientes:   'Clientes',
      vehiculos:  'Consulta de Vehiculos',
      inventario: 'Inventario',
      facturas:   'Facturas',
      reportes:   'Reportes',
      usuarios:   'Usuarios',
    };

    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) topbarTitle.textContent = titles[viewName] || '';

    // Cerrar sidebar en movil
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Cargar la vista
    this.currentView = viewName;
    const contentArea = document.getElementById('content-area');

    if (contentArea) {
      contentArea.innerHTML = `
        <div class="flex-center" style="height: 300px;">
          <div class="spinner"></div>
        </div>
      `;

      try {
        await Views[viewName]();
      } catch (error) {
        contentArea.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Error al cargar la vista: ${error.message}</p>
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('${viewName}')">
              Reintentar
            </button>
          </div>
        `;
      }
    }

    // Actualizar URL sin recargar
    history.pushState({ view: viewName }, '', `#${viewName}`);
  },

  /**
   * Inicializa el router leyendo el hash de la URL.
   */
  init() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(hash);

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.navigate(e.state.view);
      }
    });
  },
};