/**
 * router.js
 * Navegacion SPA sin recargas de pagina.
 * Controla que vista se muestra segun el item del sidebar activo.
 * Se carga al final despues de todos los archivos de vistas.
 */

const Router = {

  // Mapa de vistas disponibles
  views: {
    dashboard:  () => Views.dashboard(),
    clientes:   () => Views.clientes(),
    vehiculos:  () => Views.vehiculos(),
    inventario: () => Views.inventario(),
    ordenes:    () => Views.ordenes(),
    facturas:   () => Views.facturas(),
    reportes:   () => Views.reportes(),
    usuarios:   () => Views.usuarios(),
  },

  // Titulos del topbar por vista
  titles: {
    dashboard:  'Dashboard',
    clientes:   'Clientes',
    vehiculos:  'Vehículos',
    inventario: 'Inventario',
    ordenes:    'Órdenes de Trabajo',
    facturas:   'Facturas',
    reportes:   'Reportes',
    usuarios:   'Usuarios',
  },

  // Vista actual
  current: null,

  /**
   * Navega a una vista por nombre.
   * @param {string} viewName - Nombre de la vista
   */
  navigate(viewName) {
    const usuario = Auth.getUsuario();

    // Verificar acceso a vistas de admin
    const adminOnly = ['reportes', 'usuarios'];
    if (adminOnly.includes(viewName) && usuario.rol !== 'admin') {
      Toast.show('No tienes permisos para acceder a esta seccion.', 'error');
      return;
    }

    // Verificar que la vista existe
    if (!this.views[viewName]) {
      viewName = 'dashboard';
    }

    this.current = viewName;

    // Actualizar titulo del topbar
    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) {
      topbarTitle.textContent = this.titles[viewName] || viewName;
    }

    // Actualizar estado activo en el sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Mostrar spinner mientras carga la vista
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <div class="flex-center" style="height:300px;">
        <div class="spinner"></div>
      </div>
    `;

    // Cerrar sidebar en movil
    closeSidebar();

    // Renderizar la vista
    try {
      this.views[viewName]();
    } catch (err) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Error al cargar la vista. Intenta nuevamente.</p>
          <button class="btn btn-secondary btn-sm"
                  onclick="Router.navigate('${viewName}')">Reintentar</button>
        </div>
      `;
      console.error('[ROUTER] Error en vista:', viewName, err);
    }
  },

  /**
   * Inicializa el router.
   * Asigna eventos a los items del sidebar y carga la vista inicial.
   */
  init() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.view);
      });
    });

    // Cargar dashboard por defecto
    this.navigate('dashboard');
  },
};

// ── Utilidades globales ──────────────────────────────────────────────────────

/**
 * Sistema de notificaciones Toast.
 */
const Toast = {
  show(mensaje, tipo = 'info', duracion = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    const iconos = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent-success)">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>`,
      error:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent-danger)">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent-warning)">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent)">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8"  x2="12.01" y2="8"/>
                </svg>`,
    };

    toast.innerHTML = `${iconos[tipo] || iconos.info}<span>${mensaje}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.25s ease reverse';
      setTimeout(() => toast.remove(), 250);
    }, duracion);
  },
};

/**
 * Abre y cierra el sidebar en movil.
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// Eventos del sidebar movil
document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

// Inicializar router
Router.init();