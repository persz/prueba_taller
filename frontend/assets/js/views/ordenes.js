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
        <p class="page-subtitle">Gestion y seguimiento de reparaciones</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-orden">
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
            <th>ID OT</th>
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
    <div class="modal-overlay hidden" id="modal-orden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Nueva Orden de Trabajo</h3>
          <button class="modal-close" id="btn-cerrar-modal-orden">
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
            <select class="form-control" id="orden-cliente">
              <option value="">Selecciona un cliente...</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">VIN / Numero de Chasis</label>
            <div style="display:flex; gap: var(--spacing-sm);">
              <input type="text" class="form-control" id="orden-vin"
                     placeholder="17 caracteres" maxlength="17"
                     style="text-transform:uppercase;">
              <button class="btn btn-secondary btn-sm" id="btn-buscar-vin">Buscar</button>
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Placa</label>
              <input type="text" class="form-control" id="orden-placa"
                     placeholder="A123456" style="text-transform:uppercase;">
            </div>
            <div class="form-group">
              <label class="form-label">Año</label>
              <input type="number" class="form-control" id="orden-anio" placeholder="2024">
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Marca</label>
              <input type="text" class="form-control" id="orden-marca" placeholder="Marca">
            </div>
            <div class="form-group">
              <label class="form-label">Modelo</label>
              <input type="text" class="form-control" id="orden-modelo" placeholder="Modelo">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mecanico Asignado</label>
            <input type="text" class="form-control" id="orden-mecanico"
                   placeholder="Nombre del mecanico">
          </div>

          <div class="form-group">
            <label class="form-label">Descripcion del Trabajo</label>
            <textarea class="form-control" id="orden-descripcion" rows="3"
                      placeholder="Describe el trabajo a realizar..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancelar-orden">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-orden">Crear OT</button>
        </div>
      </div>
    </div>

    <!-- Modal detalle OT -->
    <div class="modal-overlay hidden" id="modal-detalle-orden">
      <div class="modal" style="max-width: 720px;">
        <div class="modal-header">
          <h3 class="modal-title" id="detalle-titulo">Detalle OT</h3>
          <button class="modal-close" id="btn-cerrar-detalle-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="detalle-body"></div>
        <div class="modal-footer" id="detalle-footer"></div>
      </div>
    </div>
  `;

  // ── Cargar y renderizar ordenes ────────────────────────────────────────────
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
        <td>${o.marca} ${o.modelo} ${o.anio} — <span class="font-mono">${o.placa}</span></td>
        <td>${o.mecanico_asignado || '-'}</td>
        <td>
          <span class="badge badge-${o.estado.toLowerCase().replace(' ', '')}">
            ${o.estado}
          </span>
        </td>
        <td>${new Date(o.fecha_ingreso).toLocaleDateString('es-DO')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="verDetalleOrden('${o.id_unico_ot}')">
              Ver
            </button>
            <button class="btn btn-danger btn-sm" onclick="eliminarOrden('${o.id_unico_ot}')">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  // ── Modal nueva OT ─────────────────────────────────────────────────────────
  const cerrarModalOrden = () => {
    document.getElementById('modal-orden').classList.add('hidden');
  };

  document.getElementById('btn-nueva-orden').addEventListener('click', async () => {
    document.getElementById('orden-cliente').innerHTML   = '<option value="">Selecciona un cliente...</option>';
    document.getElementById('orden-vin').value           = '';
    document.getElementById('orden-placa').value         = '';
    document.getElementById('orden-anio').value          = '';
    document.getElementById('orden-marca').value         = '';
    document.getElementById('orden-modelo').value        = '';
    document.getElementById('orden-mecanico').value      = '';
    document.getElementById('orden-descripcion').value   = '';
    document.getElementById('modal-orden').classList.remove('hidden');

    try {
      const data = await Api.getClientes();
      const select = document.getElementById('orden-cliente');
      data.clientes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_cliente;
        opt.textContent = `${c.nombre_completo} (${c.cedula_rnc})`;
        select.appendChild(opt);
      });
    } catch (e) {
      Toast.error('Error al cargar clientes.');
    }
  });

  document.getElementById('btn-cerrar-modal-orden').addEventListener('click', cerrarModalOrden);
  document.getElementById('btn-cancelar-orden').addEventListener('click', cerrarModalOrden);

  // Buscar VIN
  document.getElementById('btn-buscar-vin').addEventListener('click', async () => {
    const vin = document.getElementById('orden-vin').value.trim().toUpperCase();
    if (vin.length !== 17) {
      Toast.error('El VIN debe tener exactamente 17 caracteres.');
      return;
    }
    try {
      const data = await Api.decodificarVIN(vin);
      document.getElementById('orden-marca').value  = data.vehiculo.marca;
      document.getElementById('orden-modelo').value = data.vehiculo.modelo;
      document.getElementById('orden-anio').value   = data.vehiculo.anio;
      Toast.success('Vehiculo identificado: ' + data.vehiculo.marca + ' ' + data.vehiculo.modelo);
    } catch (error) {
      Toast.error('VIN no encontrado. Completa los datos manualmente.');
    }
  });

  // Guardar OT
  document.getElementById('btn-guardar-orden').addEventListener('click', async () => {
    const body = {
      id_cliente:          parseInt(document.getElementById('orden-cliente').value),
      vin:                 document.getElementById('orden-vin').value.trim().toUpperCase(),
      placa:               document.getElementById('orden-placa').value.trim().toUpperCase(),
      marca:               document.getElementById('orden-marca').value.trim(),
      modelo:              document.getElementById('orden-modelo').value.trim(),
      anio:                parseInt(document.getElementById('orden-anio').value),
      descripcion_trabajo: document.getElementById('orden-descripcion').value.trim(),
      mecanico_asignado:   document.getElementById('orden-mecanico').value.trim(),
    };

    if (!body.id_cliente || !body.vin || !body.placa || !body.marca || !body.modelo || !body.anio || !body.descripcion_trabajo) {
      Toast.error('Todos los campos son obligatorios excepto el mecanico.');
      return;
    }

    try {
      await Api.crearOrden(body);
      Toast.success('Orden de Trabajo creada exitosamente.');
      cerrarModalOrden();
      cargarOrdenes();
    } catch (error) {
      Toast.error(error.message);
    }
  });

  // ── Ver detalle OT ─────────────────────────────────────────────────────────
  window.verDetalleOrden = async (id) => {
    try {
      const data   = await Api.getOrden(id);
      const orden  = data.orden;
      const piezas = data.piezas;

      document.getElementById('detalle-titulo').textContent = `OT: ${orden.id_unico_ot}`;

      const totalPiezas = piezas.reduce((acc, p) => acc + parseFloat(p.subtotal), 0);

      document.getElementById('detalle-body').innerHTML = `
        <div class="grid-2" style="margin-bottom: var(--spacing-lg);">
          <div>
            <p class="form-label">Cliente</p>
            <p style="color:var(--text-primary);margin:0;font-weight:600;">${orden.nombre_cliente}</p>
            <p class="font-mono" style="font-size:0.8rem;margin:0;">${orden.cedula_rnc_cliente}</p>
          </div>
          <div>
            <p class="form-label">Vehiculo</p>
            <p style="color:var(--text-primary);margin:0;font-weight:600;">${orden.marca} ${orden.modelo} ${orden.anio}</p>
            <p class="font-mono" style="font-size:0.8rem;margin:0;">VIN: ${orden.vin} | Placa: ${orden.placa}</p>
          </div>
          <div>
            <p class="form-label">Mecanico</p>
            <p style="color:var(--text-primary);margin:0;">${orden.mecanico_asignado || 'No asignado'}</p>
          </div>
          <div>
            <p class="form-label">Estado</p>
            <span class="badge badge-${orden.estado.toLowerCase().replace(' ', '')}">${orden.estado}</span>
          </div>
          <div style="grid-column:1/-1;">
            <p class="form-label">Descripcion del Trabajo</p>
            <p style="color:var(--text-primary);margin:0;">${orden.descripcion_trabajo}</p>
          </div>
        </div>

        <hr class="divider">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-md);">
          <h4 style="color:var(--text-primary);">Piezas Utilizadas</h4>
          ${orden.estado !== 'Completada' && orden.estado !== 'Cancelada' ? `
            <button class="btn btn-secondary btn-sm" id="btn-toggle-agregar-pieza">
              Agregar Pieza
            </button>
          ` : ''}
        </div>

        ${piezas.length === 0
          ? '<p style="color:var(--text-disabled);margin-bottom:var(--spacing-md);">No hay piezas agregadas.</p>'
          : `
            <div class="table-container" style="margin-bottom:var(--spacing-md);">
              <table class="table">
                <thead>
                  <tr>
                    <th>SKU</th><th>Pieza</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th>
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
            <div style="text-align:right;margin-bottom:var(--spacing-md);">
              <strong style="color:var(--accent);">
                Total Piezas: RD$ ${totalPiezas.toLocaleString('es-DO')}
              </strong>
            </div>
          `
        }

        <!-- Form agregar pieza -->
        <div id="form-agregar-pieza" class="hidden" style="margin-bottom:var(--spacing-lg);">
          <hr class="divider">
          <h4 style="color:var(--text-primary);margin-bottom:var(--spacing-md);">Agregar Pieza</h4>
          <div style="display:flex;gap:var(--spacing-sm);flex-wrap:wrap;">
            <select class="form-control" id="select-pieza-agregar" style="flex:2;">
              <option value="">Cargando piezas...</option>
            </select>
            <input type="number" class="form-control" id="cantidad-pieza-agregar"
                   placeholder="Cant." min="1" style="flex:1;max-width:100px;">
            <button class="btn btn-primary" id="btn-confirmar-pieza">Agregar</button>
          </div>
        </div>

        <!-- Actualizar estado -->
        <hr class="divider">
        <h4 style="color:var(--text-primary);margin-bottom:var(--spacing-md);">Actualizar Estado</h4>
        <div style="display:flex;gap:var(--spacing-sm);">
          <select class="form-control" id="select-estado-orden">
            <option value="Pendiente"  ${orden.estado === 'Pendiente'  ? 'selected' : ''}>Pendiente</option>
            <option value="En Proceso" ${orden.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
            <option value="Completada" ${orden.estado === 'Completada' ? 'selected' : ''}>Completada</option>
            <option value="Cancelada"  ${orden.estado === 'Cancelada'  ? 'selected' : ''}>Cancelada</option>
          </select>
          <button class="btn btn-secondary" id="btn-actualizar-estado">Actualizar</button>
        </div>
      `;

      // Footer segun estado
      document.getElementById('detalle-footer').innerHTML = `
        ${orden.estado === 'Completada' ? `
          <div style="width:100%;">
            <div class="form-row form-row-2" style="margin-bottom:var(--spacing-md);">
              <div class="form-group">
                <label class="form-label">Mano de Obra (RD$)</label>
                <input type="number" class="form-control" id="factura-mano-obra"
                       placeholder="0.00" min="0" step="0.01" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Cargos Extra (RD$) — Opcional</label>
                <input type="number" class="form-control" id="factura-cargos-extra"
                       placeholder="0.00" min="0" step="0.01">
              </div>
            </div>
            <div class="form-group" style="margin-bottom:var(--spacing-md);">
              <label class="form-label">Descripcion Cargos Extra</label>
              <input type="text" class="form-control" id="factura-descripcion-cargos"
                     placeholder="Ej: Servicio de grua, lavado...">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:var(--spacing-md);">
              <button class="btn btn-secondary" id="btn-cerrar-detalle">Cerrar</button>
              <button class="btn btn-success" id="btn-generar-factura">Generar Factura</button>
            </div>
          </div>
        ` : `
          <button class="btn btn-secondary" id="btn-cerrar-detalle">Cerrar</button>
        `}
      `;

      document.getElementById('modal-detalle-orden').classList.remove('hidden');

      // Cerrar header
      document.getElementById('btn-cerrar-detalle-header').addEventListener('click', () => {
        document.getElementById('modal-detalle-orden').classList.add('hidden');
      });

      // Cerrar footer
      document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
        document.getElementById('modal-detalle-orden').classList.add('hidden');
      });

      // Toggle form agregar pieza
      const btnToggle = document.getElementById('btn-toggle-agregar-pieza');
      if (btnToggle) {
        // Cargar piezas en el select
        const selectPieza = document.getElementById('select-pieza-agregar');
        try {
          const dataPiezas = await Api.getPiezas();
          selectPieza.innerHTML = '<option value="">Selecciona una pieza...</option>';
          dataPiezas.piezas.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_pieza;
            opt.textContent = `[${p.codigo_sku}] ${p.nombre} — Stock: ${p.stock_actual}`;
            selectPieza.appendChild(opt);
          });
        } catch (e) {
          selectPieza.innerHTML = '<option value="">Error al cargar piezas</option>';
        }

        btnToggle.addEventListener('click', () => {
          document.getElementById('form-agregar-pieza').classList.toggle('hidden');
        });
      }

      // Confirmar agregar pieza
      const btnConfirmar = document.getElementById('btn-confirmar-pieza');
      if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
          const id_pieza = parseInt(document.getElementById('select-pieza-agregar').value);
          const cantidad = parseInt(document.getElementById('cantidad-pieza-agregar').value);

          if (!id_pieza || !cantidad || cantidad <= 0) {
            Toast.error('Selecciona una pieza y una cantidad valida.');
            return;
          }

          try {
            const resultado = await Api.agregarPieza({ id_ot: id, id_pieza, cantidad });
            Toast.success('Pieza agregada exitosamente.');
            if (resultado.alerta_stock?.activa) {
              Toast.warning(resultado.alerta_stock.mensaje);
            }
            document.getElementById('modal-detalle-orden').classList.add('hidden');
            await verDetalleOrden(id);
          } catch (error) {
            Toast.error(error.message);
          }
        });
      }

      // Actualizar estado
      document.getElementById('btn-actualizar-estado').addEventListener('click', async () => {
        const estado = document.getElementById('select-estado-orden').value;
        try {
          await Api.actualizarEstado(id, { estado });
          Toast.success(`Estado actualizado a "${estado}".`);
          document.getElementById('modal-detalle-orden').classList.add('hidden');
          cargarOrdenes();
        } catch (error) {
          Toast.error(error.message);
        }
      });

      // Generar factura
      const btnFactura = document.getElementById('btn-generar-factura');
      if (btnFactura) {
        btnFactura.addEventListener('click', async () => {
          const manoObra    = parseFloat(document.getElementById('factura-mano-obra').value) || 0;
          const cargosExtra = parseFloat(document.getElementById('factura-cargos-extra').value) || 0;
          const descripcion = document.getElementById('factura-descripcion-cargos').value.trim();

          if (!confirm('Deseas generar la factura para esta OT?')) return;

          try {
            await Api.generarFactura({
              id_unico_ot:        id,
              mano_de_obra:       manoObra,
              cargos_extra:       cargosExtra,
              descripcion_cargos: descripcion || null,
            });
            Toast.success('Factura generada exitosamente.');
            document.getElementById('modal-detalle-orden').classList.add('hidden');
            Router.navigate('facturas');
          } catch (error) {
            Toast.error(error.message);
          }
        });
      }

    } catch (error) {
      Toast.error('Error al cargar el detalle de la OT: ' + error.message);
    }
  };

  // ── Eliminar OT ────────────────────────────────────────────────────────────
  window.eliminarOrden = async (id) => {
    if (!confirm(`Deseas eliminar la OT "${id}"? Esta accion no se puede deshacer.`)) return;
    try {
      await Api.eliminarOrden(id);
      Toast.success('Orden de Trabajo eliminada exitosamente.');
      cargarOrdenes();
    } catch (error) {
      Toast.error(error.message);
    }
  };

  cargarOrdenes();
};