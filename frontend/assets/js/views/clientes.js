/**
 * views/clientes.js
 * Vista de gestion de clientes.
 */

Views.clientes = async function () {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Clientes</h2>
        <p class="page-subtitle">Gestion de clientes del taller</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-cliente">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nuevo Cliente
      </button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" class="form-control" id="input-buscar-cliente"
               placeholder="Buscar por nombre, cedula o telefono..." />
      </div>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Cedula / RNC</th>
            <th>Telefono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-clientes">
          <tr>
            <td colspan="6" style="text-align:center; padding:var(--spacing-xl);">
              <div class="spinner" style="margin:0 auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  let todosLosClientes = [];

  // Renderizar filas
  function renderTabla(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    if (!tbody) return;

    if (clientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:var(--text-disabled);
                                  padding:var(--spacing-xl);">
            No se encontraron clientes.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clientes.map(c => `
      <tr>
        <td style="color:var(--text-primary); font-weight:500;">${c.nombre_completo}</td>
        <td>
          <span class="badge ${c.tipo_cliente === 'empresa' ? 'badge-proceso' : 'badge-completada'}">
            ${c.tipo_cliente === 'empresa' ? 'Empresa' : 'Persona'}
          </span>
        </td>
        <td class="font-mono" style="font-size:0.8rem;">${c.cedula_rnc}</td>
        <td>${c.telefono}</td>
        <td style="color:var(--text-secondary);">${c.email || '—'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editarCliente(${c.id_cliente})">
              Editar
            </button>
            ${esAdmin ? `
            <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id_cliente}, '${c.nombre_completo.replace(/'/g, "\\'")}')">
              Eliminar
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Cargar clientes
  async function cargarClientes() {
    const res = await api.get('/clientes');
    if (res.ok) {
      todosLosClientes = res.data.clientes;
      renderTabla(todosLosClientes);
    } else {
      Toast.show('Error al cargar clientes.', 'error');
    }
  }

  await cargarClientes();

  // Busqueda en tiempo real
  document.getElementById('input-buscar-cliente').addEventListener('input', async function () {
    const termino = this.value.trim();
    if (termino.length === 0) {
      renderTabla(todosLosClientes);
      return;
    }
    if (termino.length < 2) return;

    const res = await api.get(`/clientes/buscar?termino=${encodeURIComponent(termino)}`);
    if (res.ok) renderTabla(res.data.clientes);
  });

  // Boton nuevo cliente
  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
    abrirModalCliente(null, cargarClientes);
  });

  // Funciones globales para los botones de la tabla
  window.editarCliente = async (id) => {
    const res = await api.get(`/clientes/${id}`);
    if (res.ok) abrirModalCliente(res.data.cliente, cargarClientes);
    else Toast.show('Error al cargar datos del cliente.', 'error');
  };

  window.eliminarCliente = async (id, nombre) => {
    if (!confirm(`Eliminar al cliente "${nombre}"? Esta accion no se puede deshacer.`)) return;
    const res = await api.delete(`/clientes/${id}`);
    if (res.ok) {
      Toast.show('Cliente eliminado exitosamente.', 'success');
      cargarClientes();
    } else {
      Toast.show(res.data.mensaje || 'Error al eliminar cliente.', 'error');
    }
  };
};

// Modal crear / editar cliente
function abrirModalCliente(cliente, onSuccess) {
  const esEdicion = !!cliente;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
        <button class="modal-close" id="modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tipo de Cliente</label>
          <select class="form-control" id="tipo_cliente">
            <option value="persona"  ${!esEdicion || cliente.tipo_cliente === 'persona'  ? 'selected' : ''}>Persona Fisica</option>
            <option value="empresa"  ${esEdicion  && cliente.tipo_cliente === 'empresa'  ? 'selected' : ''}>Empresa / Persona Juridica</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre Completo / Razon Social</label>
          <input type="text" class="form-control" id="nombre_completo"
                 placeholder="Nombre completo o razon social"
                 value="${esEdicion ? cliente.nombre_completo : ''}" />
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Cedula / RNC</label>
            <input type="text" class="form-control" id="cedula_rnc"
                   placeholder="000-0000000-0"
                   value="${esEdicion ? cliente.cedula_rnc : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Telefono</label>
            <input type="text" class="form-control" id="telefono"
                   placeholder="809-000-0000"
                   value="${esEdicion ? cliente.telefono : ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email <span style="color:var(--text-disabled);">(opcional)</span></label>
          <input type="email" class="form-control" id="email"
                 placeholder="correo@ejemplo.com"
                 value="${esEdicion && cliente.email ? cliente.email : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Direccion <span style="color:var(--text-disabled);">(opcional)</span></label>
          <input type="text" class="form-control" id="direccion"
                 placeholder="Calle, numero, sector"
                 value="${esEdicion && cliente.direccion ? cliente.direccion : ''}" />
        </div>
        <div id="form-error" class="alert alert-danger hidden"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        <button class="btn btn-primary" id="btn-guardar">
          ${esEdicion ? 'Guardar Cambios' : 'Crear Cliente'}
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
      tipo_cliente:    document.getElementById('tipo_cliente').value,
      nombre_completo: document.getElementById('nombre_completo').value.trim(),
      cedula_rnc:      document.getElementById('cedula_rnc').value.trim(),
      telefono:        document.getElementById('telefono').value.trim(),
      email:           document.getElementById('email').value.trim() || null,
      direccion:       document.getElementById('direccion').value.trim() || null,
    };

    const errorEl = document.getElementById('form-error');

    if (!body.nombre_completo || !body.cedula_rnc || !body.telefono) {
      errorEl.textContent = 'Nombre, cedula y telefono son obligatorios.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');

    const res = esEdicion
      ? await api.put(`/clientes/${cliente.id_cliente}`, body)
      : await api.post('/clientes', body);

    if (res.ok) {
      Toast.show(
        esEdicion ? 'Cliente actualizado exitosamente.' : 'Cliente creado exitosamente.',
        'success'
      );
      cerrar();
      if (onSuccess) onSuccess();
    } else {
      errorEl.textContent = res.data.mensaje || 'Error al guardar cliente.';
      errorEl.classList.remove('hidden');
    }
  });
}