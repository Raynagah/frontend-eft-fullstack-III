<template>
  <div class="admin-container">
    <div class="admin-content">
      
      <button @click="router.push('/admin')" class="btn-back" title="Volver al Dashboard">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver al Dashboard
      </button>

      <div class="page-header">
        <div>
          <h1 class="main-title">Panel de Administración de Usuarios</h1>
          <p class="subtitle">Gestiona los accesos, roles y datos de los usuarios de la plataforma.</p>
        </div>
        <button @click="irCrearUsuario" class="btn btn-primary">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Nuevo Usuario
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div>
            <p class="stat-label">Total Usuarios</p>
            <p class="stat-value text-blue">{{ store.totalUsuarios }}</p>
          </div>
          <div class="stat-icon bg-blue-light text-blue">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
        </div>
        <div class="stat-card">
          <div>
            <p class="stat-label">Administradores</p>
            <p class="stat-value text-purple">{{ store.totalAdministradores }}</p>
          </div>
          <div class="stat-icon bg-purple-light text-purple">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
        </div>
        <div class="stat-card">
          <div>
            <p class="stat-label">Clientes</p>
            <p class="stat-value text-green">{{ store.totalClientes }}</p>
          </div>
          <div class="stat-icon bg-green-light text-green">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
        </div>
      </div>

      <div v-if="store.cargando" class="state-container loading">
        <div class="spinner"></div>
        <span>Cargando información del sistema...</span>
      </div>
      <div v-else-if="store.error" class="state-container error">
        <svg class="icon text-red" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
        <div>
          <strong>Error de conexión</strong>
          <p>{{ store.error }}</p>
        </div>
      </div>

      <div v-else class="table-card">
        <div class="table-header">
          <h2>Directorio Oficial de Usuarios</h2>
          
          <div class="controls-bar">
            
            <div class="control-group">
              <label>Filtrar por:</label>
              <select v-model="filtroRol" class="custom-select">
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="cliente">Cliente</option>
              </select>
              <select v-model="filtroOcupacion" class="custom-select">
                <option value="">Todas las ocupaciones</option>
                <option v-for="ocupacion in ocupacionesUnicas" :key="ocupacion" :value="ocupacion">
                  {{ ocupacion }}
                </option>
              </select>
            </div>

            <div class="control-group">
              <label>Ordenar por:</label>
              <select v-model="criterioOrden" class="custom-select sort-select">
                <option value="nombre_asc">Nombre (A-Z)</option>
                <option value="nombre_desc">Nombre (Z-A)</option>
                <option value="tipoUsuario_asc">Rol (Admin primero)</option>
                <option value="tipoUsuario_desc">Rol (Cliente primero)</option>
                <option value="ocupacion_asc">Ocupación (A-Z)</option>
                <option value="reportes_desc">Más Reportes</option>
                <option value="reportes_asc">Menos Reportes</option>
              </select>
            </div>

          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Ocupación</th>
                <th class="text-center">Reportes</th>
                <th class="text-center">Rol</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usuario in usuariosProcesados" :key="usuario.id">
                <td class="col-id">#{{ String(usuario.id).padStart(4, '0') }}</td>
                <td class="col-name">{{ usuario.nombre }}</td>
                <td>
                  <div class="col-email">{{ usuario.correo }}</div>
                  <div class="col-phone">{{ usuario.telefono || 'Sin teléfono' }}</div>
                </td>
                <td class="col-ocupacion">{{ usuario.ocupacion || 'No especificada' }}</td>
                <td class="text-center font-bold text-blue">{{ usuario.cantidadReportes || 0 }}</td>
                <td class="text-center">
                  <span :class="['role-badge', usuario.tipoUsuario === 'admin' ? 'badge-admin' : 'badge-client']">
                    {{ usuario.tipoUsuario === 'admin' ? 'Admin' : 'Cliente' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button @click="irEditarUsuario(usuario.id)" class="btn-action btn-edit" title="Editar">
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button @click="abrirModalEliminar(usuario)" class="btn-action btn-delete" title="Eliminar">
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="usuariosProcesados.length === 0">
                <td colspan="7" class="empty-row">
                  <p>No se encontraron usuarios con esos criterios.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-body">
          <div class="modal-alert-icon">
            <svg class="icon-xl" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div class="modal-text">
            <h3>Eliminar cuenta de usuario</h3>
            <p>¿Está completamente seguro de que desea eliminar al usuario <strong>{{ usuarioSeleccionado?.nombre }}</strong>?</p>
            <div class="user-pill-info">{{ usuarioSeleccionado?.correo }}</div>
            <p class="modal-warning-text">Esta acción es irreversible.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModal" class="btn btn-secondary" :disabled="eliminando">Cancelar</button>
          <button @click="ejecutarEliminacion" class="btn btn-danger" :disabled="eliminando">
            <span v-if="eliminando" class="loader-inline"></span>
            {{ eliminando ? 'Eliminando...' : 'Confirmar y Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore';

const store = useUsuarioAdminStore();
const router = useRouter(); 

const mostrarModal = ref(false);
const usuarioSeleccionado = ref(null);
const eliminando = ref(false);

// Variables de Control (Filtros y Ordenamiento)
const filtroRol = ref('');
const filtroOcupacion = ref('');
const criterioOrden = ref('nombre_asc'); // Valor por defecto

onMounted(() => {
  store.cargarUsuarios();
});

// Extrae ocupaciones únicas para el filtro
const ocupacionesUnicas = computed(() => {
  if (!store.usuarios) return [];
  const ocupaciones = store.usuarios
    .map(u => u.ocupacion)
    .filter(ocupacion => ocupacion && ocupacion.trim() !== '');
  return [...new Set(ocupaciones)].sort();
});

// El Motor Principal: Filtra y luego Ordena
const usuariosProcesados = computed(() => {
  if (!store.usuarios) return [];
  
  let resultado = [...store.usuarios];

  // 1. Aplicar Filtros
  if (filtroRol.value !== '') {
    resultado = resultado.filter(u => u.tipoUsuario === filtroRol.value);
  }
  if (filtroOcupacion.value !== '') {
    resultado = resultado.filter(u => u.ocupacion === filtroOcupacion.value);
  }

  // 2. Aplicar Ordenamiento Múltiple
  resultado.sort((a, b) => {
    const [campo, direccion] = criterioOrden.value.split('_');
    let valorA, valorB;

    // Asignación de valores según el campo seleccionado
    if (campo === 'reportes') {
      valorA = a.cantidadReportes || 0;
      valorB = b.cantidadReportes || 0;
    } else if (campo === 'ocupacion') {
      valorA = (a.ocupacion || 'Z_Sin especificar').toLowerCase();
      valorB = (b.ocupacion || 'Z_Sin especificar').toLowerCase();
    } else {
      valorA = (a[campo] || '').toString().toLowerCase();
      valorB = (b[campo] || '').toString().toLowerCase();
    }

    // Lógica de comparación
    if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
    if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
    return 0;
  });

  return resultado;
});

// Funciones de navegación y modal...
const irCrearUsuario = () => router.push('/admin/usuarios/nuevo');
const irEditarUsuario = (id) => router.push(`/admin/usuarios/editar/${id}`);
const abrirModalEliminar = (usuario) => { usuarioSeleccionado.value = usuario; mostrarModal.value = true; };
const cerrarModal = () => { mostrarModal.value = false; usuarioSeleccionado.value = null; };

const ejecutarEliminacion = async () => {
  if (!usuarioSeleccionado.value) return;
  eliminando.value = true;
  try {
    await store.eliminarUsuario(usuarioSeleccionado.value.id);
    cerrarModal();
  } catch (error) {
    console.error("Falló la eliminación", error);
  } finally {
    eliminando.value = false;
  }
};
</script>

<style scoped>
/* --- VARIABLES Y CONFIGURACIÓN BASE --- */
.admin-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* --- REUTILIZABLES / SVGs --- */
.icon { width: 18px; height: 18px; }
.icon-lg { width: 28px; height: 28px; }
.icon-xl { width: 32px; height: 32px; }
.text-blue { color: #2563eb; }
.text-purple { color: #7c3aed; }
.text-green { color: #16a34a; }
.text-red { color: #dc2626; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }

/* --- BOTÓN VOLVER --- */
.btn-back {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;
}
.btn-back:hover {
  color: #0f172a;
}

/* --- ENCABEZADO --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
}
.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 6px 0 0 0;
}

/* --- BOTONES GENERALES --- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.btn-primary { background-color: #2563eb; color: white; }
.btn-primary:hover { background-color: #1d4ed8; }
.btn-secondary { background-color: white; border-color: #cbd5e1; color: #334155; }
.btn-secondary:hover { background-color: #f1f5f9; color: #0f172a;}
.btn-danger { background-color: #dc2626; color: white; }
.btn-danger:hover { background-color: #b91c1c; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* --- GRID DE ESTADÍSTICAS --- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}
.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
.stat-value { font-size: 32px; font-weight: 800; margin: 8px 0 0 0; }
.stat-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.bg-blue-light { background-color: #eff6ff; }
.bg-purple-light { background-color: #f5f3ff; }
.bg-green-light { background-color: #f0fdf4; }

/* --- CONTENEDOR DE LA TABLA Y FILTROS --- */
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.table-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }

.filters-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}
.custom-select {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
  outline: none;
  background-color: white;
}
.custom-select:focus { border-color: #2563eb; }

.table-wrapper { overflow-x: auto; }

/* --- TABLA PROPIA --- */
.custom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.custom-table th {
  background-color: #f8fafc;
  padding: 14px 24px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}
.sortable-header {
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}
.sortable-header:hover { background-color: #f1f5f9; color: #0f172a; }

.custom-table td {
  padding: 16px 24px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.custom-table tbody tr:hover { background-color: #f8fafc; }

/* COLUMNAS ESPECÍFICAS */
.col-id { color: #94a3b8; font-weight: 600; }
.col-name { font-weight: 600; color: #0f172a; }
.col-email { color: #64748b; font-size: 13px; }
.col-phone { color: #94a3b8; font-size: 12px; margin-top: 4px; }
.col-ocupacion { color: #475569; font-style: italic; }

/* BADGES DE ROL */
.role-badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 50px;
  letter-spacing: 0.03em;
}
.badge-admin { background-color: #1e293b; color: white; }
.badge-client { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

/* BOTONES DE ACCIÓN */
.actions-cell { display: flex; justify-content: center; gap: 8px; }
.btn-action {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}
.btn-edit { color: #2563eb; }
.btn-edit:hover { background-color: #eff6ff; border-color: #bfdbfe; }
.btn-delete { color: #dc2626; }
.btn-delete:hover { background-color: #fef2f2; border-color: #fca5a5; }

/* --- MODAL FORMAL --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 16px; box-sizing: border-box;
}
.modal-box {
  background: white; width: 100%; max-width: 500px;
  border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden; animation: fadeIn 0.25s ease-out;
}
.modal-body { padding: 32px 32px 24px 32px; display: flex; gap: 20px; }
.modal-alert-icon {
  background-color: #fef2f2; border: 1px solid #fee2e2; color: #dc2626;
  width: 48px; height: 48px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.modal-text h3 { margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #0f172a; }
.modal-text p { margin: 0 0 12px 0; font-size: 14px; color: #475569; line-height: 1.5; }
.user-pill-info {
  background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px;
  font-weight: 600; color: #1e293b; border-radius: 6px; font-size: 13px;
  display: inline-block; margin-bottom: 12px;
}
.modal-warning-text { font-size: 13px !important; color: #64748b !important; }
.modal-footer {
  background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 12px;
}

/* --- ESTADOS EXTRA / ANIMACIONES --- */
.state-container {
  background: white; border-radius: 12px; border: 1px solid #e2e8f0;
  padding: 48px; display: flex; justify-content: center; align-items: center;
  gap: 16px; font-weight: 500; color: #64748b;
}
.error { border-color: #fca5a5; background-color: #fff5f5; color: #b91c1c; justify-content: flex-start; }
.empty-row { text-align: center; color: #94a3b8; padding: 48px 0 !important; }

.spinner {
  border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; border-radius: 50%;
  width: 24px; height: 24px; animation: spin 1s linear infinite;
}
.loader-inline {
  border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white;
  border-radius: 50%; width: 12px; height: 12px; animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .btn-primary { width: 100%; justify-content: center; }
  .table-header { flex-direction: column; align-items: flex-start; }
  .filters-bar { width: 100%; flex-direction: column; }
  .filter-group { width: 100%; justify-content: space-between; }
  .custom-select { flex-grow: 1; max-width: 60%; }
  .modal-body { flex-direction: column; align-items: center; text-align: center; }
  .modal-footer { flex-direction: column; }
  .modal-footer .btn { width: 100%; justify-content: center; }
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  margin-top: 12px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f8fafc;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.control-group label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.custom-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  background-color: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.custom-select:focus { border-color: #2563eb; }
.sort-select { min-width: 180px; font-weight: 500; }

@media (max-width: 850px) {
  .controls-bar { flex-direction: column; align-items: stretch; }
  .control-group { flex-direction: column; align-items: stretch; }
  .custom-select { width: 100%; }
}
</style>