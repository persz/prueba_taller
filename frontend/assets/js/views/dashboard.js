/**
 * views/dashboard.js
 * Vista del panel principal con estadisticas generales.
 */

const Views = window.Views || {};

Views.dashboard = async function () {
  const contentArea = document.getElementById('content-area');
  const usuario     = Auth.getUsuario();
  const esAdmin     = usuario.rol === 'admin';

  // Estructura base
  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Bienvenido, ${usuario.nombre}</h2>
        <p class="page-subtitle">Resumen general del sistema</p>
      </div>
    </div>

    <!-- Stats rapidas -->
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-accent">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" id="stat-ot-total">--</div>
          <div class="stat-label">Ordenes de Trabajo</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" id="stat-ot-pendientes">--</div>
          <div class="stat-label">OT Pendientes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" id="stat-ot-completadas">--</div>
          <div class="stat-label">OT Completadas</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-danger">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" id="stat-stock-critico">--</div>
          <div class="stat-label">Piezas Stock Critico</div>
        </div>
      </div>
    </div>

    <!-- Seccion admin -->
    ${esAdmin ? `
    <div class="grid-2" style="margin-bottom: var(--spacing-xl);">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Facturacion del Mes</span>
        </div>
        <div id="facturacion-mes">
          <div class="flex-center" style="height:80px;">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">OT por Estado</span>
        </div>
        <div id="ot-por-estado">
          <div class="flex-center" style="height:80px;">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Accesos rapidos -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Accesos Rapidos</span>
      </div>
      <div style="display:flex; gap:var(--spacing-md); flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="Router.navigate('ordenes')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva OT
        </button>
        <button class="btn btn-secondary" onclick="Router.navigate('clientes')">
          Nueva OT
          Ver Clientes
        </button>
        <button class="btn btn-secondary" onclick="Router.navigate('inventario')">
          Ver Inventario
        </button>
        ${esAdmin ? `
        <button class="btn btn-secondary" onclick="Router.navigate('reportes')">
          Ver Reportes
        </button>
        ` : ''}
      </div>
    </div>
  `;

  // Cargar datos
  try {
    if (esAdmin) {
      const res = await api.get('/reportes/dashboard');
      if (res.ok) {
        const d = res.data.dashboard;

        // Stats de OT
        let total       = 0;
        let pendientes  = 0;
        let completadas = 0;

        d.ordenes_por_estado.forEach(item => {
          total += parseInt(item.total);
          if (item.estado === 'Pendiente')  pendientes  = parseInt(item.total);
          if (item.estado === 'Completada') completadas = parseInt(item.total);
        });

        document.getElementById('stat-ot-total').textContent      = total;
        document.getElementById('stat-ot-pendientes').textContent  = pendientes;
        document.getElementById('stat-ot-completadas').textContent = completadas;
        document.getElementById('stat-stock-critico').textContent  = d.piezas_stock_critico;

        // Facturacion del mes
        const fm = d.facturacion_mes;
        document.getElementById('facturacion-mes').innerHTML = `
          <div style="display:flex; flex-direction:column; gap:var(--spacing-md);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-secondary); font-size:0.875rem;">Facturas emitidas</span>
              <span style="font-weight:600; color:var(--text-primary);">${fm.total_facturas}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-secondary); font-size:0.875rem;">Subtotal</span>
              <span style="font-weight:600; color:var(--text-primary);">RD$ ${parseFloat(fm.total_subtotal).toLocaleString('es-DO', {minimumFractionDigits:2})}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-secondary); font-size:0.875rem;">ITBIS (18%)</span>
              <span style="font-weight:600; color:var(--text-primary);">RD$ ${parseFloat(fm.total_itbis).toLocaleString('es-DO', {minimumFractionDigits:2})}</span>
            </div>
            <hr class="divider" style="margin:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--accent); font-size:0.95rem; font-weight:600;">Total Facturado</span>
              <span style="font-weight:700; color:var(--accent); font-size:1.1rem;">RD$ ${parseFloat(fm.total_facturado).toLocaleString('es-DO', {minimumFractionDigits:2})}</span>
            </div>
          </div>
        `;

        // OT por estado
        const estadoColors = {
          'Pendiente':  'var(--accent-warning)',
          'En Proceso': 'var(--accent)',
          'Completada': 'var(--accent-success)',
          'Cancelada':  'var(--accent-danger)',
        };

        document.getElementById('ot-por-estado').innerHTML = d.ordenes_por_estado.length === 0
          ? `<p style="color:var(--text-disabled); text-align:center; padding:var(--spacing-lg);">Sin ordenes registradas</p>`
          : d.ordenes_por_estado.map(item => `
              <div style="display:flex; justify-content:space-between; align-items:center;
                          padding: var(--spacing-sm) 0; border-bottom:1px solid var(--border);">
                <div style="display:flex; align-items:center; gap:var(--spacing-sm);">
                  <div style="width:8px; height:8px; border-radius:50%;
                              background:${estadoColors[item.estado] || 'var(--text-disabled)'};"></div>
                  <span style="color:var(--text-secondary); font-size:0.875rem;">${item.estado}</span>
                </div>
                <span style="font-weight:600; color:var(--text-primary);">${item.total}</span>
              </div>
            `).join('');
      }
    } else {
      // Para empleados solo cargamos las ordenes
      const res = await api.get('/ordenes');
      if (res.ok) {
        const ordenes = res.data.ordenes;
        const pendientes  = ordenes.filter(o => o.estado === 'Pendiente').length;
        const completadas = ordenes.filter(o => o.estado === 'Completada').length;

        document.getElementById('stat-ot-total').textContent      = ordenes.length;
        document.getElementById('stat-ot-pendientes').textContent  = pendientes;
        document.getElementById('stat-ot-completadas').textContent = completadas;
      }

      const resStock = await api.get('/inventario/bajo-stock');
      if (resStock.ok) {
        document.getElementById('stat-stock-critico').textContent = resStock.data.total;
      }
    }
  } catch (err) {
    console.error('[DASHBOARD] Error cargando datos:', err);
  }
};