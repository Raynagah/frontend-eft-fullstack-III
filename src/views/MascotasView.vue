<template>
  <div class="dashboard-container">
    <div class="header-section">
      <h2>Mascotas Reportadas</h2>
      <p>Ayúdanos a reunirlos con sus familias.</p>
    </div>

    <div class="filtros-section">
      <label for="filtro">Filtrar por: </label>
      <select id="filtro" v-model="filtroSeleccionado" class="filtro-select">
        <option value="TODOS">Todas las mascotas</option>
        <option value="PERDIDA">Perdidas</option>
        <option value="ENCONTRADA">Encontradas</option>
      </select>
    </div>

    <div v-if="cargando" class="estado-mensaje loader">
      <p>Cargando información desde el orquestador...</p>
    </div>

    <div v-else-if="error" class="estado-mensaje error">
      <p>Ocurrió un problema de conexión: {{ error }}</p>
      <button @click="obtenerMascotas" class="btn-reintentar">Reintentar</button>
    </div>

    <div v-else class="mascotas-grid">
      <MascotaCard v-for="mascota in mascotasFiltradas" :key="mascota.id" :mascota="mascota" />
    </div>

    <div v-if="!cargando && !error && mascotasFiltradas.length === 0" class="estado-mensaje vacio">
      <p>No se encontraron mascotas con este filtro.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api/axiosConfig.js';
// 4. Asegúrate de importar el componente (ajusta la ruta según tus carpetas)
import MascotaCard from '../components/mascotas/mascotaCard.vue';

const mascotas = ref([]);
const cargando = ref(true);
const error = ref(null); // Agregamos la variable de error
const filtroSeleccionado = ref('TODOS');

const obtenerMascotas = async () => {
  cargando.value = true;
  error.value = null; // Limpiamos el error al reintentar
  try {
    const response = await api.get('/web/mascotas');

    const data = response.data.content || response.data;
    mascotas.value = Array.isArray(data) ? data : [];

    console.log("Mascotas cargadas:", mascotas.value);
  } catch (err) {
    console.error("Error al cargar mascotas:", err);
    // Guardamos el mensaje de error para mostrarlo en el HTML
    error.value = err.message || "No se pudo conectar con el servidor.";
  } finally {
    cargando.value = false;
  }
};

const mascotasFiltradas = computed(() => {
  if (filtroSeleccionado.value === 'TODOS') return mascotas.value;

  return mascotas.value.filter(m => {
    return m.tipoReporte === filtroSeleccionado.value;
  });
});

onMounted(obtenerMascotas);
</script>

<style scoped>
.dashboard-container {
  padding: 1rem 0;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h2 {
  color: var(--color-primary, #2c3e50);
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.header-section p {
  color: #6c757d;
  font-size: 1.1rem;
}

/* Estilos para el filtro */
.filtros-section {
  text-align: center;
  margin-bottom: 2rem;
}

.filtro-select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  margin-left: 0.5rem;
  outline: none;
}

.filtro-select:focus {
  border-color: var(--color-primary, #2c3e50);
}

.mascotas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.estado-mensaje {
  text-align: center;
  padding: 3rem;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
  border: 1px solid #f5c6cb;
}

.btn-reintentar {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-reintentar:hover {
  opacity: 0.9;
}
</style>