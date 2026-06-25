/**
 * @file inventario.js
 * @description Vista de gestion de inventario de piezas.
 */

Views.inventario = async () => {
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
               stroke="currentColor" stroke-width="2">
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
        <input type="text" class="form-control" id="search-inventario"
               placeholder="Buscar por nombre, SKU o categoria...">
      </div>
      <button class="btn btn-secondary" id="btn-bajo-stock">
        Ver Stock Critico
      </button>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoria</th>
            <th>Stock Actual</th>
            <th>Stock Minimo</th>
            <th>Precio Venta</th>
            <th>Estado</th>
            ${esAdmin ? '<th>Acciones</th>' : ''}
          </tr>
        </thead>
        <tbody id="tabla-inventario">
          <tr>
            <td colspan="${esAdmin ? 8 : 7}" class="text-center">
              <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nueva/editar pieza -->
    ${esAdmin ? `
      <div class="modal-overlay hidden" id="modal-pieza">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-pieza-titulo">Nueva Pieza</h3>
            <button class="modal-close" id="btn-cerrar-modal-pieza">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Codigo SKU</label>
                <input type="text" class="form-control" id="codigo-sku"
                       placeholder="Ej: FRE-001">
              </div>
              <div class="form-group">
                <label class="form-label">Categoria</label>
                <input type="text" class="form-control" id="categoria-tipo"
                       placeholder="Ej: Frenos, Motor">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nombre de la Pieza</label>
              <input type="text" class="form-control" id="nombre-pieza"
                     placeholder="Descripcion completa de la pieza">
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Stock Actual</label>
                <input type="number" class="form-control" id="stock-actual"
                       placeholder="0" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Stock Minimo</label>
                <input type="number" class="form-control" id="stock-minimo"
                       placeholder="5" min="0">
              </div>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Precio Costo (RD$)</label>
                <input type="number" class="form-control" id="precio-costo"
                       placeholder="0.00" min="0" step="0.01">
              </div>
              <div class="form-group">
                <label class="form-label">Precio Venta (RD$)</label>
                <input type="number" class="form-control" id="precio-venta"
                       placeholder="0.00" min="0" step="0.01">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancelar-pieza">Cancelar</button>
            <button class="btn btn-primary" id="btn-guardar-pieza">Guardar Pieza</button>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  let piezaEditandoId   = null;
  let todasLasPiezas    = [];
  let viendoBajoStock   = false;

  const cargarPiezas = async () => {
    try {
      const data     = await Api.getPiezas();
      todasLasPiezas = data.piezas;
      viendoBajoStock = false;
      document.getElementById('btn-bajo-stock').textContent = 'Ver Stock Critico';
      renderTabla(todasLasPiezas);
    } catch (error) {
      Toast.error('Error al cargar inventario: ' + error.message);
    }
  };

  const renderTabla = (piezas) => {
    const tbody   = document.getElementById('tabla-inventario');
    const cols    = esAdmin ? 8 : 7;

    if (piezas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${cols}">
            <div class="empty-state"><p>No se encontraron piezas.</p></div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = piezas.map(p => {
      const stockCritico = parseInt(p.stock_actual) <= parseInt(p.stock_minimo);
      return `
        <tr>
          <td class="font-mono">${p.codigo_sku}</td>
          <td>${p.nombre}</td>
          <td>${p.categoria_tipo}</td>
          <td style="color: ${stockCritico ? 'var(--accent-danger)' : 'var(--accent-success)'}; font-weight: 700;">
            ${p.stock_actual}
          </td>
          <td>${p.stock_minimo}</td>
          <td>RD$ ${parseFloat(p.precio_venta).toLocaleString('es-DO')}</td>
          <td>
            <span class="badge ${stockCritico ? 'badge-cancelada' : 'badge-completada'}">
              ${stockCritico ? 'Stock Critico' : 'Normal'}
            </span>
          </td>
          ${esAdmin ? `
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-sm" onclick="editarPieza(${p.id_pieza})">
                  Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarPieza(${p.id_pieza}, '${p.nombre}')">
                  Eliminar
                </button>
              </div>
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  };

  // Busqueda
  document.getElementById('search-inventario').addEventListener('input', async (e) => {
    const termino = e.target.value.trim();
    if (termino.length === 0) {
      renderTabla(todasLasPiezas);
      return;
    }
    if (termino.length < 2) return;
    try {
      const data = await Api.buscarPiezas(termino);
      renderTabla(data.piezas);
    } catch (error) {
      Toast.error('Error en la busqueda.');
    }
  });

  // Ver stock critico
  document.getElementById('btn-bajo-stock').addEventListener('click', async () => {
    if (viendoBajoStock) {
      viendoBajoStock = false;
      document.getElementById('btn-bajo-stock').textContent = 'Ver Stock Critico';
      renderTabla(todasLasPiezas);
      return;
    }
    try {
      const data = await Api.getBajoStock();
      viendoBajoStock = true;
      document.getElementById('btn-bajo-stock').textContent = 'Ver Todo';
      renderTabla(data.piezas);
    } catch (error) {
      Toast.error('Error al cargar stock critico.');
    }
  });

  if (esAdmin) {
    // Abrir modal nueva pieza
    document.getElementById('btn-nueva-pieza').addEventListener('click', () => {
      piezaEditandoId = null;
      document.getElementById('modal-pieza-titulo').textContent = 'Nueva Pieza';
      document.getElementById('codigo-sku').value    = '';
      document.getElementById('categoria-tipo').value = '';
      document.getElementById('nombre-pieza').value  = '';
      document.getElementById('stock-actual').value  = '';
      document.getElementById('stock-minimo').value  = '';
      document.getElementById('precio-costo').value  = '';
      document.getElementById('precio-venta').value  = '';
      document.getElementById('modal-pieza').classList.remove('hidden');
    });

    const cerrarModal = () => {
      document.getElementById('modal-pieza').classList.add('hidden');
      piezaEditandoId = null;
    };

    document.getElementById('btn-cerrar-modal-pieza').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-pieza').addEventListener('click', cerrarModal);

    document.getElementById('btn-guardar-pieza').addEventListener('click', async () => {
      const body = {
        codigo_sku:    document.getElementById('codigo-sku').value.trim(),
        nombre:        document.getElementById('nombre-pieza').value.trim(),
        categoria_tipo: document.getElementById('categoria-tipo').value.trim(),
        stock_actual:  parseFloat(document.getElementById('stock-actual').value),
        stock_minimo:  parseFloat(document.getElementById('stock-minimo').value),
        precio_costo:  parseFloat(document.getElementById('precio-costo').value),
        precio_venta:  parseFloat(document.getElementById('precio-venta').value),
      };

      if (!body.codigo_sku || !body.nombre || !body.categoria_tipo) {
        Toast.error('SKU, nombre y categoria son obligatorios.');
        return;
      }

      try {
        if (piezaEditandoId) {
          await Api.editarPieza(piezaEditandoId, body);
          Toast.success('Pieza actualizada exitosamente.');
        } else {
          await Api.crearPieza(body);
          Toast.success('Pieza agregada al inventario.');
        }
        cerrarModal();
        cargarPiezas();
      } catch (error) {
        Toast.error(error.message);
      }
    });

    window.editarPieza = async (id) => {
      try {
        const data  = await Api.getPieza(id);
        const pieza = data.pieza;
        piezaEditandoId = id;

        document.getElementById('modal-pieza-titulo').textContent = 'Editar Pieza';
        document.getElementById('codigo-sku').value    = pieza.codigo_sku;
        document.getElementById('categoria-tipo').value = pieza.categoria_tipo;
        document.getElementById('nombre-pieza').value  = pieza.nombre;
        document.getElementById('stock-actual').value  = pieza.stock_actual;
        document.getElementById('stock-minimo').value  = pieza.stock_minimo;
        document.getElementById('precio-costo').value  = pieza.precio_costo;
        document.getElementById('precio-venta').value  = pieza.precio_venta;
        document.getElementById('modal-pieza').classList.remove('hidden');
      } catch (error) {
        Toast.error('Error al cargar la pieza.');
      }
    };

    window.eliminarPieza = async (id, nombre) => {
      if (!confirm(`Deseas eliminar la pieza "${nombre}"?`)) return;
      try {
        await Api.eliminarPieza(id);
        Toast.success('Pieza eliminada exitosamente.');
        cargarPiezas();
      } catch (error) {
        Toast.error(error.message);
      }
    };
  }

  cargarPiezas();
};