<template>
  <div class="dashboard-container">
    <div class="header-section">
      <h2>Mascotas Reportadas</h2>
      <p>Ayúdanos a reunirlos con sus familias.</p>
    </div>

    <div v-if="cargando" class="estado-mensaje loader">
      <p>Cargando información desde el orquestador...</p>
    </div>

    <div v-else-if="error" class="estado-mensaje error">
      <p>Ocurrió un problema de conexión: {{ error }}</p>
      <button @click="obtenerMascotas" class="btn-reintentar">Reintentar</button>
    </div>

    <div v-else class="mascotas-grid">
      <MascotaCard 
        v-for="mascota in mascotas" 
        :key="mascota.id" 
        :mascota="mascota" 
      />
    </div>

    <div v-if="!cargando && !error && mascotas.length === 0" class="estado-mensaje vacio">
      <p>No hay mascotas reportadas en este momento.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
// Importamos la tarjeta usando la ruta que me indicaste
import MascotaCard from '../components/mascotas/mascotaCard.vue';

// Definición de variables reactivas (Estado)
const mascotas = ref([]);
const cargando = ref(true);
const error = ref(null);

// Función para consumir el BFF
const obtenerMascotas = async () => {
  cargando.value = true;
  error.value = null;
  
  try {
    // Apuntamos al endpoint del Dashboard que pulimos antes
    const response = await axios.get('http://localhost:8087/api/v1/web/mascotas/dashboard');
    mascotas.value = response.data;
  } catch (err) {
    console.error("Error al obtener las mascotas:", err);
    error.value = "No pudimos conectar con el servidor. Intenta de nuevo más tarde.";
  } finally {
    cargando.value = false;
  }
};

// Se ejecuta automáticamente cuando la vista se carga en pantalla
onMounted(() => {
  obtenerMascotas();
});
</script>

<style scoped>
.dashboard-container {
  padding: 1rem 0;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.header-section h2 {
  color: var(--color-primary);
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.header-section p {
  color: #6c757d;
  font-size: 1.1rem;
}

/* Grilla Responsiva usando CSS Grid */
.mascotas-grid {
  display: grid;
  /* Auto-fill y minmax hacen que sea responsive sin necesidad de media queries */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

/* Estilos de los estados */
.estado-mensaje {
  text-align: center;
  padding: 3rem;
  border-radius: 12px;
  background-color: var(--color-white);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
  border: 1px solid #f5c6cb;
}

.btn-reintentar {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-reintentar:hover {
  background-color: #2c6f7a;
}
</style>