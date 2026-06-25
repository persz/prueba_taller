/**
 * @file reportes.js
 * @description Vista de reportes y estadisticas.
 * Solo accesible por administradores.
 */

Views.reportes = async () => {
  const contentArea = document.getElementById('content-area');

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Reportes</h2>
        <p class="page-subtitle">Estadisticas y analisis del negocio</p>
      </div>
    </div>

    <!-- Reporte de ingresos -->
    <div class="card" style="margin-bottom: var(--spacing-lg);">
      <div class="card-header">
        <h3 class="card-title">Reporte de Ingresos por Periodo</h3>
      </div>
      <div class="card-body">
        <div class="form-row form-row-2" style="max-width: 500px; margin-bottom: var(--spacing-md);">
          <div class="form-group">
            <label class="form-label">Desde</label>
            <input type="date" class="form-control" id="fecha-desde">
          </div>
          <div class="form-group">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-control" id="fecha-hasta">
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-buscar-ingresos">
          Generar Reporte
        </button>
        <div id="resultado-ingresos" class="hidden" style="margin-top: var(--spacing-lg);">
        </div>
      </div>
    </div>

    <!-- Piezas mas usadas -->
    <div class="grid-2" style="gap: var(--spacing-lg);">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Piezas Mas Utilizadas</h3>
        </div>
        <div class="card-body" id="tabla-piezas-usadas">
          <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Rendimiento por Mecanico</h3>
        </div>
        <div class="card-body" id="tabla-mecanicos">
          <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
        </div>
      </div>
    </div>
  `;

  // Fechas por defecto (mes actual)
  const hoy     = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  document.getElementById('fecha-desde').value = primero.toISOString().split('T')[0];
  document.getElementById('fecha-hasta').value  = hoy.toISOString().split('T')[0];

  // Cargar piezas mas usadas
  const cargarPiezasUsadas = async () => {
    try {
      const data   = await Api.getPiezasUsadas();
      const container = document.getElementById('tabla-piezas-usadas');

      if (data.piezas.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Sin datos disponibles.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Pieza</th>
                <th>Unidades</th>
                <th>Total RD$</th>
              </tr>
            </thead>
            <tbody>
              ${data.piezas.map(p => `
                <tr>
                  <td>${p.nombre}</td>
                  <td style="font-weight:700; color: var(--accent);">${p.total_unidades_usadas}</td>
                  <td>RD$ ${parseFloat(p.total_facturado).toLocaleString('es-DO')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      document.getElementById('tabla-piezas-usadas').innerHTML =
        '<p style="color: var(--accent-danger);">Error al cargar datos.</p>';
    }
  };

  // Cargar rendimiento por mecanico
  const cargarMecanicos = async () => {
    try {
      const data      = await Api.getPorMecanico();
      const container = document.getElementById('tabla-mecanicos');

      if (data.mecanicos.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Sin datos disponibles.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Mecanico</th>
                <th>Total OT</th>
                <th>Completadas</th>
                <th>Pendientes</th>
              </tr>
            </thead>
            <tbody>
              ${data.mecanicos.map(m => `
                <tr>
                  <td>${m.mecanico_asignado}</td>
                  <td style="font-weight:700; color: var(--text-primary);">${m.total_ot}</td>
                  <td style="color: var(--accent-success);">${m.completadas}</td>
                  <td style="color: var(--accent-warning);">${m.pendientes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      document.getElementById('tabla-mecanicos').innerHTML =
        '<p style="color: var(--accent-danger);">Error al cargar datos.</p>';
    }
  };

  // Generar reporte de ingresos
  document.getElementById('btn-buscar-ingresos').addEventListener('click', async () => {
    const desde     = document.getElementById('fecha-desde').value;
    const hasta     = document.getElementById('fecha-hasta').value;
    const resultado = document.getElementById('resultado-ingresos');

    if (!desde || !hasta) {
      Toast.error('Selecciona un rango de fechas.');
      return;
    }

    resultado.classList.remove('hidden');
    resultado.innerHTML = '<div class="spinner" style="margin: auto;"></div>';

    try {
      const data    = await Api.getIngresos(desde, hasta);
      const reporte = data.reporte;
      const totales = reporte.totales;

      resultado.innerHTML = `
        <div class="stats-grid" style="margin-bottom: var(--spacing-md);">
          <div class="stat-card">
            <div class="stat-icon stat-icon-accent">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${totales.total_facturas}</div>
              <div class="stat-label">Facturas Emitidas</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-success">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">RD$ ${parseFloat(totales.total_subtotal).toLocaleString('es-DO')}</div>
              <div class="stat-label">Subtotal</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">RD$ ${parseFloat(totales.total_itbis).toLocaleString('es-DO')}</div>
              <div class="stat-label">ITBIS (18%)</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-danger">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">RD$ ${parseFloat(totales.total_facturado).toLocaleString('es-DO')}</div>
              <div class="stat-label">Total Facturado</div>
            </div>
          </div>
        </div>

        ${reporte.detalle_por_dia.length > 0 ? `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Facturas</th>
                  <th>Subtotal</th>
                  <th>ITBIS</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${reporte.detalle_por_dia.map(d => `
                  <tr>
                    <td>${new Date(d.fecha).toLocaleDateString('es-DO')}</td>
                    <td>${d.total_facturas}</td>
                    <td>RD$ ${parseFloat(d.subtotal).toLocaleString('es-DO')}</td>
                    <td>RD$ ${parseFloat(d.itbis).toLocaleString('es-DO')}</td>
                    <td style="font-weight:700; color: var(--accent);">
                      RD$ ${parseFloat(d.total).toLocaleString('es-DO')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p style="color: var(--text-disabled);">No hay facturas en este periodo.</p>'}
      `;
    } catch (error) {
      resultado.innerHTML = `
        <div class="alert alert-danger">
          <span>Error al generar el reporte: ${error.message}</span>
        </div>
      `;
    }
  });

  cargarPiezasUsadas();
  cargarMecanicos();
};