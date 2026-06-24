/**
 * views/inventario.js
 * Vista de gestion de inventario de piezas.
 */

Views.inventario = async function () {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Inventario</h2>
        <p class="page-subtitle">Gestion de piezas y repuestos</p>
      </div>
      ${esAdmin ? `
      <button class="btn btn-primary" id="btn-nueva-pieza">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva Pieza
      </button>
      ` : ''}
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" class="form-control" id="input-buscar-pieza"
               placeholder="Buscar por nombre, SKU o categoria..." />
      </div>
      <div style="display:flex; gap:var(--spacing-md);">
        <button class="btn btn-secondary btn-sm" id="btn-ver-critico">
          Ver Stock Critico
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-ver-todos">
          Ver Todos
        </button>
      </div>
    </div>

    <!-- Alerta stock critico -->
    <div id="alerta-stock"></div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoria</th>
            <th>Stock</th>
            <th>Minimo</th>
            <th>Precio Costo</th>
            <th>Precio Venta</th>
            ${esAdmin ? '<th>Acciones</th>' : ''}
          </tr>
        </thead>
        <tbody id="tabla-inventario">
          <tr>
            <td colspan="${esAdmin ? 8 : 7}" style="text-align:center;
                padding:var(--spacing-xl);">
              <div class="spinner" style="margin:0 auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  let todasLasPiezas = [];

  function stockBadge(actual, minimo) {
    if (actual === 0) {
      return `<span class="badge badge-cancelada">Sin Stock</span>`;
    }
    if (actual <= minimo) {
      return `<span class="badge badge-pendiente">${actual} — Critico</span>`;
    }
    return `<span class="badge badge-completada">${actual}</span>`;
  }

  function renderTabla(piezas) {
    const tbody = document.getElementById('tabla-inventario');
    if (!tbody) return;

    if (piezas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${esAdmin ? 8 : 7}"
              style="text-align:center; color:var(--text-disabled);
                     padding:var(--spacing-xl);">
            No se encontraron piezas.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = piezas.map(p => `
      <tr>
        <td class="font-mono" style="font-size:0.8rem; color:var(--accent);">
          ${p.codigo_sku}
        </td>
        <td style="color:var(--text-primary); font-weight:500;">${p.nombre}</td>
        <td>
          <span class="badge badge-proceso">${p.categoria_tipo}</span>
        </td>
        <td>${stockBadge(p.stock_actual, p.stock_minimo)}</td>
        <td style="color:var(--text-secondary);">${p.stock_minimo}</td>
        <td style="color:var(--text-secondary);">
          RD$ ${parseFloat(p.precio_costo).toLocaleString('es-DO', {minimumFractionDigits:2})}
        </td>
        <td style="color:var(--text-primary); font-weight:600;">
          RD$ ${parseFloat(p.precio_venta).toLocaleString('es-DO', {minimumFractionDigits:2})}
        </td>
        ${esAdmin ? `
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm"
                    onclick="editarPieza(${p.id_pieza})">
              Editar
            </button>
            <button class="btn btn-danger btn-sm"
                    onclick="eliminarPieza(${p.id_pieza}, '${p.nombre.replace(/'/g, "\\'")}')">
              Eliminar
            </button>
          </div>
        </td>
        ` : ''}
      </tr>
    `).join('');
  }

  async function cargarInventario() {
    const res = await api.get('/inventario');
    if (res.ok) {
      todasLasPiezas = res.data.piezas;
      renderTabla(todasLasPiezas);

      // Alerta stock critico
      const criticas = todasLasPiezas.filter(p => p.stock_actual <= p.stock_minimo);
      if (criticas.length > 0) {
        document.getElementById('alerta-stock').innerHTML = `
          <div class="alert alert-warning" style="margin-bottom:var(--spacing-lg);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0
                       1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              <strong>${criticas.length} pieza(s)</strong> con stock en nivel critico
              o agotado. Considera realizar un pedido de reabastecimiento.
            </span>
          </div>
        `;
      }
    } else {
      Toast.show('Error al cargar inventario.', 'error');
    }
  }

  await cargarInventario();

  // Busqueda
  document.getElementById('input-buscar-pieza').addEventListener('input', async function () {
    const termino = this.value.trim();
    if (termino.length === 0) {
      renderTabla(todasLasPiezas);
      return;
    }
    if (termino.length < 2) return;
    const res = await api.get(`/inventario/buscar?termino=${encodeURIComponent(termino)}`);
    if (res.ok) renderTabla(res.data.piezas);
  });

  // Filtros
  document.getElementById('btn-ver-critico').addEventListener('click', () => {
    const criticas = todasLasPiezas.filter(p => p.stock_actual <= p.stock_minimo);
    renderTabla(criticas);
  });

  document.getElementById('btn-ver-todos').addEventListener('click', () => {
    renderTabla(todasLasPiezas);
  });

  if (esAdmin) {
    document.getElementById('btn-nueva-pieza').addEventListener('click', () => {
      abrirModalPieza(null, cargarInventario);
    });
  }

  window.editarPieza = async (id) => {
    const res = await api.get(`/inventario/${id}`);
    if (res.ok) abrirModalPieza(res.data.pieza, cargarInventario);
    else Toast.show('Error al cargar datos de la pieza.', 'error');
  };

  window.eliminarPieza = async (id, nombre) => {
    if (!confirm(`Eliminar la pieza "${nombre}"? Esta accion no se puede deshacer.`)) return;
    const res = await api.delete(`/inventario/${id}`);
    if (res.ok) {
      Toast.show('Pieza eliminada exitosamente.', 'success');
      cargarInventario();
    } else {
      Toast.show(res.data.mensaje || 'Error al eliminar pieza.', 'error');
    }
  };
};

function abrirModalPieza(pieza, onSuccess) {
  const esEdicion = !!pieza;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${esEdicion ? 'Editar Pieza' : 'Nueva Pieza'}</span>
        <button class="modal-close" id="modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Codigo SKU</label>
            <input type="text" class="form-control" id="codigo_sku"
                   placeholder="FRE-001"
                   value="${esEdicion ? pieza.codigo_sku : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <input type="text" class="form-control" id="categoria_tipo"
                   placeholder="Frenos, Suspension..."
                   value="${esEdicion ? pieza.categoria_tipo : ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre de la Pieza</label>
          <input type="text" class="form-control" id="nombre"
                 placeholder="Descripcion completa de la pieza"
                 value="${esEdicion ? pieza.nombre : ''}" />
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Stock Actual</label>
            <input type="number" class="form-control" id="stock_actual"
                   min="0" placeholder="0"
                   value="${esEdicion ? pieza.stock_actual : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Stock Minimo</label>
            <input type="number" class="form-control" id="stock_minimo"
                   min="0" placeholder="5"
                   value="${esEdicion ? pieza.stock_minimo : ''}" />
          </div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Precio Costo (RD$)</label>
            <input type="number" class="form-control" id="precio_costo"
                   min="0" step="0.01" placeholder="0.00"
                   value="${esEdicion ? pieza.precio_costo : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Precio Venta (RD$)</label>
            <input type="number" class="form-control" id="precio_venta"
                   min="0" step="0.01" placeholder="0.00"
                   value="${esEdicion ? pieza.precio_venta : ''}" />
          </div>
        </div>
        <div id="form-error" class="alert alert-danger hidden"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        <button class="btn btn-primary" id="btn-guardar">
          ${esEdicion ? 'Guardar Cambios' : 'Agregar Pieza'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => modal.remove();
  document.getElementById('modal-close').addEventListener('click', cerrar);
  document.getElementById('btn-cancelar').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const body = {
      codigo_sku:    document.getElementById('codigo_sku').value.trim(),
      nombre:        document.getElementById('nombre').value.trim(),
      categoria_tipo: document.getElementById('categoria_tipo').value.trim(),
      stock_actual:  parseInt(document.getElementById('stock_actual').value),
      stock_minimo:  parseInt(document.getElementById('stock_minimo').value),
      precio_costo:  parseFloat(document.getElementById('precio_costo').value),
      precio_venta:  parseFloat(document.getElementById('precio_venta').value),
    };

    const errorEl = document.getElementById('form-error');

    if (!body.codigo_sku || !body.nombre || !body.categoria_tipo ||
        isNaN(body.stock_actual) || isNaN(body.precio_costo) || isNaN(body.precio_venta)) {
      errorEl.textContent = 'Todos los campos son obligatorios.';
      errorEl.classList.remove('hidden');
      return;
    }

    if (body.precio_venta < body.precio_costo) {
      errorEl.textContent = 'El precio de venta no puede ser menor al precio de costo.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');

    const res = esEdicion
      ? await api.put(`/inventario/${pieza.id_pieza}`, body)
      : await api.post('/inventario', body);

    if (res.ok) {
      Toast.show(
        esEdicion ? 'Pieza actualizada exitosamente.' : 'Pieza agregada al inventario.',
        'success'
      );
      cerrar();
      if (onSuccess) onSuccess();
    } else {
      errorEl.textContent = res.data.mensaje || 'Error al guardar pieza.';
      errorEl.classList.remove('hidden');
    }
  });
}