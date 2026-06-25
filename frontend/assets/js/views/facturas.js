/**
 * @file facturas.js
 * @description Vista de gestion de facturas.
 */

Views.facturas = async () => {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Facturas</h2>
        <p class="page-subtitle">Comprobantes fiscales emitidos</p>
      </div>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>OT</th>
            <th>Cliente</th>
            <th>NCF</th>
            <th>Subtotal</th>
            <th>ITBIS</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            ${esAdmin ? '<th>Acciones</th>' : ''}
          </tr>
        </thead>
        <tbody id="tabla-facturas">
          <tr>
            <td colspan="${esAdmin ? 10 : 9}" class="text-center">
              <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal anular factura -->
    ${esAdmin ? `
      <div class="modal-overlay hidden" id="modal-anular">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Anular Factura</h3>
            <button class="modal-close" id="btn-cerrar-modal-anular">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Esta accion no se puede deshacer. La factura quedara marcada como anulada.</span>
            </div>
            <div class="form-group">
              <label class="form-label">Motivo de Anulacion</label>
              <textarea class="form-control" id="motivo-anulacion" rows="3"
                        placeholder="Describe el motivo de la anulacion..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancelar-anular">Cancelar</button>
            <button class="btn btn-danger" id="btn-confirmar-anular">Confirmar Anulacion</button>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  let facturaAnulandoId = null;

  const cargarFacturas = async () => {
    try {
      const data = await Api.getFacturas();
      renderTabla(data.facturas);
    } catch (error) {
      Toast.error('Error al cargar facturas: ' + error.message);
    }
  };

  const renderTabla = (facturas) => {
    const tbody = document.getElementById('tabla-facturas');
    const cols  = esAdmin ? 10 : 9;

    if (facturas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${cols}">
            <div class="empty-state"><p>No hay facturas emitidas.</p></div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = facturas.map(f => `
      <tr>
        <td class="font-mono">#${f.id_factura}</td>
        <td class="font-mono">${f.id_unico_ot}</td>
        <td>${f.nombre_cliente}</td>
        <td class="font-mono">${f.ncf}</td>
        <td>RD$ ${parseFloat(f.subtotal).toLocaleString('es-DO')}</td>
        <td>RD$ ${parseFloat(f.itbis).toLocaleString('es-DO')}</td>
        <td style="font-weight:700; color: var(--accent);">
          RD$ ${parseFloat(f.total).toLocaleString('es-DO')}
        </td>
        <td>
          <span class="badge badge-${f.estado}">
            ${f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
          </span>
        </td>
        <td>${new Date(f.fecha_emision).toLocaleDateString('es-DO')}</td>
        ${esAdmin ? `
          <td>
            ${f.estado === 'emitida' ? `
              <button class="btn btn-danger btn-sm"
                      onclick="anularFactura(${f.id_factura})">
                Anular
              </button>
            ` : '<span style="color: var(--text-disabled); font-size:0.8rem;">Anulada</span>'}
          </td>
        ` : ''}
      </tr>
    `).join('');
  };

  if (esAdmin) {
    const cerrarModalAnular = () => {
      document.getElementById('modal-anular').classList.add('hidden');
      document.getElementById('motivo-anulacion').value = '';
      facturaAnulandoId = null;
    };

    document.getElementById('btn-cerrar-modal-anular').addEventListener('click', cerrarModalAnular);
    document.getElementById('btn-cancelar-anular').addEventListener('click', cerrarModalAnular);

    document.getElementById('btn-confirmar-anular').addEventListener('click', async () => {
      const motivo = document.getElementById('motivo-anulacion').value.trim();
      if (!motivo) {
        Toast.error('El motivo de anulacion es obligatorio.');
        return;
      }
      try {
        await Api.anularFactura(facturaAnulandoId, { motivo_anulacion: motivo });
        Toast.success('Factura anulada exitosamente.');
        cerrarModalAnular();
        cargarFacturas();
      } catch (error) {
        Toast.error(error.message);
      }
    });

    window.anularFactura = (id) => {
      facturaAnulandoId = id;
      document.getElementById('modal-anular').classList.remove('hidden');
    };
  }

  cargarFacturas();
};