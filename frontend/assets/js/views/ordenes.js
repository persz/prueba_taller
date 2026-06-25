/**
 * @file ordenes.js
 * @description Vista de gestion de Ordenes de Trabajo.
 */

Views.ordenes = async () => {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Ordenes de Trabajo</h2>
        <p class="page-subtitle">Gestion de servicios y reparaciones</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-ot">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva OT
      </button>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Vehiculo</th>
            <th>Mecanico</th>
            <th>Estado</th>
            <th>Fecha Ingreso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-ordenes">
          <tr>
            <td colspan="7" class="text-center">
              <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nueva OT -->
    <div class="modal-overlay hidden" id="modal-ot">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Nueva Orden de Trabajo</h3>
          <button class="modal-close" id="btn-cerrar-modal-ot">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Cliente</label>
            <select class="form-control" id="ot-id-cliente">
              <option value="">Selecciona un cliente...</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">VIN / Numero de Chasis</label>
            <div style="display: flex; gap: var(--spacing-sm);">
              <input type="text" class="form-control" id="ot-vin"
                     placeholder="17 caracteres" maxlength="17"
                     style="text-transform: uppercase;">
              <button class="btn btn-secondary" id="btn-decode-vin">Buscar</button>
            </div>
          </div>

          <div id="ot-vehiculo-info" class="hidden">
            <div class="alert alert-info mb-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span id="ot-vehiculo-texto"></span>
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Marca</label>
              <input type="text" class="form-control" id="ot-marca" placeholder="Marca">
            </div>
            <div class="form-group">
              <label class="form-label">Modelo</label>
              <input type="text" class="form-control" id="ot-modelo" placeholder="Modelo">
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Año</label>
              <input type="number" class="form-control" id="ot-anio"
                     placeholder="2024" min="1900" max="2030">
            </div>
            <div class="form-group">
              <label class="form-label">Placa</label>
              <input type="text" class="form-control" id="ot-placa"
                     placeholder="A123456" style="text-transform: uppercase;">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mecanico Asignado</label>
            <input type="text" class="form-control" id="ot-mecanico"
                   placeholder="Nombre del mecanico">
          </div>

          <div class="form-group">
            <label class="form-label">Descripcion del Trabajo</label>
            <textarea class="form-control" id="ot-descripcion" rows="3"
                      placeholder="Describe el trabajo a realizar..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancelar-ot">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-ot">Crear OT</button>
        </div>
      </div>
    </div>

    <!-- Modal detalle OT -->
    <div class="modal-overlay hidden" id="modal-detalle-ot">
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-detalle-titulo">Detalle OT</h3>
          <button class="modal-close" id="btn-cerrar-detalle-ot">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="modal-detalle-body">
        </div>
        <div class="modal-footer" id="modal-detalle-footer">
        </div>
      </div>
    </div>
  `;

  // Cargar ordenes
  const cargarOrdenes = async () => {
    try {
      const data = await Api.getOrdenes();
      renderTabla(data.ordenes);
    } catch (error) {
      Toast.error('Error al cargar ordenes: ' + error.message);
    }
  };

  const renderTabla = (ordenes) => {
    const tbody = document.getElementById('tabla-ordenes');

    if (ordenes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state"><p>No hay ordenes de trabajo registradas.</p></div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = ordenes.map(o => `
      <tr>
        <td class="font-mono">${o.id_unico_ot}</td>
        <td>${o.nombre_cliente}</td>
        <td>${o.marca} ${o.modelo} ${o.anio}</td>
        <td>${o.mecanico_asignado || '-'}</td>
        <td>
          <span class="badge badge-${o.estado.toLowerCase().replace(' ', '')}">
            ${o.estado}
          </span>
        </td>
        <td>${new Date(o.fecha_ingreso).toLocaleDateString('es-DO')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="verDetalleOT('${o.id_unico_ot}')">
              Ver
            </button>
            ${(esAdmin || true) ? `
              <button class="btn btn-danger btn-sm" onclick="eliminarOT('${o.id_unico_ot}')">
                Eliminar
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  // Cargar clientes para el select
  const cargarClientes = async () => {
    try {
      const data   = await Api.getClientes();
      const select = document.getElementById('ot-id-cliente');
      data.clientes.forEach(c => {
        const option   = document.createElement('option');
        option.value   = c.id_cliente;
        option.textContent = `${c.nombre_completo} (${c.cedula_rnc})`;
        select.appendChild(option);
      });
    } catch (error) {
      Toast.error('Error al cargar clientes.');
    }
  };

  // Abrir modal nueva OT
  document.getElementById('btn-nueva-ot').addEventListener('click', () => {
    document.getElementById('ot-id-cliente').value  = '';
    document.getElementById('ot-vin').value         = '';
    document.getElementById('ot-marca').value       = '';
    document.getElementById('ot-modelo').value      = '';
    document.getElementById('ot-anio').value        = '';
    document.getElementById('ot-placa').value       = '';
    document.getElementById('ot-mecanico').value    = '';
    document.getElementById('ot-descripcion').value = '';
    document.getElementById('ot-vehiculo-info').classList.add('hidden');
    document.getElementById('modal-ot').classList.remove('hidden');
    cargarClientes();
  });

  const cerrarModalOT = () => {
    document.getElementById('modal-ot').classList.add('hidden');
  };

  document.getElementById('btn-cerrar-modal-ot').addEventListener('click', cerrarModalOT);
  document.getElementById('btn-cancelar-ot').addEventListener('click', cerrarModalOT);

  // Decodificar VIN
  document.getElementById('btn-decode-vin').addEventListener('click', async () => {
    const vin = document.getElementById('ot-vin').value.trim().toUpperCase();
    if (vin.length !== 17) {
      Toast.error('El VIN debe tener exactamente 17 caracteres.');
      return;
    }
    try {
      const data     = await Api.decodificarVIN(vin);
      const vehiculo = data.vehiculo;
      document.getElementById('ot-marca').value  = vehiculo.marca;
      document.getElementById('ot-modelo').value = vehiculo.modelo;
      document.getElementById('ot-anio').value   = vehiculo.anio;
      document.getElementById('ot-vehiculo-info').classList.remove('hidden');
      document.getElementById('ot-vehiculo-texto').textContent =
        `Vehiculo identificado: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`;
      Toast.success('Vehiculo identificado exitosamente.');
    } catch (error) {
      Toast.error('No se pudo decodificar el VIN: ' + error.message);
    }
  });

  // Guardar OT
  document.getElementById('btn-guardar-ot').addEventListener('click', async () => {
    const body = {
      id_cliente:          parseInt(document.getElementById('ot-id-cliente').value),
      vin:                 document.getElementById('ot-vin').value.trim().toUpperCase(),
      placa:               document.getElementById('ot-placa').value.trim().toUpperCase(),
      marca:               document.getElementById('ot-marca').value.trim(),
      modelo:              document.getElementById('ot-modelo').value.trim(),
      anio:                parseInt(document.getElementById('ot-anio').value),
      mecanico_asignado:   document.getElementById('ot-mecanico').value.trim(),
      descripcion_trabajo: document.getElementById('ot-descripcion').value.trim(),
    };

    if (!body.id_cliente || !body.vin || !body.placa || !body.marca || !body.modelo || !body.anio || !body.descripcion_trabajo) {
      Toast.error('Todos los campos son obligatorios excepto el mecanico.');
      return;
    }

    try {
      await Api.crearOrden(body);
      Toast.success('Orden de Trabajo creada exitosamente.');
      cerrarModalOT();
      cargarOrdenes();
    } catch (error) {
      Toast.error(error.message);
    }
  });

  // Ver detalle OT
  window.verDetalleOT = async (id) => {
    try {
      const data   = await Api.getOrden(id);
      const orden  = data.orden;
      const piezas = data.piezas;

      document.getElementById('modal-detalle-titulo').textContent = `OT: ${orden.id_unico_ot}`;

      document.getElementById('modal-detalle-body').innerHTML = `
        <div class="grid-2" style="gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
          <div>
            <p class="form-label">Cliente</p>
            <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${orden.nombre_cliente}</p>
            <p style="margin: 0; font-size: 0.8rem;">${orden.cedula_rnc_cliente}</p>
          </div>
          <div>
            <p class="form-label">Vehiculo</p>
            <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${orden.marca} ${orden.modelo} ${orden.anio}</p>
            <p style="margin: 0; font-size: 0.8rem;">Placa: ${orden.placa} | VIN: ${orden.vin}</p>
          </div>
          <div>
            <p class="form-label">Mecanico</p>
            <p style="color: var(--text-primary); margin: 0;">${orden.mecanico_asignado || 'No asignado'}</p>
          </div>
          <div>
            <p class="form-label">Estado</p>
            <span class="badge badge-${orden.estado.toLowerCase().replace(' ', '')}">${orden.estado}</span>
          </div>
        </div>

        <div class="form-group">
          <p class="form-label">Descripcion del Trabajo</p>
          <p style="color: var(--text-primary); margin: 0;">${orden.descripcion_trabajo}</p>
        </div>

        <hr class="divider">

        <h4 style="margin-bottom: var(--spacing-md);">Piezas Utilizadas</h4>

        ${piezas.length === 0 ? `
          <div class="empty-state">
            <p>No hay piezas agregadas a esta OT.</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Pieza</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${piezas.map(p => `
                  <tr>
                    <td class="font-mono">${p.codigo_sku}</td>
                    <td>${p.nombre_pieza}</td>
                    <td>${p.cantidad_pieza}</td>
                    <td>RD$ ${parseFloat(p.precio_venta).toLocaleString('es-DO')}</td>
                    <td>RD$ ${parseFloat(p.subtotal).toLocaleString('es-DO')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="text-align: right; margin-top: var(--spacing-md);">
            <strong style="color: var(--accent);">
              Total Piezas: RD$ ${piezas.reduce((acc, p) => acc + parseFloat(p.subtotal), 0).toLocaleString('es-DO')}
            </strong>
          </div>
        `}

        <hr class="divider">

        <div class="form-group">
          <label class="form-label">Agregar Pieza</label>
          <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
            <select class="form-control" id="select-pieza" style="flex: 2;">
              <option value="">Selecciona una pieza...</option>
            </select>
            <input type="number" class="form-control" id="cantidad-pieza"
                   placeholder="Cant." min="1" style="flex: 1; max-width: 100px;">
            <button class="btn btn-primary" id="btn-agregar-pieza">Agregar</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Actualizar Estado</label>
          <div style="display: flex; gap: var(--spacing-sm);">
            <select class="form-control" id="select-estado">
              <option value="Pendiente"  ${orden.estado === 'Pendiente'  ? 'selected' : ''}>Pendiente</option>
              <option value="En Proceso" ${orden.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
              <option value="Completada" ${orden.estado === 'Completada' ? 'selected' : ''}>Completada</option>
              <option value="Cancelada"  ${orden.estado === 'Cancelada'  ? 'selected' : ''}>Cancelada</option>
            </select>
            <button class="btn btn-secondary" id="btn-actualizar-estado">Actualizar</button>
          </div>
        </div>
      `;

      // Cargar piezas en el select
      const selectPieza = document.getElementById('select-pieza');
      const dataPiezas  = await Api.getPiezas();
      dataPiezas.piezas.forEach(p => {
        const option       = document.createElement('option');
        option.value       = p.id_pieza;
        option.textContent = `${p.nombre} (Stock: ${p.stock_actual})`;
        selectPieza.appendChild(option);
      });

      // Footer del modal
      document.getElementById('modal-detalle-footer').innerHTML = `
        ${orden.estado === 'Completada' ? `
          <button class="btn btn-success" id="btn-generar-factura">
            Generar Factura
          </button>
        ` : ''}
        <button class="btn btn-secondary" id="btn-cerrar-detalle">Cerrar</button>
      `;

      document.getElementById('modal-detalle-ot').classList.remove('hidden');

      // Cerrar modal detalle
      document.getElementById('btn-cerrar-detalle-ot').addEventListener('click', () => {
        document.getElementById('modal-detalle-ot').classList.add('hidden');
      });

      document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
        document.getElementById('modal-detalle-ot').classList.add('hidden');
      });

      // Agregar pieza
      document.getElementById('btn-agregar-pieza').addEventListener('click', async () => {
        const id_pieza = document.getElementById('select-pieza').value;
        const cantidad = document.getElementById('cantidad-pieza').value;

        if (!id_pieza || !cantidad || cantidad <= 0) {
          Toast.error('Selecciona una pieza y una cantidad valida.');
          return;
        }

        try {
          const resultado = await Api.agregarPieza({
            id_ot:    id,
            id_pieza: parseInt(id_pieza),
            cantidad: parseInt(cantidad),
          });
          Toast.success('Pieza agregada exitosamente.');
          if (resultado.alerta_stock && resultado.alerta_stock.activa) {
            Toast.warning(resultado.alerta_stock.mensaje);
          }
          document.getElementById('modal-detalle-ot').classList.add('hidden');
          verDetalleOT(id);
        } catch (error) {
          Toast.error(error.message);
        }
      });

      // Actualizar estado
      document.getElementById('btn-actualizar-estado').addEventListener('click', async () => {
        const estado = document.getElementById('select-estado').value;
        try {
          await Api.actualizarEstado(id, { estado });
          Toast.success(`Estado actualizado a "${estado}".`);
          document.getElementById('modal-detalle-ot').classList.add('hidden');
          cargarOrdenes();
        } catch (error) {
          Toast.error(error.message);
        }
      });

      // Generar factura
      if (orden.estado === 'Completada') {
        document.getElementById('btn-generar-factura').addEventListener('click', async () => {
          if (!confirm('Deseas generar la factura para esta OT?')) return;
          try {
            await Api.generarFactura({ id_unico_ot: id });
            Toast.success('Factura generada exitosamente.');
            document.getElementById('modal-detalle-ot').classList.add('hidden');
            Router.navigate('facturas');
          } catch (error) {
            Toast.error(error.message);
          }
        });
      }

    } catch (error) {
      Toast.error('Error al cargar el detalle de la OT.');
    }
  };

  // Eliminar OT
  window.eliminarOT = async (id) => {
    if (!confirm(`Deseas eliminar la OT ${id}? Esta accion no se puede deshacer.`)) return;
    try {
      await Api.eliminarOrden(id);
      Toast.success('Orden de Trabajo eliminada.');
      cargarOrdenes();
    } catch (error) {
      Toast.error(error.message);
    }
  };

  cargarOrdenes();
};