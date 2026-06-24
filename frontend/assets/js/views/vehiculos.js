/**
 * views/vehiculos.js
 * Vista de consulta de vehiculos por VIN usando la API NHTSA.
 */

Views.vehiculos = function () {
  const contentArea = document.getElementById('content-area');

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Consulta de Vehículos</h2>
        <p class="page-subtitle">Busca un vehículo por su VIN o número de chasis</p>
      </div>
    </div>

    <div class="card" style="max-width:600px; margin-bottom:var(--spacing-xl);">
      <div class="card-header">
        <span class="card-title">Decodificar VIN</span>
      </div>
      <div style="display:flex; gap:var(--spacing-md);">
        <input
          type="text"
          class="form-control"
          id="input-vin"
          placeholder="Ingresa el VIN (17 caracteres)"
          maxlength="17"
          style="text-transform:uppercase; font-family:var(--font-mono);"
        />
        <button class="btn btn-primary" id="btn-buscar-vin" style="white-space:nowrap;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Buscar
        </button>
      </div>
      <p class="form-hint" style="margin-top:var(--spacing-sm);">
        El VIN tiene exactamente 17 caracteres alfanumericos. Se encuentra en el parabrisas
        o en la puerta del conductor.
      </p>
    </div>

    <!-- Resultado -->
    <div id="resultado-vin"></div>

    <!-- Historial de OT por VIN -->
    <div id="historial-vin"></div>
  `;

  const inputVin   = document.getElementById('input-vin');
  const btnBuscar  = document.getElementById('btn-buscar-vin');
  const resultadoEl = document.getElementById('resultado-vin');
  const historialEl = document.getElementById('historial-vin');

  // Forzar mayusculas en el input
  inputVin.addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });

  async function buscarVIN() {
    const vin = inputVin.value.trim().toUpperCase();

    if (vin.length !== 17) {
      resultadoEl.innerHTML = `
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>El VIN debe tener exactamente 17 caracteres.</span>
        </div>
      `;
      return;
    }

    btnBuscar.disabled = true;
    btnBuscar.textContent = 'Buscando...';
    resultadoEl.innerHTML = `
      <div class="flex-center" style="height:120px;">
        <div class="spinner"></div>
      </div>
    `;
    historialEl.innerHTML = '';

    try {
      const res = await api.get(`/vehiculos/vin/${vin}`);

      if (!res.ok) {
        resultadoEl.innerHTML = `
          <div class="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>${res.data.mensaje || 'No se pudo obtener informacion del vehiculo.'}</span>
          </div>
        `;
        return;
      }

      const v = res.data.vehiculo;

      resultadoEl.innerHTML = `
        <div class="card" style="max-width:600px; margin-bottom:var(--spacing-xl);">
          <div class="card-header">
            <span class="card-title">Datos del Vehiculo</span>
            <span class="badge badge-completada">Encontrado</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(2,1fr);
                      gap:var(--spacing-md);">
            <div>
              <div class="form-label">VIN</div>
              <div class="font-mono" style="color:var(--accent); font-size:0.85rem;">
                ${v.vin}
              </div>
            </div>
            <div>
              <div class="form-label">Tipo</div>
              <div style="color:var(--text-primary);">${v.tipo}</div>
            </div>
            <div>
              <div class="form-label">Marca</div>
              <div style="color:var(--text-primary); font-weight:600;">${v.marca}</div>
            </div>
            <div>
              <div class="form-label">Modelo</div>
              <div style="color:var(--text-primary);">${v.modelo}</div>
            </div>
            <div>
              <div class="form-label">Año</div>
              <div style="color:var(--text-primary);">${v.anio}</div>
            </div>
          </div>
          <div style="margin-top:var(--spacing-lg); display:flex; gap:var(--spacing-md);">
            <button class="btn btn-primary btn-sm" onclick="usarVINEnOT('${v.vin}','${v.marca}','${v.modelo}','${v.anio}')">
              Crear OT con este Vehiculo
            </button>
          </div>
        </div>
      `;

      // Buscar historial de OT con este VIN
      cargarHistorialVIN(vin);

    } catch (err) {
      resultadoEl.innerHTML = `
        <div class="alert alert-danger">
          <span>Error de conexion. Verifica que el servidor este activo.</span>
        </div>
      `;
    } finally {
      btnBuscar.disabled    = false;
      btnBuscar.innerHTML   = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Buscar
      `;
    }
  }

  async function cargarHistorialVIN(vin) {
    const res = await api.get('/ordenes');
    if (!res.ok) return;

    const ordenes = res.data.ordenes.filter(o => o.vin === vin);

    if (ordenes.length === 0) {
      historialEl.innerHTML = `
        <div class="card" style="max-width:600px;">
          <div class="card-header">
            <span class="card-title">Historial de Ordenes</span>
          </div>
          <p style="color:var(--text-disabled); text-align:center;
                    padding:var(--spacing-lg); margin:0;">
            No hay ordenes de trabajo registradas para este vehiculo.
          </p>
        </div>
      `;
      return;
    }

    historialEl.innerHTML = `
      <div class="card" style="max-width:600px;">
        <div class="card-header">
          <span class="card-title">Historial de Ordenes (${ordenes.length})</span>
        </div>
        <div class="table-container" style="border:none;">
          <table class="table">
            <thead>
              <tr>
                <th>OT</th>
                <th>Estado</th>
                <th>Descripcion</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${ordenes.map(o => `
                <tr>
                  <td class="font-mono" style="font-size:0.8rem; color:var(--accent);">
                    ${o.id_unico_ot}
                  </td>
                  <td>
                    <span class="badge badge-${o.estado.toLowerCase().replace(' ','-')}">
                      ${o.estado}
                    </span>
                  </td>
                  <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;">
                    ${o.descripcion_trabajo || '—'}
                  </td>
                  <td style="font-size:0.8rem;">
                    ${new Date(o.fecha_ingreso).toLocaleDateString('es-DO')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Usar VIN encontrado para crear OT
  window.usarVINEnOT = (vin, marca, modelo, anio) => {
    Router.navigate('ordenes');
    setTimeout(() => {
      if (typeof abrirModalOrden === 'function') {
        abrirModalOrden(null, null, { vin, marca, modelo, anio });
      }
    }, 300);
  };

  // Eventos
  btnBuscar.addEventListener('click', buscarVIN);
  inputVin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarVIN();
  });
};