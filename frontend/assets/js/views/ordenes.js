/**
 * views/ordenes.js
 * Vista de gestion de Ordenes de Trabajo.
 */

Views.ordenes = async function () {
  const contentArea = document.getElementById('content-area');
  const esAdmin     = Auth.isAdmin();

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Ordenes de Trabajo</h2>
        <p class="page-subtitle">Gestion de ordenes activas e historial</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-ot">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva OT
      </button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" class="form-control" id="input-buscar-ot"
               placeholder="Buscar por ID, cliente, placa o VIN..." />
      </div>
      <div style="display:flex; gap:var(--spacing-sm); flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm filtro-estado active" data-estado="">Todas</button>
        <button class="btn btn-secondary btn-sm filtro-estado" data-estado="Pendiente">Pendiente</button>
        <button class="btn btn-secondary btn-sm filtro-estado" data-estado="En Proceso">En Proceso</button>
        <button class="btn btn-secondary btn-sm filtro-estado" data-estado="Completada">Completada</button>
        <button class="btn btn-secondary btn-sm filtro-estado" data-estado="Cancelada">Cancelada</button>
      </div>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>OT</th>
            <th>Cliente</th>
            <th>Vehiculo</th>
            <th>Placa</th>
            <th>Estado</th>
            <th>Mecanico</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-ordenes">
          <tr>
            <td colspan="8" style="text-align:center; padding:var(--spacing-xl);">
              <div class="spinner" style="margin:0 auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  let todasLasOrdenes = [];
  let filtroEstado    = '';

  function badgeEstado(estado) {
    const map = {
      'Pendiente':  'badge-pendiente',
      'En Proceso': 'badge-proceso',
      'Completada': 'badge-completada',
      'Cancelada':  'badge-cancelada',
    };
    return `<span class="badge ${map[estado] || ''}">${estado}</span>`;
  }

  function filtrarYRenderizar(termino = '') {
    let resultado = todasLasOrdenes;

    if (filtroEstado) {
      resultado = resultado.filter(o => o.estado === filtroEstado);
    }

    if (termino.trim()) {
      const t = termino.toLowerCase();
      resultado = resultado.filter(o =>
        o.id_unico_ot.toLowerCase().includes(t)     ||
        o.nombre_cliente.toLowerCase().includes(t)  ||
        o.placa.toLowerCase().includes(t)            ||
        o.vin.toLowerCase().includes(t)
      );
    }

    renderTabla(resultado);
  }

  function renderTabla(ordenes) {
    const tbody = document.getElementById('tabla-ordenes');
    if (!tbody) return;

    if (ordenes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color:var(--text-disabled);
                                  padding:var(--spacing-xl);">
            No se encontraron ordenes de trabajo.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = ordenes.map(o => `
      <tr>
        <td class="font-mono" style="color:var(--accent); font-size:0.8rem;">
          ${o.id_unico_ot}
        </td>
        <td style="color:var(--text-primary); font-weight:500;">
          ${o.nombre_cliente}
        </td>
        <td style="color:var(--text-secondary);">
          ${o.marca} ${o.modelo} ${o.anio}
        </td>
        <td class="font-mono" style="font-size:0.8rem;">${o.placa}</td>
        <td>${badgeEstado(o.estado)}</td>
        <td style="color:var(--text-secondary);">${o.mecanico_asignado || '—'}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">
          ${new Date(o.fecha_ingreso).toLocaleDateString('es-DO')}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm"
                    onclick="verDetalleOT('${o.id_unico_ot}')">
              Ver
            </button>
            <button class="btn btn-secondary btn-sm"
                    onclick="cambiarEstadoOT('${o.id_unico_ot}', '${o.estado}')">
              Estado
            </button>
            ${o.estado === 'Completada' ? `
            <button class="btn btn-success btn-sm"
                    onclick="generarFacturaDesdeOT('${o.id_unico_ot}')">
              Facturar
            </button>
            ` : ''}
            ${(esAdmin || o.id_usuario_creador === Auth.getUsuario().id_usuario) ? `
            <button class="btn btn-danger btn-sm"
                    onclick="eliminarOT('${o.id_unico_ot}')">
              Eliminar
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function cargarOrdenes() {
    const res = await api.get('/ordenes');
    if (res.ok) {
      todasLasOrdenes = res.data.ordenes;
      filtrarYRenderizar();
    } else {
      Toast.show('Error al cargar ordenes.', 'error');
    }
  }

  await cargarOrdenes();

  // Filtros de estado
  document.querySelectorAll('.filtro-estado').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filtro-estado').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filtroEstado = this.dataset.estado;
      filtrarYRenderizar(document.getElementById('input-buscar-ot').value);
    });
  });

  // Busqueda
  document.getElementById('input-buscar-ot').addEventListener('input', function () {
    filtrarYRenderizar(this.value);
  });

  // Nueva OT
  document.getElementById('btn-nueva-ot').addEventListener('click', () => {
    abrirModalOrden(null, cargarOrdenes);
  });

  // Funciones globales
  window.verDetalleOT = async (id_ot) => {
    const res = await api.get(`/ordenes/${id_ot}`);
    if (res.ok) abrirModalDetalleOT(res.data, cargarOrdenes);
    else Toast.show('Error al cargar detalle de la OT.', 'error');
  };

  window.cambiarEstadoOT = (id_ot, estadoActual) => {
    abrirModalEstado(id_ot, estadoActual, cargarOrdenes);
  };

  window.eliminarOT = async (id_ot) => {
    if (!confirm(`Eliminar la OT ${id_ot}? Esta accion no se puede deshacer.`)) return;
    const res = await api.delete(`/ordenes/${id_ot}`);
    if (res.ok) {
      Toast.show('Orden de Trabajo eliminada.', 'success');
      cargarOrdenes();
    } else {
      Toast.show(res.data.mensaje || 'Error al eliminar OT.', 'error');
    }
  };

  window.generarFacturaDesdeOT = async (id_ot) => {
    if (!confirm(`Generar factura para la OT ${id_ot}?`)) return;
    const res = await api.post('/facturas/generar', { id_unico_ot: id_ot });
    if (res.ok) {
      Toast.show('Factura generada exitosamente.', 'success');
      Router.navigate('facturas');
    } else {
      Toast.show(res.data.mensaje || 'Error al generar factura.', 'error');
    }
  };
};

// Modal crear OT
window.abrirModalOrden = async function (datos, onSuccess, vehiculoPrefill = null) {
  // Cargar clientes para el select
  const resClientes = await api.get('/clientes');
  if (!resClientes.ok) {
    Toast.show('Error al cargar clientes.', 'error');
    return;
  }
  const clientes = resClientes.data.clientes;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:680px;">
      <div class="modal-header">
        <span class="modal-title">Nueva Orden de Trabajo</span>
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
          <label class="form-label">Cliente</label>
          <select class="form-control" id="id_cliente">
            <option value="">Selecciona un cliente...</option>
            ${clientes.map(c => `
              <option value="${c.id_cliente}">${c.nombre_completo} — ${c.cedula_rnc}</option>
            `).join('')}
          </select>
        </div>

        <div style="border:1px solid var(--border); border-radius:var(--radius-md);
                    padding:var(--spacing-md); margin-bottom:var(--spacing-md);">
          <div style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);
                      margin-bottom:var(--spacing-md); text-transform:uppercase;
                      letter-spacing:0.5px;">
            Datos del Vehiculo
          </div>
          <div style="display:flex; gap:var(--spacing-sm); margin-bottom:var(--spacing-md);">
            <input type="text" class="form-control font-mono" id="vin"
                   placeholder="VIN (17 caracteres)"
                   maxlength="17"
                   style="text-transform:uppercase; flex:1;"
                   value="${vehiculoPrefill ? vehiculoPrefill.vin : ''}" />
            <button class="btn btn-secondary btn-sm" id="btn-decodificar-vin"
                    style="white-space:nowrap;">
              Decodificar VIN
            </button>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Marca</label>
              <input type="text" class="form-control" id="marca"
                     placeholder="HONDA"
                     value="${vehiculoPrefill ? vehiculoPrefill.marca : ''}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Modelo</label>
              <input type="text" class="form-control" id="modelo"
                     placeholder="Civic"
                     value="${vehiculoPrefill ? vehiculoPrefill.modelo : ''}" />
            </div>
          </div>
          <div class="form-row form-row-2" style="margin-top:var(--spacing-md);">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Año</label>
              <input type="number" class="form-control" id="anio"
                     placeholder="2020" min="1900" max="2099"
                     value="${vehiculoPrefill ? vehiculoPrefill.anio : ''}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Placa</label>
              <input type="text" class="form-control font-mono" id="placa"
                     placeholder="A123456"
                     style="text-transform:uppercase;" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descripcion del Trabajo</label>
          <textarea class="form-control" id="descripcion_trabajo" rows="3"
                    placeholder="Describe el trabajo a realizar..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            Mecanico Asignado
            <span style="color:var(--text-disabled);">(opcional)</span>
          </label>
          <input type="text" class="form-control" id="mecanico_asignado"
                 placeholder="Nombre del mecanico responsable" />
        </div>

        <div id="form-error" class="alert alert-danger hidden"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        <button class="btn btn-primary" id="btn-guardar">Crear Orden de Trabajo</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => modal.remove();
  document.getElementById('modal-close').addEventListener('click', cerrar);
  document.getElementById('btn-cancelar').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  // Decodificar VIN desde el modal
  document.getElementById('btn-decodificar-vin').addEventListener('click', async () => {
    const vin = document.getElementById('vin').value.trim().toUpperCase();
    if (vin.length !== 17) {
      Toast.show('El VIN debe tener 17 caracteres.', 'warning');
      return;
    }
    const res = await api.get(`/vehiculos/vin/${vin}`);
    if (res.ok) {
      const v = res.data.vehiculo;
      document.getElementById('marca').value  = v.marca  !== 'No disponible' ? v.marca  : '';
      document.getElementById('modelo').value = v.modelo !== 'No disponible' ? v.modelo : '';
      document.getElementById('anio').value   = v.anio   !== 'No disponible' ? v.anio   : '';
      Toast.show('Datos del vehiculo cargados exitosamente.', 'success');
    } else {
      Toast.show(res.data.mensaje || 'No se pudo decodificar el VIN.', 'error');
    }
  });

  // Forzar mayusculas en VIN y placa
  document.getElementById('vin').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });
  document.getElementById('placa').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const errorEl = document.getElementById('form-error');

    const body = {
      id_cliente:          parseInt(document.getElementById('id_cliente').value),
      vin:                 document.getElementById('vin').value.trim(),
      placa:               document.getElementById('placa').value.trim(),
      marca:               document.getElementById('marca').value.trim(),
      modelo:              document.getElementById('modelo').value.trim(),
      anio:                parseInt(document.getElementById('anio').value),
      descripcion_trabajo: document.getElementById('descripcion_trabajo').value.trim(),
      mecanico_asignado:   document.getElementById('mecanico_asignado').value.trim() || null,
    };

    if (!body.id_cliente || !body.vin || !body.placa || !body.marca ||
        !body.modelo || !body.anio || !body.descripcion_trabajo) {
      errorEl.textContent = 'Todos los campos obligatorios deben estar completos.';
      errorEl.classList.remove('hidden');
      return;
    }

    if (body.vin.length !== 17) {
      errorEl.textContent = 'El VIN debe tener exactamente 17 caracteres.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');

    const res = await api.post('/ordenes', body);

    if (res.ok) {
      Toast.show('Orden de Trabajo creada exitosamente.', 'success');
      cerrar();
      if (onSuccess) onSuccess();

      // Preguntar si desea agregar piezas
      setTimeout(() => {
        if (confirm(`OT ${res.data.orden.id_unico_ot} creada. Deseas agregar piezas ahora?`)) {
          abrirModalDetalleOT(
            { orden: res.data.orden, piezas: [] },
            onSuccess
          );
        }
      }, 300);
    } else {
      errorEl.textContent = res.data.mensaje || 'Error al crear la orden.';
      errorEl.classList.remove('hidden');
    }
  });
};

// Modal detalle OT con piezas
function abrirModalDetalleOT(data, onSuccess) {
  const { orden, piezas } = data;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:760px;">
      <div class="modal-header">
        <span class="modal-title">OT: ${orden.id_unico_ot}</span>
        <button class="modal-close" id="modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">

        <!-- Info OT -->
        <div style="display:grid; grid-template-columns:repeat(2,1fr);
                    gap:var(--spacing-md); margin-bottom:var(--spacing-lg);">
          <div>
            <div class="form-label">Cliente</div>
            <div style="color:var(--text-primary); font-weight:500;">
              ${orden.nombre_cliente}
            </div>
          </div>
          <div>
            <div class="form-label">Estado</div>
            <div>
              <span class="badge badge-${(orden.estado || '').toLowerCase().replace(' ','-')}">
                ${orden.estado}
              </span>
            </div>
          </div>
          <div>
            <div class="form-label">Vehiculo</div>
            <div style="color:var(--text-primary);">
              ${orden.marca} ${orden.modelo} ${orden.anio}
            </div>
          </div>
          <div>
            <div class="form-label">Placa</div>
            <div class="font-mono" style="color:var(--accent);">${orden.placa}</div>
          </div>
          <div style="grid-column:1/-1;">
            <div class="form-label">Descripcion</div>
            <div style="color:var(--text-secondary);">${orden.descripcion_trabajo}</div>
          </div>
        </div>

        <hr class="divider">

        <!-- Piezas asociadas -->
        <div style="display:flex; justify-content:space-between; align-items:center;
                    margin-bottom:var(--spacing-md);">
          <span style="font-weight:600; color:var(--text-primary);">Piezas Utilizadas</span>
          ${orden.estado !== 'Completada' && orden.estado !== 'Cancelada' ? `
          <button class="btn btn-primary btn-sm" id="btn-agregar-pieza">
            Agregar Pieza
          </button>
          ` : ''}
        </div>

        <div id="lista-piezas">
          ${renderPiezasOT(piezas)}
        </div>

        <div id="agregar-pieza-form" class="hidden"
             style="margin-top:var(--spacing-md); padding:var(--spacing-md);
                    border:1px solid var(--border); border-radius:var(--radius-md);">
          <div style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);
                      margin-bottom:var(--spacing-md); text-transform:uppercase;">
            Agregar Pieza
          </div>
          <div style="display:flex; gap:var(--spacing-md); align-items:flex-end; flex-wrap:wrap;">
            <div class="form-group" style="flex:1; min-width:180px; margin-bottom:0;">
              <label class="form-label">Pieza</label>
              <select class="form-control" id="select-pieza">
                <option value="">Cargando...</option>
              </select>
            </div>
            <div class="form-group" style="width:100px; margin-bottom:0;">
              <label class="form-label">Cantidad</label>
              <input type="number" class="form-control" id="cantidad-pieza"
                     min="1" value="1" />
            </div>
            <button class="btn btn-primary btn-sm" id="btn-confirmar-pieza"
                    style="padding:10px var(--spacing-md);">
              Agregar
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-cancelar-pieza"
                    style="padding:10px var(--spacing-md);">
              Cancelar
            </button>
          </div>
          <div id="pieza-error" class="alert alert-danger hidden"
               style="margin-top:var(--spacing-md); margin-bottom:0;"></div>
        </div>

        <!-- Total -->
        <div id="total-ot" style="margin-top:var(--spacing-lg); text-align:right;">
          ${calcularTotalOT(piezas)}
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cerrar">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => {
    modal.remove();
    if (onSuccess) onSuccess();
  };

  document.getElementById('modal-close').addEventListener('click', cerrar);
  document.getElementById('btn-cerrar').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  // Cargar piezas del inventario para el select
  const btnAgregarPieza = document.getElementById('btn-agregar-pieza');
  if (btnAgregarPieza) {
    btnAgregarPieza.addEventListener('click', async () => {
      const form = document.getElementById('agregar-pieza-form');
      form.classList.remove('hidden');

      const resInv = await api.get('/inventario');
      if (resInv.ok) {
        const select = document.getElementById('select-pieza');
        const piezasDisponibles = resInv.data.piezas.filter(p => p.stock_actual > 0);
        select.innerHTML = `
          <option value="">Selecciona una pieza...</option>
          ${piezasDisponibles.map(p => `
            <option value="${p.id_pieza}">
              [${p.codigo_sku}] ${p.nombre} — Stock: ${p.stock_actual}
              — RD$ ${parseFloat(p.precio_venta).toLocaleString('es-DO')}
            </option>
          `).join('')}
        `;
      }
    });
  }

  document.getElementById('btn-cancelar-pieza')?.addEventListener('click', () => {
    document.getElementById('agregar-pieza-form').classList.add('hidden');
  });

  document.getElementById('btn-confirmar-pieza')?.addEventListener('click', async () => {
    const id_pieza = parseInt(document.getElementById('select-pieza').value);
    const cantidad = parseInt(document.getElementById('cantidad-pieza').value);
    const errorEl  = document.getElementById('pieza-error');

    if (!id_pieza) {
      errorEl.textContent = 'Selecciona una pieza.';
      errorEl.classList.remove('hidden');
      return;
    }

    if (!cantidad || cantidad < 1) {
      errorEl.textContent = 'La cantidad debe ser mayor a 0.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');

    const res = await api.post('/ordenes/agregar-pieza', {
      id_ot:    orden.id_unico_ot,
      id_pieza,
      cantidad,
    });

    if (res.ok) {
      Toast.show('Pieza agregada exitosamente.', 'success');

      if (res.data.alerta_stock?.activa) {
        Toast.show(res.data.alerta_stock.mensaje, 'warning');
      }

      // Recargar piezas de la OT
      const resDetalle = await api.get(`/ordenes/${orden.id_unico_ot}`);
      if (resDetalle.ok) {
        const nuevasPiezas = resDetalle.data.piezas;
        document.getElementById('lista-piezas').innerHTML = renderPiezasOT(nuevasPiezas);
        document.getElementById('total-ot').innerHTML = calcularTotalOT(nuevasPiezas);
      }

      document.getElementById('agregar-pieza-form').classList.add('hidden');
    } else {
      errorEl.textContent = res.data.mensaje || 'Error al agregar pieza.';
      errorEl.classList.remove('hidden');
    }
  });
}

function renderPiezasOT(piezas) {
  if (!piezas || piezas.length === 0) {
    return `<p style="color:var(--text-disabled); text-align:center;
                      padding:var(--spacing-md);">
              No hay piezas agregadas a esta orden.
            </p>`;
  }

  return `
    <div class="table-container" style="border:none;">
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
              <td class="font-mono" style="font-size:0.8rem; color:var(--accent);">
                ${p.codigo_sku}
              </td>
              <td style="color:var(--text-primary);">${p.nombre_pieza}</td>
              <td style="text-align:center;">${p.cantidad_pieza}</td>
              <td>RD$ ${parseFloat(p.precio_venta).toLocaleString('es-DO',
                {minimumFractionDigits:2})}</td>
              <td style="font-weight:600; color:var(--text-primary);">
                RD$ ${parseFloat(p.subtotal).toLocaleString('es-DO',
                  {minimumFractionDigits:2})}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function calcularTotalOT(piezas) {
  if (!piezas || piezas.length === 0) return '';

  const subtotal = piezas.reduce((acc, p) => acc + parseFloat(p.subtotal), 0);
  const itbis    = subtotal * 0.18;
  const total    = subtotal + itbis;

  return `
    <div style="display:inline-flex; flex-direction:column; gap:var(--spacing-sm);
                min-width:240px; text-align:right;">
      <div style="display:flex; justify-content:space-between; gap:var(--spacing-xl);">
        <span style="color:var(--text-secondary);">Subtotal</span>
        <span style="color:var(--text-primary);">
          RD$ ${subtotal.toLocaleString('es-DO', {minimumFractionDigits:2})}
        </span>
      </div>
      <div style="display:flex; justify-content:space-between; gap:var(--spacing-xl);">
        <span style="color:var(--text-secondary);">ITBIS (18%)</span>
        <span style="color:var(--text-primary);">
          RD$ ${itbis.toLocaleString('es-DO', {minimumFractionDigits:2})}
        </span>
      </div>
      <hr class="divider" style="margin:4px 0;">
      <div style="display:flex; justify-content:space-between; gap:var(--spacing-xl);">
        <span style="color:var(--accent); font-weight:700;">Total</span>
        <span style="color:var(--accent); font-weight:700; font-size:1.1rem;">
          RD$ ${total.toLocaleString('es-DO', {minimumFractionDigits:2})}
        </span>
      </div>
    </div>
  `;
}

// Modal cambiar estado
function abrirModalEstado(id_ot, estadoActual, onSuccess) {
  const estados = ['Pendiente', 'En Proceso', 'Completada', 'Cancelada'];

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:400px;">
      <div class="modal-header">
        <span class="modal-title">Cambiar Estado — ${id_ot}</span>
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
          <label class="form-label">Nuevo Estado</label>
          <select class="form-control" id="nuevo-estado">
            ${estados.map(e => `
              <option value="${e}" ${e === estadoActual ? 'selected' : ''}>${e}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        <button class="btn btn-primary" id="btn-guardar">Guardar Estado</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => modal.remove();
  document.getElementById('modal-close').addEventListener('click', cerrar);
  document.getElementById('btn-cancelar').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const estado = document.getElementById('nuevo-estado').value;
    const res = await api.patch(`/ordenes/${id_ot}/estado`, { estado });
    if (res.ok) {
      Toast.show(`Estado actualizado a "${estado}" exitosamente.`, 'success');
      cerrar();
      if (onSuccess) onSuccess();
    } else {
      Toast.show(res.data.mensaje || 'Error al actualizar estado.', 'error');
    }
  });
}