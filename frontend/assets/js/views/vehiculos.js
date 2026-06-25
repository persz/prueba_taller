/**
 * @file vehiculos.js
 * @description Vista de consulta de vehiculos por VIN.
 */

Views.vehiculos = async () => {
  const contentArea = document.getElementById('content-area');

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Consulta de Vehiculos</h2>
        <p class="page-subtitle">Busca un vehiculo por su VIN o numero de chasis</p>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-header">
        <h3 class="card-title">Decodificar VIN</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">VIN / Numero de Chasis</label>
          <div style="display: flex; gap: var(--spacing-md);">
            <input type="text" class="form-control" id="input-vin"
                   placeholder="Ej: 1HGBH41JXMN109186"
                   maxlength="17"
                   style="text-transform: uppercase;">
            <button class="btn btn-primary" id="btn-buscar-vin">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar
            </button>
          </div>
          <p class="form-hint">El VIN debe tener exactamente 17 caracteres.</p>
        </div>
      </div>
    </div>

    <div id="resultado-vin" class="hidden" style="max-width: 600px; margin-top: var(--spacing-lg);">
    </div>
  `;

  document.getElementById('btn-buscar-vin').addEventListener('click', async () => {
    const vin    = document.getElementById('input-vin').value.trim().toUpperCase();
    const btnBuscar = document.getElementById('btn-buscar-vin');
    const resultado = document.getElementById('resultado-vin');

    if (vin.length !== 17) {
      Toast.error('El VIN debe tener exactamente 17 caracteres.');
      return;
    }

    btnBuscar.disabled     = true;
    btnBuscar.textContent  = 'Buscando...';
    resultado.classList.add('hidden');

    try {
      const data     = await Api.decodificarVIN(vin);
      const vehiculo = data.vehiculo;

      resultado.classList.remove('hidden');
      resultado.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Informacion del Vehiculo</h3>
            <span class="badge badge-completada">Encontrado</span>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
              <div>
                <p class="form-label">VIN</p>
                <p class="font-mono" style="color: var(--accent); margin: 0;">${vehiculo.vin}</p>
              </div>
              <div>
                <p class="form-label">Marca</p>
                <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${vehiculo.marca}</p>
              </div>
              <div>
                <p class="form-label">Modelo</p>
                <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${vehiculo.modelo}</p>
              </div>
              <div>
                <p class="form-label">Año</p>
                <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${vehiculo.anio}</p>
              </div>
              <div>
                <p class="form-label">Tipo</p>
                <p style="color: var(--text-primary); margin: 0; font-weight: 600;">${vehiculo.tipo}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      resultado.classList.remove('hidden');
      resultado.innerHTML = `
        <div class="alert alert-danger">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${error.message}</span>
        </div>
      `;
    } finally {
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Buscar
      `;
    }
  });

  // Buscar al presionar Enter
  document.getElementById('input-vin').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btn-buscar-vin').click();
    }
  });
};