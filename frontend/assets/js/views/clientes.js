/**
 * @file clientes.js
 * @description Vista de gestion de clientes.
 */

Views.clientes = async () => {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Clientes</h2>
        <p class="page-subtitle">Gestion de personas y empresas</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-cliente">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
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
        <input type="text" class="form-control" id="search-clientes"
               placeholder="Buscar por nombre, cedula o telefono...">
      </div>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre / Razon Social</th>
            <th>Tipo</th>
            <th>Cedula / RNC</th>
            <th>Telefono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-clientes">
          <tr>
            <td colspan="6" class="text-center">
              <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nuevo/editar cliente -->
    <div class="modal-overlay hidden" id="modal-cliente">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-cliente-titulo">Nuevo Cliente</h3>
          <button class="modal-close" id="btn-cerrar-modal-cliente">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tipo de Cliente</label>
            <select class="form-control" id="tipo-cliente">
              <option value="persona">Persona Fisica</option>
              <option value="empresa">Empresa / Persona Juridica</option>
            </select>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label" id="label-cedula-rnc">Cedula</label>
              <input type="text" class="form-control" id="cedula-rnc"
                     placeholder="000-0000000-0">
            </div>
            <div class="form-group">
              <label class="form-label">Telefono</label>
              <input type="text" class="form-control" id="telefono"
                     placeholder="809-000-0000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" id="label-nombre">Nombre Completo</label>
            <input type="text" class="form-control" id="nombre-completo"
                   placeholder="Nombre completo o razon social">
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" id="email-cliente"
                     placeholder="correo@ejemplo.com">
            </div>
            <div class="form-group">
              <label class="form-label">Direccion</label>
              <input type="text" class="form-control" id="direccion-cliente"
                     placeholder="Direccion del cliente">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancelar-cliente">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-cliente">Guardar Cliente</button>
        </div>
      </div>
    </div>
  `;

  // Variables de estado
  let clienteEditandoId = null;
  let todosLosClientes  = [];

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      const data     = await Api.getClientes();
      todosLosClientes = data.clientes;
      renderTabla(todosLosClientes);
    } catch (error) {
      Toast.error('Error al cargar clientes: ' + error.message);
    }
  };

  // Renderizar tabla
  const renderTabla = (clientes) => {
    const tbody = document.getElementById('tabla-clientes');

    if (clientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <p>No se encontraron clientes.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clientes.map(c => `
      <tr>
        <td>${c.nombre_completo}</td>
        <td>
          <span class="badge ${c.tipo_cliente === 'empresa' ? 'badge-proceso' : 'badge-completada'}">
            ${c.tipo_cliente === 'empresa' ? 'Empresa' : 'Persona'}
          </span>
        </td>
        <td class="font-mono">${c.cedula_rnc}</td>
        <td>${c.telefono}</td>
        <td>${c.email || '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editarCliente(${c.id_cliente})">
              Editar
            </button>
            ${esAdmin ? `
              <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id_cliente}, '${c.nombre_completo}')">
                Eliminar
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  // Busqueda en tiempo real
  document.getElementById('search-clientes').addEventListener('input', async (e) => {
    const termino = e.target.value.trim();
    if (termino.length === 0) {
      renderTabla(todosLosClientes);
      return;
    }
    if (termino.length < 2) return;
    try {
      const data = await Api.buscarClientes(termino);
      renderTabla(data.clientes);
    } catch (error) {
      Toast.error('Error en la busqueda.');
    }
  });

  // Cambio de tipo cliente
  document.getElementById('tipo-cliente').addEventListener('change', (e) => {
    const esEmpresa = e.target.value === 'empresa';
    document.getElementById('label-cedula-rnc').textContent = esEmpresa ? 'RNC' : 'Cedula';
    document.getElementById('label-nombre').textContent     = esEmpresa ? 'Razon Social' : 'Nombre Completo';
    document.getElementById('cedula-rnc').placeholder       = esEmpresa ? '000-00000-0' : '000-0000000-0';
  });

  // Abrir modal nuevo cliente
  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
    clienteEditandoId = null;
    document.getElementById('modal-cliente-titulo').textContent = 'Nuevo Cliente';
    document.getElementById('tipo-cliente').value      = 'persona';
    document.getElementById('cedula-rnc').value        = '';
    document.getElementById('nombre-completo').value   = '';
    document.getElementById('telefono').value          = '';
    document.getElementById('email-cliente').value     = '';
    document.getElementById('direccion-cliente').value = '';
    document.getElementById('modal-cliente').classList.remove('hidden');
  });

  // Cerrar modal
  const cerrarModal = () => {
    document.getElementById('modal-cliente').classList.add('hidden');
    clienteEditandoId = null;
  };

  document.getElementById('btn-cerrar-modal-cliente').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar-cliente').addEventListener('click', cerrarModal);

  // Guardar cliente
  document.getElementById('btn-guardar-cliente').addEventListener('click', async () => {
    const body = {
      tipo_cliente:    document.getElementById('tipo-cliente').value,
      cedula_rnc:      document.getElementById('cedula-rnc').value.trim(),
      nombre_completo: document.getElementById('nombre-completo').value.trim(),
      telefono:        document.getElementById('telefono').value.trim(),
      email:           document.getElementById('email-cliente').value.trim(),
      direccion:       document.getElementById('direccion-cliente').value.trim(),
    };

    if (!body.cedula_rnc || !body.nombre_completo || !body.telefono) {
      Toast.error('Cedula/RNC, nombre y telefono son obligatorios.');
      return;
    }

    try {
      if (clienteEditandoId) {
        await Api.editarCliente(clienteEditandoId, body);
        Toast.success('Cliente actualizado exitosamente.');
      } else {
        await Api.crearCliente(body);
        Toast.success('Cliente registrado exitosamente.');
      }
      cerrarModal();
      cargarClientes();
    } catch (error) {
      Toast.error(error.message);
    }
  });

  // Editar cliente (funcion global)
  window.editarCliente = async (id) => {
    try {
      const data    = await Api.getCliente(id);
      const cliente = data.cliente;
      clienteEditandoId = id;

      document.getElementById('modal-cliente-titulo').textContent = 'Editar Cliente';
      document.getElementById('tipo-cliente').value      = cliente.tipo_cliente;
      document.getElementById('cedula-rnc').value        = cliente.cedula_rnc;
      document.getElementById('nombre-completo').value   = cliente.nombre_completo;
      document.getElementById('telefono').value          = cliente.telefono;
      document.getElementById('email-cliente').value     = cliente.email || '';
      document.getElementById('direccion-cliente').value = cliente.direccion || '';
      document.getElementById('modal-cliente').classList.remove('hidden');
    } catch (error) {
      Toast.error('Error al cargar el cliente.');
    }
  };

  // Eliminar cliente (funcion global)
  window.eliminarCliente = async (id, nombre) => {
    if (!confirm(`Deseas eliminar al cliente "${nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      await Api.eliminarCliente(id);
      Toast.success('Cliente eliminado exitosamente.');
      cargarClientes();
    } catch (error) {
      Toast.error(error.message);
    }
  };

  cargarClientes();
};