/**
 * @file usuarios.js
 * @description Vista de gestion de usuarios del sistema.
 * Solo accesible por administradores.
 */

Views.usuarios = async () => {
  const contentArea = document.getElementById('content-area');

  contentArea.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">Usuarios</h2>
        <p class="page-subtitle">Gestion de accesos al sistema</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-usuario">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nuevo Usuario
      </button>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-usuarios">
          <tr>
            <td colspan="6" class="text-center">
              <div class="spinner" style="margin: var(--spacing-lg) auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nuevo/editar usuario -->
    <div class="modal-overlay hidden" id="modal-usuario">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-usuario-titulo">Nuevo Usuario</h3>
          <button class="modal-close" id="btn-cerrar-modal-usuario">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-control" id="nombre-usuario"
                   placeholder="Nombre completo del usuario">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="email-usuario"
                   placeholder="correo@taller.com">
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Contrasena</label>
              <input type="password" class="form-control" id="password-usuario"
                     placeholder="Minimo 6 caracteres">
              <p class="form-hint" id="hint-password">Deja en blanco para no cambiar.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select class="form-control" id="rol-usuario">
                <option value="empleado">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancelar-usuario">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-usuario">Guardar Usuario</button>
        </div>
      </div>
    </div>
  `;

  let usuarioEditandoId = null;

  const cargarUsuarios = async () => {
    try {
      const data = await Api.getUsuarios();
      renderTabla(data.usuarios);
    } catch (error) {
      Toast.error('Error al cargar usuarios: ' + error.message);
    }
  };

  const renderTabla = (usuarios) => {
    const tbody = document.getElementById('tabla-usuarios');

    if (usuarios.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state"><p>No hay usuarios registrados.</p></div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>
          <span class="badge ${u.rol === 'admin' ? 'badge-proceso' : 'badge-completada'}">
            ${u.rol === 'admin' ? 'Administrador' : 'Empleado'}
          </span>
        </td>
        <td>
          <span class="badge ${u.activo ? 'badge-completada' : 'badge-cancelada'}">
            ${u.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>${new Date(u.fecha_registro).toLocaleDateString('es-DO')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editarUsuario(${u.id_usuario})">
              Editar
            </button>
            <button class="btn ${u.activo ? 'btn-warning' : 'btn-success'} btn-sm"
                    onclick="toggleUsuario(${u.id_usuario}, ${u.activo})">
              ${u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  // Abrir modal nuevo usuario
  document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
    usuarioEditandoId = null;
    document.getElementById('modal-usuario-titulo').textContent = 'Nuevo Usuario';
    document.getElementById('nombre-usuario').value   = '';
    document.getElementById('email-usuario').value    = '';
    document.getElementById('password-usuario').value = '';
    document.getElementById('rol-usuario').value      = 'empleado';
    document.getElementById('hint-password').classList.add('hidden');
    document.getElementById('modal-usuario').classList.remove('hidden');
  });

  const cerrarModal = () => {
    document.getElementById('modal-usuario').classList.add('hidden');
    usuarioEditandoId = null;
  };

  document.getElementById('btn-cerrar-modal-usuario').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar-usuario').addEventListener('click', cerrarModal);

  // Guardar usuario
  document.getElementById('btn-guardar-usuario').addEventListener('click', async () => {
    const nombre   = document.getElementById('nombre-usuario').value.trim();
    const email    = document.getElementById('email-usuario').value.trim();
    const password = document.getElementById('password-usuario').value;
    const rol      = document.getElementById('rol-usuario').value;

    if (!nombre || !email) {
      Toast.error('Nombre y email son obligatorios.');
      return;
    }

    if (!usuarioEditandoId && !password) {
      Toast.error('La contrasena es obligatoria para nuevos usuarios.');
      return;
    }

    const body = { nombre, email, rol };
    if (password) body.password = password;

    try {
      if (usuarioEditandoId) {
        await Api.editarUsuario(usuarioEditandoId, body);
        Toast.success('Usuario actualizado exitosamente.');
      } else {
        await Api.crearUsuario(body);
        Toast.success('Usuario creado exitosamente.');
      }
      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      Toast.error(error.message);
    }
  });

  // Editar usuario
  window.editarUsuario = async (id) => {
    try {
      const data    = await Api.getUsuario(id);
      const usuario = data.usuario;
      usuarioEditandoId = id;

      document.getElementById('modal-usuario-titulo').textContent = 'Editar Usuario';
      document.getElementById('nombre-usuario').value   = usuario.nombre;
      document.getElementById('email-usuario').value    = usuario.email;
      document.getElementById('password-usuario').value = '';
      document.getElementById('rol-usuario').value      = usuario.rol;
      document.getElementById('hint-password').classList.remove('hidden');
      document.getElementById('modal-usuario').classList.remove('hidden');
    } catch (error) {
      Toast.error('Error al cargar el usuario.');
    }
  };

  // Activar/Desactivar usuario
  window.toggleUsuario = async (id, activo) => {
    const accion = activo ? 'desactivar' : 'activar';
    if (!confirm(`Deseas ${accion} este usuario?`)) return;
    try {
      await Api.toggleUsuario(id);
      Toast.success(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente.`);
      cargarUsuarios();
    } catch (error) {
      Toast.error(error.message);
    }
  };

  cargarUsuarios();
};