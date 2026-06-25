/**
 * @file dashboard.js
 * @description Vista del dashboard principal.
 * Muestra estadisticas generales del negocio.
 * Admin ve todo, empleado ve un resumen limitado.
 */


Views.dashboard = async () => {
  const contentArea = document.getElementById('content-area');
  const usuario     = Auth.getUsuario();
  const esAdmin     = Auth.isAdmin();

  // Vista de empleado
  if (!esAdmin) {
    contentArea.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Bienvenido, ${usuario.nombre}</h2>
          <p class="page-subtitle">Panel de acceso rapido</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" onclick="Router.navigate('ordenes')" style="cursor:pointer">
          <div class="stat-icon stat-icon-accent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">OT</div>
            <div class="stat-label">Ordenes de Trabajo</div>
          </div>
        </div>

        <div class="stat-card" onclick="Router.navigate('clientes')" style="cursor:pointer">
          <div class="stat-icon stat-icon-success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">CL</div>
            <div class="stat-label">Clientes</div>
          </div>
        </div>

        <div class="stat-card" onclick="Router.navigate('inventario')" style="cursor:pointer">
          <div class="stat-icon stat-icon-warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">INV</div>
            <div class="stat-label">Inventario</div>
          </div>
        </div>

        <div class="stat-card" onclick="Router.navigate('facturas')" style="cursor:pointer">
          <div class="stat-icon stat-icon-danger">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">FAC</div>
            <div class="stat-label">Facturas</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Vista de admin — cargar estadisticas reales
  try {
    const data = await Api.getDashboard();
    const db   = data.dashboard;

    // Calcular totales de OT
    const totalOT       = db.ordenes_por_estado.reduce((acc, o) => acc + parseInt(o.total, 10), 0);
    const otCompletadas = db.ordenes_por_estado.find(o => o.estado === 'Completada');
    const otPendientes  = db.ordenes_por_estado.find(o => o.estado === 'Pendiente');
    const otEnProceso   = db.ordenes_por_estado.find(o => o.estado === 'En Proceso');

    // Calcular total clientes
    const totalClientes = db.clientes_por_tipo.reduce((acc, c) => acc + parseInt(c.total, 10), 0);

    contentArea.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Dashboard</h2>
          <p class="page-subtitle">Resumen general del negocio</p>
        </div>
      </div>

      <!-- Estadisticas principales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-accent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${totalOT}</div>
            <div class="stat-label">Total Ordenes de Trabajo</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${totalClientes}</div>
            <div class="stat-label">Total Clientes</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${db.piezas_stock_critico}</div>
            <div class="stat-label">Piezas con Stock Critico</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-danger">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">RD$ ${parseFloat(db.facturacion_mes.total_facturado).toLocaleString('es-DO')}</div>
            <div class="stat-label">Facturado este Mes</div>
          </div>
        </div>
      </div>

      <!-- Estado de OT y Facturacion -->
      <div class="grid-2" style="gap: var(--spacing-lg)">

        <!-- Estado de OT -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ordenes por Estado</h3>
          </div>
          <div class="card-body">
            ${db.ordenes_por_estado.length === 0
              ? '<div class="empty-state"><p>No hay ordenes registradas.</p></div>'
              : db.ordenes_por_estado.map(o => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid var(--border);">
                    <span class="badge badge-${o.estado.toLowerCase().replace(' ', '')}">${o.estado}</span>
                    <span style="font-weight:700; color: var(--text-primary);">${o.total}</span>
                  </div>
                `).join('')
            }
          </div>
        </div>

        <!-- Facturacion del mes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Facturacion del Mes</h3>
          </div>
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">Total Facturas</span>
              <span style="font-weight:700; color: var(--text-primary);">${db.facturacion_mes.total_facturas}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">Subtotal</span>
              <span style="font-weight:700; color: var(--text-primary);">RD$ ${parseFloat(db.facturacion_mes.total_subtotal).toLocaleString('es-DO')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">ITBIS (18%)</span>
              <span style="font-weight:700; color: var(--accent-warning);">RD$ ${parseFloat(db.facturacion_mes.total_itbis).toLocaleString('es-DO')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding: 10px 0;">
              <span style="color: var(--text-secondary); font-weight:700;">Total Facturado</span>
              <span style="font-weight:700; color: var(--accent);">RD$ ${parseFloat(db.facturacion_mes.total_facturado).toLocaleString('es-DO')}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Alerta stock critico -->
      ${db.piezas_stock_critico > 0 ? `
        <div class="alert alert-warning mt-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Hay <strong>${db.piezas_stock_critico}</strong> pieza(s) con stock por debajo del minimo.
          <a href="#" onclick="Router.navigate('inventario')">Ver inventario</a></span>
        </div>
      ` : ''}
    `;

  } catch (error) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <p>Error al cargar el dashboard: ${error.message}</p>
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('dashboard')">
          Reintentar
        </button>
      </div>
    `;
  }
};