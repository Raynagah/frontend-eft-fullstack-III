<template>
  <div class="admin-container">
    <div class="admin-content">
      
      <button @click="router.push('/admin')" class="btn-back" title="Volver al Dashboard">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver al Dashboard
      </button>

      <div class="page-header">
        <div>
          <h1 class="main-title">Gestión de Reportes</h1>
          <p class="subtitle">Administra los reportes de mascotas publicados en el sistema.</p>
        </div>
      </div>

      <div class="stats-grid" v-if="!store.cargando && !store.error">
        <div class="stat-card">
          <div>
            <p class="stat-label">Total Reportes</p>
            <p class="stat-value text-blue">{{ totalReportes }}</p>
          </div>
          <div class="stat-icon bg-blue-light text-blue">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
        </div>
        
        <div class="stat-card">
          <div>
            <p class="stat-label">Mascotas Perdidas</p>
            <p class="stat-value text-orange">{{ totalPerdidas }}</p>
          </div>
          <div class="stat-icon bg-orange-light text-orange">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <p class="stat-label">Encontradas</p>
            <p class="stat-value text-green">{{ totalEncontradas }}</p>
          </div>
          <div class="stat-icon bg-green-light text-green">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <p class="stat-label">Reportes de Hoy</p>
            <p class="stat-value text-purple">{{ reportesHoy }}</p>
          </div>
          <div class="stat-icon bg-purple-light text-purple">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
      </div>

      <div class="controls-bar" v-if="!store.cargando && !store.error && store.reportes.length > 0">
        <div class="control-group">
          <label>Mostrar:</label>
          <select v-model="filtroTipo" class="custom-select">
            <option value="TODOS">Todos los reportes</option>
            <option value="PERDIDA">Solo Mascotas Perdidas</option>
            <option value="ENCONTRADA">Solo Mascotas Encontradas</option>
          </select>
        </div>
        <div class="control-group">
          <label>Ordenar por fecha:</label>
          <select v-model="ordenFecha" class="custom-select">
            <option value="DESC">Más recientes primero</option>
            <option value="ASC">Más antiguos primero</option>
          </select>
        </div>
      </div>

      <div v-if="store.cargando" class="state-container loading">
        <div class="spinner"></div>
        <span>Cargando reportes del sistema...</span>
      </div>

      <div v-else-if="store.error" class="state-container error">
        <svg class="icon text-red" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
        <div>
          <strong>Error de conexión</strong>
          <p>{{ store.error }}</p>
        </div>
      </div>

      <div v-else class="table-card">
        <div class="table-wrapper">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Mascota</th>
                <th>Título / Detalle</th>
                <th class="text-center">Tipo</th>
                <th class="text-center">Estado Saga</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reporte in reportesFiltrados" :key="reporte.id">
                <td class="col-id">#{{ String(reporte.id).padStart(4, '0') }}</td>
                <td class="col-date">{{ formatearFecha(reporte.fechaReporte || reporte.createdAt || reporte.fechaCreacion) }}</td>
                <td class="col-name">{{ reporte.nombre || 'Sin nombre' }}</td>
                <td>
                  <strong>{{ reporte.titulo }}</strong><br>
                  <small class="text-muted">{{ reporte.resumen }}</small>
                </td>
                <td class="text-center">
                  <span :class="['role-badge', reporte.tipoReporte === 'PERDIDA' ? 'badge-loss' : 'badge-found']">
                    {{ reporte.tipoReporte }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="status-text">{{ reporte.estado }}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button @click="abrirModalEliminar(reporte)" class="btn-action btn-delete" title="Eliminar reporte">
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="reportesFiltrados.length === 0">
                <td colspan="7" class="empty-row">
                  <p v-if="store.reportes.length > 0">No hay reportes que coincidan con los filtros actuales.</p>
                  <p v-else>No hay reportes registrados actualmente en la base de datos.</p>
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
            <h3>Eliminar Reporte</h3>
            <p>
              ¿Está completamente seguro de que desea eliminar el reporte de la mascota <strong>{{ reporteSeleccionado?.nombre || 'Sin nombre' }}</strong>?
            </p>
            <div class="user-pill-info">
              {{ reporteSeleccionado?.titulo }}
            </div>
            <p class="modal-warning-text">
              Esta acción es irreversible y eliminará el reporte y sus datos asociados del sistema de forma permanente.
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="cerrarModal" class="btn btn-secondary" :disabled="eliminando">
            Cancelar
          </button>
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
import { useReporteAdminStore } from '../../stores/reporteAdminStore';

const store = useReporteAdminStore();
const router = useRouter();

const mostrarModal = ref(false);
const reporteSeleccionado = ref(null);
const eliminando = ref(false);

// Filtros y Orden
const filtroTipo = ref('TODOS');
const ordenFecha = ref('DESC'); // DESC = más recientes primero

// Cargar datos
onMounted(() => {
  store.cargarReportes();
});

// --- ESTADÍSTICAS COMPUTADAS ---
const totalReportes = computed(() => store.reportes.length);

const totalPerdidas = computed(() => 
  store.reportes.filter(r => r.tipoReporte === 'PERDIDA').length
);

const totalEncontradas = computed(() => 
  store.reportes.filter(r => r.tipoReporte === 'ENCONTRADA' || r.tipoReporte === 'ENCONTRADO').length
);

// 1. En la computed reportesHoy:
const reportesHoy = computed(() => {
  const hoy = new Date().toISOString().split('T')[0];
  return store.reportes.filter(r => {
    // CAMBIO AQUÍ: Buscar fechaReporte
    const fecha = r.fechaReporte || r.createdAt || r.fechaCreacion; 
    if (!fecha) return false;
    return new Date(fecha).toISOString().split('T')[0] === hoy;
  }).length;
});

// 2. En la computed reportesFiltrados (ordenamiento):
const reportesFiltrados = computed(() => {
  let resultado = [...store.reportes];

  if (filtroTipo.value !== 'TODOS') {
    if (filtroTipo.value === 'ENCONTRADA') {
      resultado = resultado.filter(r => r.tipoReporte === 'ENCONTRADA' || r.tipoReporte === 'ENCONTRADO');
    } else {
      resultado = resultado.filter(r => r.tipoReporte === filtroTipo.value);
    }
  }

  resultado.sort((a, b) => {
    // CAMBIO AQUÍ: Buscar fechaReporte
    const fechaA = new Date(a.fechaReporte || a.createdAt || a.fechaCreacion || 0).getTime();
    const fechaB = new Date(b.fechaReporte || b.createdAt || b.fechaCreacion || 0).getTime();
    return ordenFecha.value === 'DESC' ? fechaB - fechaA : fechaA - fechaB;
  });

  return resultado;
});

// --- FORMATEAR FECHA ---
const formatearFecha = (fechaString) => {
  if (!fechaString) return '---';
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// --- ACCIONES MODAL ---
const abrirModalEliminar = (reporte) => {
  reporteSeleccionado.value = reporte;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  reporteSeleccionado.value = null;
};

const ejecutarEliminacion = async () => {
  if (!reporteSeleccionado.value) return;
  eliminando.value = true;
  try {
    await store.eliminarReporte(reporteSeleccionado.value.id);
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
.text-red { color: #dc2626; }
.text-blue { color: #2563eb; }
.text-orange { color: #ea580c; }
.text-green { color: #16a34a; }
.text-purple { color: #7c3aed; }
.text-muted { color: #64748b; }
.text-center { text-align: center; }

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

/* --- GRID DE ESTADÍSTICAS --- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
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
.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  margin: 8px 0 0 0;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-blue-light { background-color: #eff6ff; }
.bg-orange-light { background-color: #fff7ed; }
.bg-green-light { background-color: #f0fdf4; }
.bg-purple-light { background-color: #f5f3ff; }

/* --- CONTROLES DE FILTRO Y ORDEN --- */
.controls-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.control-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.custom-select {
  padding: 8px 36px 8px 12px;
  font-size: 14px;
  color: #1e293b;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  transition: all 0.2s ease;
  min-width: 200px;
}
.custom-select:focus {
  border-color: #2563eb;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
.btn-secondary { background-color: white; border-color: #cbd5e1; color: #334155; }
.btn-secondary:hover { background-color: #f1f5f9; color: #0f172a;}
.btn-danger { background-color: #dc2626; color: white; }
.btn-danger:hover { background-color: #b91c1c; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* --- CONTENEDOR DE LA TABLA --- */
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.table-wrapper {
  overflow-x: auto;
}

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
.col-date { color: #64748b; font-size: 13px; font-weight: 500; white-space: nowrap; }
.col-name { font-weight: 600; color: #0f172a; }
.status-text { font-size: 13px; font-weight: 600; color: #475569; }

/* BADGES DE REPORTE */
.role-badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 50px;
  letter-spacing: 0.03em;
}
.badge-loss { background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; }
.badge-found { background-color: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

/* BOTONES DE ACCIÓN */
.actions-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}
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
.btn-delete { color: #dc2626; }
.btn-delete:hover { background-color: #fef2f2; border-color: #fca5a5; }

/* --- MODAL FORMAL --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  box-sizing: border-box;
}
.modal-box {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: fadeIn 0.25s ease-out;
}
.modal-body { padding: 32px 32px 24px 32px; display: flex; gap: 20px; }
.modal-alert-icon {
  background-color: #fef2f2; border: 1px solid #fee2e2; color: #dc2626;
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
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
@media (max-width: 640px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .controls-bar { flex-direction: column; align-items: stretch; gap: 16px; }
  .control-group { flex-direction: column; align-items: flex-start; gap: 8px; }
  .custom-select { width: 100%; }
  .modal-body { flex-direction: column; align-items: center; text-align: center; }
  .modal-footer { flex-direction: column; }
  .modal-footer .btn { width: 100%; justify-content: center; }
}
</style>