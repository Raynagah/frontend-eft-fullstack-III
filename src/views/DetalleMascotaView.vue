<template>
  <div class="detalle-container">

    <div v-if="cargando" class="estado-mensaje loader">
      <p>Cargando detalles de la mascota...</p>
    </div>

    <div v-else-if="error" class="estado-mensaje error">
      <p>{{ error }}</p>
      <button @click="$router.push('/mascotas')" class="btn-volver">Volver al Dashboard</button>
    </div>

    <div v-else-if="mascota" class="ficha-mascota">

      <div class="ficha-header">
        <div class="imagen-contenedor">
          <img :src="mascota.fotografiaUrl || 'https://via.placeholder.com/600x400?text=Sin+Foto'"
            :alt="'Foto de ' + mascota.nombre" class="mascota-img" />
          <span class="badge" :class="estadoClase">{{ mascota.sagaStatus }}</span>
        </div>
        <div class="titulo-contenedor">
          <h2>{{ mascota.nombre }}</h2>
          <p class="fecha">Reportado en el sistema</p>
        </div>
      </div>

      <div class="ficha-body">

        <div class="info-card">
          <h3><i class="icono">🐾</i> Características</h3>
          <ul class="lista-datos">
            <li><strong>Especie:</strong> {{ mascota.especie }}</li>
            <li><strong>Raza:</strong> {{ mascota.raza || 'No especificada' }}</li>
            <li><strong>Color:</strong> {{ mascota.color }}</li>
            <li><strong>Tamaño:</strong> {{ mascota.tamano || 'No especificado' }}</li>
          </ul>
        </div>

        <div class="info-card contacto-card">
          <h3><i class="icono">👤</i> Información de Contacto</h3>
          <p class="contacto-intro">Si tienes información, por favor comunícate con:</p>
          <ul class="lista-datos">
            <li><strong>Nombre:</strong> {{ mascota.contactoNombre || 'No disponible' }}</li>
            <li><strong>Teléfono:</strong> {{ mascota.contactoTelefono || 'No disponible' }}</li>
            <li v-if="mascota.contactoEmail">
              <strong>Email:</strong> {{ mascota.contactoEmail }}
            </li>
          </ul>
        </div>

        <div class="info-card ubicacion-card full-width">
          <h3><i class="icono">📍</i> Última Ubicación Conocida</h3>
          <div class="mapa-placeholder">
            <p><strong>Latitud:</strong> {{ mascota.ubicacion?.latitud || mascota.latitud }}</p>
            <p><strong>Longitud:</strong> {{ mascota.ubicacion?.longitud || mascota.longitud }}</p>
            <small>(Aquí se integraría Google Maps o Leaflet en el futuro)</small>
          </div>
        </div>

      </div>

      <div class="ficha-footer">
        <button @click="$router.push('/mascotas')" class="btn-secundario">Volver a Mascotas</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Recibimos el ID desde la URL (Vue Router lo pasa como prop gracias a 'props: true' en la ruta)
const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const router = useRouter();

// Estado reactivo
const mascota = ref(null);
const cargando = ref(true);
const error = ref(null);

// Computed para el color del estado
const estadoClase = computed(() => {
  if (!mascota.value) return '';
  // Usamos sagaStatus en lugar de estado
  const estado = mascota.value.sagaStatus ? mascota.value.sagaStatus.toUpperCase() : '';
  
  if (estado === 'COMPLETED') return 'badge-success';
  if (estado === 'PENDING') return 'badge-warning';
  if (estado === 'REJECTED' || estado === 'FAILED') return 'badge-danger';
  return 'badge-default';
});

// Llamada al BFF
const cargarDetalle = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const response = await axios.get(`http://localhost:8087/api/v1/web/mascotas/detalle/${props.id}`);
    mascota.value = response.data;
  } catch (err) {
    console.error("Error al cargar detalle:", err);
    error.value = "No se pudo encontrar la información de esta mascota.";
  } finally {
    cargando.value = false;
  }
};

// Disparamos la petición apenas el componente se monta
onMounted(() => {
  cargarDetalle();
});
</script>

<style scoped>
.detalle-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 0;
}

.estado-mensaje {
  text-align: center;
  padding: 3rem;
  background-color: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.error {
  color: #dc3545;
}

/* Ficha Principal */
.ficha-mascota {
  background-color: var(--color-white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.ficha-header {
  border-bottom: 1px solid #eee;
}

.imagen-contenedor {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #e9ecef;
}

.mascota-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.badge-success {
  background-color: #28a745;
}

.badge-warning {
  background-color: var(--color-accent);
}

.badge-danger {
  background-color: #dc3545;
}

.badge-default {
  background-color: var(--color-primary);
}

.titulo-contenedor {
  padding: 1.5rem 2rem;
  text-align: center;
}

.titulo-contenedor h2 {
  color: var(--color-primary);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.fecha {
  color: #6c757d;
  font-size: 0.95rem;
}

/* Grilla de Información */
.ficha-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
}

.full-width {
  grid-column: 1 / -1;
}

.info-card {
  background-color: var(--color-bg);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 5px solid var(--color-primary);
}

.contacto-card {
  border-left-color: var(--color-accent);
}

.info-card h3 {
  color: var(--color-text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  font-size: 1.3rem;
}

.icono {
  margin-right: 0.5rem;
  font-style: normal;
}

.lista-datos {
  list-style: none;
  padding: 0;
}

.lista-datos li {
  margin-bottom: 0.8rem;
  font-size: 1.05rem;
  color: #495057;
}

.lista-datos strong {
  color: var(--color-text);
  display: inline-block;
  width: 85px;
}

.mapa-placeholder {
  background-color: #e9ecef;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  color: #6c757d;
  border: 2px dashed #ced4da;
}

/* Footer y Botones */
.ficha-footer {
  padding: 1.5rem 2rem;
  background-color: var(--color-bg);
  text-align: center;
  border-top: 1px solid #eee;
}

.btn-secundario,
.btn-volver {
  padding: 0.8rem 2rem;
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-secundario:hover,
.btn-volver:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Responsividad */
@media (max-width: 768px) {
  .ficha-body {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .imagen-contenedor {
    height: 250px;
  }
}
</style>