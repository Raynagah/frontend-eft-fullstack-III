<template>
  <div class="perfil-container">
    <div class="tabs-menu">
      <button :class="['tab-btn', { active: tabActual === 'datos' }]" @click="tabActual = 'datos'"
        data-testid="tab-datos">
        👤 Mis Datos
      </button>
      <button :class="['tab-btn', { active: tabActual === 'reportes' }]" @click="tabActual = 'reportes'"
        data-testid="tab-reportes">
        📋 Historial de Reportes
      </button>
    </div>

    <div v-if="tabActual === 'datos'" class="tab-content fade-in">
      <div class="form-card">
        <div class="card-header">
          <div class="header-user-info">
            <div class="avatar-circle">
              {{ inicialNombre }}
            </div>
            <div class="user-titles">
              <h3>Información Personal</h3>
              <span class="user-badge" v-if="usuario.rol">{{ usuario.rol }}</span>
            </div>
          </div>

          <button v-if="!modoEdicion && !cargandoDatos" @click="iniciarEdicion" class="btn-editar">
            ✏️ Editar Perfil
          </button>
        </div>

        <div class="loader" v-if="cargandoDatos">Cargando...</div>

        <div v-else-if="!modoEdicion" class="perfil-view">
          <div v-if="errorDatos" class="alert error mb-3">{{ errorDatos }}</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nombre Completo</span>
              <span class="value">{{ usuario.nombre }}</span>
            </div>
            <div class="info-item">
              <span class="label">Correo Electrónico</span>
              <span class="value">{{ usuario.correo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Teléfono</span>
              <span class="value">{{ usuario.telefono }}</span>
            </div>
            <div class="info-item">
              <span class="label">Edad</span>
              <span class="value">{{ usuario.edad ? usuario.edad + ' años' : 'No especificada' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Género</span>
              <span class="value">{{ usuario.genero || 'No especificado' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Ocupación</span>
              <span class="value">{{ usuario.ocupacion || 'No especificada' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Dirección</span>
              <span class="value">{{ usuario.direccion || 'No especificada' }}</span>
            </div>
          </div>
          <div v-if="mensajeExito" class="alert success mt-2">{{ mensajeExito }}</div>
        </div>

        <form v-else @submit.prevent="guardarDatos" class="perfil-form fade-in">
          <p class="form-subtitle">Modifica los campos que necesites actualizar.</p>

          <div class="form-row">
            <div class="form-group flex-2">
              <label for="nombre-perfil">Nombre Completo*</label>
              <input id="nombre-perfil" data-testid="input-nombre-perfil" type="text" v-model="usuario.nombre" required>
            </div>
            <div class="form-group flex-1">
              <label for="edad-perfil">Edad*</label>
              <input id="edad-perfil" data-testid="input-edad-perfil" type="number" v-model="usuario.edad" min="18"
                max="100" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="genero-perfil">Género*</label>
              <select id="genero-perfil" data-testid="input-genero-perfil" v-model="usuario.genero" required>
                <option value="" disabled>Selecciona...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="telefono-perfil">Teléfono*</label>
              <input id="telefono-perfil" data-testid="input-telefono-perfil" type="tel" v-model="usuario.telefono"
                required>
            </div>
          </div>

          <div class="form-group">
            <label for="ocupacion-perfil">Ocupación</label>
            <input id="ocupacion-perfil" data-testid="input-ocupacion-perfil" type="text" v-model="usuario.ocupacion"
              placeholder="Ej: Veterinario, Estudiante...">
          </div>

          <div class="form-group">
            <label for="direccion-perfil">Dirección</label>
            <input id="direccion-perfil" data-testid="input-direccion-perfil" type="text" v-model="usuario.direccion"
              placeholder="Calle, Número, Ciudad">
          </div>

          <div v-if="errorDatos" class="alert error">{{ errorDatos }}</div>

          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="cancelarEdicion" :disabled="guardando">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="tabActual === 'reportes'" class="tab-content fade-in">
      
      <div v-if="misReportes.length > 0" class="filtros-y-orden-wrapper">
        <div class="filtros-container">
          <button :class="['filtro-chip', { active: filtroActual === 'TODOS' }]" @click="filtroActual = 'TODOS'">
            📋 Todas
          </button>
          <button :class="['filtro-chip', { active: filtroActual === 'PERDIDA' }]" @click="filtroActual = 'PERDIDA'">
            🔍 Perdidas
          </button>
          <button :class="['filtro-chip', { active: filtroActual === 'ENCONTRADA' }]" @click="filtroActual = 'ENCONTRADA'">
            🤝 Encontradas
          </button>
        </div>

        <div class="orden-container">
          <label for="orden-fecha">Ordenar por:</label>
          <select id="orden-fecha" v-model="ordenActual" class="select-orden">
            <option value="RECIENTES">Más recientes primero</option>
            <option value="ANTIGUOS">Más antiguos primero</option>
          </select>
        </div>
      </div>

      <div v-if="misReportes.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Aún no tienes reportes activos</h3>
        <p>Cuando reportes una mascota perdida o encontrada, aparecerá aquí para que puedas hacerle seguimiento.</p>
      </div>

      <div v-else-if="reportesFiltrados.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No hay reportes en esta categoría</h3>
        <p>No tienes ningún historial clasificado como "{{ filtroActual.toLowerCase() }}".</p>
      </div>

      <div v-else class="mascotas-grid">
        <div v-for="m in reportesFiltrados" :key="m.id" class="reporte-item-container">
          <router-link :to="`/detalle/${m.id}`" class="card-link-wrapper" data-testid="link-detalle-reporte">
            <MascotaCard :mascota="m" />
          </router-link>
          
          <button @click.stop.prevent="confirmarEliminar(m.id)" class="btn-eliminar-reporte">
            🗑️ Eliminar Reporte
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api/axiosConfig.js';
import MascotaCard from '../components/mascotas/MascotaCard.vue';

const modoEdicion = ref(false);
const usuarioOriginal = ref({});
const tabActual = ref('datos');
const usuarioId = ref(null);
const filtroActual = ref('TODOS');
const ordenActual = ref('RECIENTES');

const inicialNombre = computed(() => {
  if (usuario.value && usuario.value.nombre) {
    return usuario.value.nombre.charAt(0).toUpperCase();
  }
  return '👤';
});

const usuario = ref({
  nombre: '',
  edad: null,
  genero: '',
  telefono: '',
  ocupacion: '',
  direccion: '',
  correo: '',
  fotoUrl: ''
});

const cargandoDatos = ref(true);
const guardando = ref(false);
const mensajeExito = ref('');
const errorDatos = ref('');
const misReportes = ref([]);

// Simplificado: Solo se encarga de filtrar las categorías
const reportesFiltrados = computed(() => {
  let lista = [...misReportes.value]; // Clonamos la lista para evitar mutaciones directas

  // 1. Filtrar por tipo si aplica
  if (filtroActual.value !== 'TODOS') {
    lista = lista.filter(m => m.tipoReporte?.toUpperCase() === filtroActual.value);
  }

  // 2. Ordenar dinámicamente por fecha
  lista.sort((a, b) => {
    // Si la fecha falta por alguna razón, usamos la fecha de hoy para no romper el orden
    const fechaA = new Date(a.fechaReporte || new Date());
    const fechaB = new Date(b.fechaReporte || new Date());

    if (ordenActual.value === 'RECIENTES') {
      return fechaB - fechaA; // De más nuevo a más viejo
    } else {
      return fechaA - fechaB; // De más viejo a más nuevo
    }
  });

  return lista;
});

onMounted(async () => {
  const userStorage = localStorage.getItem('usuario');
  if (userStorage) {
    const userParseado = JSON.parse(userStorage);
    usuarioId.value = userParseado.id;
    await cargarDatosPersonales();
    await cargarMisReportes();
  }
});

const cargarDatosPersonales = async () => {
  try {
    const response = await api.get(`/web/usuarios/${usuarioId.value}`);
    usuario.value = { ...usuario.value, ...response.data };
    usuarioOriginal.value = JSON.parse(JSON.stringify(usuario.value));
  } catch (error) {
    errorDatos.value = "Error al cargar datos.";
  } finally {
    cargandoDatos.value = false;
  }
};

const iniciarEdicion = () => {
  errorDatos.value = '';
  modoEdicion.value = true;
};

const cancelarEdicion = () => {
  usuario.value = JSON.parse(JSON.stringify(usuarioOriginal.value));
  modoEdicion.value = false;
  errorDatos.value = '';
};

const guardarDatos = async () => {
  guardando.value = true;
  mensajeExito.value = '';
  errorDatos.value = '';

  try {
    const payload = {
      nombre: usuario.value.nombre,
      edad: parseInt(usuario.value.edad),
      genero: usuario.value.genero,
      telefono: usuario.value.telefono,
      ocupacion: usuario.value.ocupacion,
      direccion: usuario.value.direccion,
      fotoUrl: usuario.value.fotoUrl
    };

    const response = await api.put(`/web/usuarios/${usuarioId.value}`, payload);
    usuario.value = { ...usuario.value, ...response.data };
    usuarioOriginal.value = JSON.parse(JSON.stringify(usuario.value));
    modoEdicion.value = false;
    mensajeExito.value = "¡Perfil actualizado con éxito!";
    setTimeout(() => { mensajeExito.value = ''; }, 3000);
  } catch (error) {
    console.error(error);
    errorDatos.value = "No se pudo actualizar. Revisa que todos los campos obligatorios (*) estén llenos.";
  } finally {
    guardando.value = false;
  }
};

const cargarMisReportes = async () => {
  try {
    const response = await api.get(`/web/usuarios/${usuarioId.value}/reportes`);
    misReportes.value = response.data.content || response.data;
  } catch (e) { 
    console.error("Error al cargar el historial:", e); 
  }
};

const confirmarEliminar = async (id) => {
  const confirmacion = confirm("¿Estás completamente seguro de eliminar este reporte? Se borrará de forma permanente del mapa y el sistema.");
  if (confirmacion) {
    try {
      await api.delete(`/web/mascotas/${id}`);
      await cargarMisReportes();
      alert("Reporte eliminado exitosamente.");
    } catch (err) {
      console.error("Error al eliminar reporte:", err);
      alert("Hubo un problema al intentar eliminar este reporte.");
    }
  }
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1.5rem;
}

.header-user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-circle {
  width: 70px;
  height: 70px;
  background-color: var(--color-primary, #388A98);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(56, 138, 152, 0.3);
}

.user-titles h3 {
  margin: 0 0 0.3rem 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.user-badge {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.btn-editar {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Modo Lectura Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-item { display: flex; flex-direction: column; }
.info-item.full-width { grid-column: 1 / -1; }
.info-item .label { font-size: 0.85rem; color: #6c757d; font-weight: 600; margin-bottom: 0.2rem; }
.info-item .value { font-size: 1.05rem; color: #2c3e50; font-weight: 500; }

.form-actions { display: flex; gap: 1rem; margin-top: 2rem; }

.btn-cancelar {
  flex: 1;
  padding: 1rem;
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancelar:hover { background-color: #e2e6ea; }

.btn-guardar {
  flex: 2;
  width: 100%;
  padding: 1rem;
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.mt-2 { margin-top: 1rem; }
.form-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.perfil-form select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  background-color: white;
}

.perfil-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  margin: 0 auto;
}

.form-subtitle { color: #6c757d; margin-bottom: 1.5rem; font-size: 0.95rem; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #343a40; }

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus { outline: none; border-color: var(--color-primary, #007bff); }
.btn-guardar:hover:not(:disabled) { opacity: 0.9; }
.btn-guardar:disabled { background-color: #6c757d; cursor: wait; }

.alert { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 500; text-align: center; }
.alert.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.alert.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.loader { text-align: center; padding: 2rem; color: #6c757d; font-weight: 500; }

/* --- FILTROS --- */
.filtros-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #f8fafc;
  padding: 0.5rem;
  border-radius: 30px;
  width: fit-content;
  border: 1px solid #e2e8f0;
}

.filtro-chip {
  background: none;
  border: none;
  padding: 0.5rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.filtro-chip:hover {
  color: var(--color-primary, #388A98);
  background-color: #f1f5f9;
}

.filtro-chip.active {
  background-color: var(--color-primary, #388A98);
  color: white;
  box-shadow: 0 2px 8px rgba(56, 138, 152, 0.25);
}

/* --- GRILLA DE REPORTES --- */
.mascotas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.reporte-item-container {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reporte-item-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.card-link-wrapper { text-decoration: none; color: inherit; display: block; }

.btn-eliminar-reporte {
  background-color: #fff5f5;
  color: #dc3545;
  border: none;
  border-top: 1px solid #fbd5d5;
  padding: 0.8rem;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  width: 100%;
}

.btn-eliminar-reporte:hover { background-color: #dc3545; color: white; }

.tabs-menu {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 0.5rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
}

.tab-btn:hover { color: var(--color-primary); background-color: #F8FAFC; }
.tab-btn.active { color: var(--color-primary); border-bottom: 3px solid var(--color-primary); margin-bottom: -11px; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
.empty-state h3 { color: var(--color-text); margin-bottom: 0.5rem; }
.empty-state p { color: #64748B; max-width: 400px; margin: 0 auto; }

.filtros-y-orden-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Reducimos el margen inferior que tenía antes para que se alinee con el selector */
.filtros-container {
  margin-bottom: 0 !important; 
}

/* NUEVO: Contenedor y diseño del Select de Ordenación */
.orden-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.orden-container label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
}

.select-orden {
  padding: 0.4rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background-color: white;
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.select-orden:focus {
  border-color: var(--color-primary, #388A98);
  box-shadow: 0 0 0 2px rgba(56, 138, 152, 0.15);
}
</style>