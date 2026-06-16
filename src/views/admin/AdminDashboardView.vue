<template>
  <div class="admin-container">
    <div class="admin-content">
      
      <div class="page-header">
        <div>
          <h1 class="main-title">Panel de Control Principal</h1>
          <p class="subtitle">Resumen general del sistema y accesos rápidos.</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div>
            <p class="stat-label">Total Usuarios</p>
            <p class="stat-value text-blue">{{ usuarioStore.totalUsuarios }}</p>
          </div>
          <div class="stat-icon bg-blue-light text-blue">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
        </div>
        
        <div class="stat-card">
          <div>
            <p class="stat-label">Total Reportes Activos</p>
            <p class="stat-value text-orange">{{ reporteStore.totalReportes }}</p>
          </div>
          <div class="stat-icon bg-orange-light text-orange">
            <svg class="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
        </div>
      </div>

      <div class="table-card" style="margin-top: 2rem; padding: 2rem;">
        <h2 style="margin-bottom: 1.5rem;">Gestión del Sistema</h2>
        <div style="display: flex; gap: 1rem;">
          <button @click="irAUsuarios" class="btn btn-primary" style="flex: 1; padding: 1.5rem; justify-content: center; font-size: 1.1rem;">
            Gestionar Usuarios
          </button>
          <button @click="irAReportes" class="btn btn-secondary" style="flex: 1; padding: 1.5rem; justify-content: center; font-size: 1.1rem;">
            Gestionar Reportes de Mascotas
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore';
import { useReporteAdminStore } from '../../stores/reporteAdminStore';

const router = useRouter();
const usuarioStore = useUsuarioAdminStore();
const reporteStore = useReporteAdminStore();

onMounted(() => {
  usuarioStore.cargarUsuarios();
  reporteStore.cargarReportes();
});

const irAUsuarios = () => router.push('/admin/usuarios');
const irAReportes = () => router.push('/admin/reportes');
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
.text-blue { color: #2563eb; }
.text-orange { color: #ea580c; } /* Color para reportes */

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
.btn-primary {
  background-color: #2563eb;
  color: white;
}
.btn-primary:hover { background-color: #1d4ed8; }
.btn-secondary {
  background-color: white;
  border-color: #cbd5e1;
  color: #334155;
}
.btn-secondary:hover { background-color: #f1f5f9; color: #0f172a; }

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
.bg-orange-light { background-color: #fff7ed; } /* Fondo para reportes */

/* --- CONTENEDOR TARJETA --- */
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* RESPONSIVE */
@media (max-width: 640px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .table-card > div { flex-direction: column; }
}
</style>