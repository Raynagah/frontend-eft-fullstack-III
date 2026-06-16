<template>
  <div class="detalle-container">

    <div v-if="cargando" class="estado-mensaje loader">
      <p>Cargando detalles de la mascota...</p>
    </div>

    <div v-else-if="error" class="estado-mensaje error">
      <p>{{ error }}</p>
      <button @click="irAMascotas" class="btn-volver" data-test="btn-volver">Volver al Dashboard</button>
    </div>

    <div v-else-if="mascota" class="ficha-mascota">

      <div class="ficha-header">
        <div class="imagen-contenedor">
          <img :src="mascota.fotografiaUrl || 'https://via.placeholder.com/600x400?text=Sin+Foto'"
            :alt="'Foto de ' + (mascota.nombre || 'Mascota')" class="mascota-img" />
          <span class="badge" :class="estadoClase">{{ mascota.sagaStatus || mascota.estado }}</span>
        </div>
        <div class="titulo-contenedor">
          <div class="contenedor-badge-tipo" v-if="mascota.tipoReporte">
            <span class="badge-tipo" :class="claseTipoReporte">
              {{ mascota.tipoReporte === 'ENCONTRADA' ? '🟢 ENCONTRADA' : '🚨 PERDIDA' }}
            </span>
          </div>
          
          <h2>{{ tituloAmigable }}</h2>

          <div class="contenedor-fecha-detalle">
            <span class="fecha-calendario">📅 {{ fechaFormateada }}</span>
            <span class="fecha-relativa">🕒 {{ tiempoRelativo }}</span>
          </div>
        </div>
      </div>

      <div class="ficha-body">

        <div class="info-card">
          <h3><i class="icono">🐾</i> Características</h3>
          <ul class="lista-datos">
            <li><strong>Especie:</strong> {{ mascota.especie || 'No especificada' }}</li>
            <li><strong>Raza:</strong> {{ mascota.raza || 'No especificada' }}</li>
            <li><strong>Color:</strong> {{ mascota.color || 'No especificado' }}</li>
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
          <div id="mapa-mascota" class="mapa-interactivo"></div>
          <p class="coordenadas-texto">
            <small>Lat: {{ obtenerLatitud }}, Lng: {{ obtenerLongitud }}</small>
          </p>
        </div>

        <div class="info-card coincidencias-card full-width"
          v-if="mascota.posiblesCoincidencias && mascota.posiblesCoincidencias.length > 0">
          <h3><i class="icono">🔍</i> Posibles Coincidencias</h3>
          <p class="coincidencias-intro">El sistema ha detectado estas mascotas con características similares:</p>

          <div class="coincidencias-list">
            <div v-for="(match, index) in mascota.posiblesCoincidencias" :key="match.mascotaId || index"
              class="coincidencia-item">

              <div class="coincidencia-info">
                <div class="header-match">
                  <h4>{{ match.nombreMascota || 'Registro similar detectado' }}</h4>
                  <span 
                    v-if="match.tipoReporte" 
                    class="badge-tipo-mini" 
                    :class="obtenerClaseTipoMatch(match.tipoReporte)"
                  >
                    {{ match.tipoReporte === 'ENCONTRADA' ? '🟢 ENCONTRADA' : '🚨 PERDIDA' }}
                  </span>
                </div>
                <p v-if="match.descripcionMatch" class="match-desc">{{ match.descripcionMatch }}</p>
                <p v-else class="match-desc">Mascota con alto nivel de coincidencia en especie, raza o color.</p>
              </div>

              <div class="coincidencia-score">
                <div class="score-barra">
                  <div class="score-fill" :style="{ width: match.porcentajeSimilitud + '%' }"
                    :class="obtenerClaseSimilitud(match.porcentajeSimilitud)"></div>
                </div>
                <span class="score-texto">{{ match.porcentajeSimilitud }}% de similitud</span>
              </div>

              <button v-if="match.mascotaId" @click="irADetalleMatch(match.mascotaId)" class="btn-ver-match">
                Ir a este reporte
              </button>

            </div>
          </div>
        </div>

      </div>

      <div class="ficha-footer">
        <button @click="irAMascotas" class="btn-secundario" data-test="btn-volver">Volver a Mascotas</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../api/axiosConfig.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const router = useRouter();
const route = useRoute();

const irADetalleMatch = (id) => {
  router.push(`/detalle/${id}`);
};

// Estado reactivo
const mascota = ref(null);
const cargando = ref(true);
const error = ref(null);
let mapaInstancia = null;

// Computed properties
const obtenerLatitud = computed(() => mascota.value?.ubicacion?.latitud || mascota.value?.latitud);
const obtenerLongitud = computed(() => mascota.value?.ubicacion?.longitud || mascota.value?.longitud);

// NUEVO: Formateador humano para la fecha exacta (Ej: 29 de marzo de 2026, 00:43)
const fechaFormateated = computed(() => {
  if (!mascota.value?.fechaReporte) return '';
  const fecha = new Date(mascota.value.fechaReporte);
  
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(fecha);
});
// Redireccionando para compatibilidad en template
const fechaFormateada = fechaFormateated;

// NUEVO: Cálculo computado del tiempo transcurrido desde el reporte
const tiempoRelativo = computed(() => {
  if (!mascota.value?.fechaReporte) return '';

  const fechaReporte = new Date(mascota.value.fechaReporte);
  const fechaActual = new Date();

  const utc1 = Date.UTC(fechaReporte.getFullYear(), fechaReporte.getMonth(), fechaReporte.getDate());
  const utc2 = Date.UTC(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());

  const milisegundosPorDia = 1000 * 60 * 60 * 24;
  const diferenciaDias = Math.floor((utc2 - utc1) / milisegundosPorDia);

  if (diferenciaDias < 0) return 'Reciente';
  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
  if (diferenciaDias < 30) {
    const semanas = Math.floor(diferenciaDias / 7);
    return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
  }
  
  const meses = Math.floor(diferenciaDias / 30);
  return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
});

const estadoClase = computed(() => {
  if (!mascota.value) return '';
  const estado = (mascota.value.sagaStatus || mascota.value.estado || '').toUpperCase();

  if (estado === 'COMPLETED' || estado === 'COMPLETADO') return 'badge-success';
  if (estado === 'PENDING' || estado === 'PENDIENTE') return 'badge-warning';
  if (estado === 'REJECTED' || estado === 'FAILED' || estado === 'FAILED_SYNC') return 'badge-danger';
  return 'badge-default';
});

const claseTipoReporte = computed(() => {
  if (!mascota.value) return '';
  const tipo = (mascota.value.tipoReporte || '').toUpperCase();
  return tipo === 'ENCONTRADA' ? 'tipo-encontrada' : 'tipo-perdida';
});

const irAMascotas = () => {
  router.push('/mascotas');
};

// Lógica del Mapa
const initMap = () => {
  const lat = obtenerLatitud.value;
  const lng = obtenerLongitud.value;

  if (!lat || !lng) return;

  const mapContainer = document.getElementById('mapa-mascota');
  if (!mapContainer) return;

  if (mapaInstancia) {
    mapaInstancia.remove();
    mapaInstancia = null;
  }

  try {
    mapaInstancia = L.map('mapa-mascota').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapaInstancia);

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker([lat, lng], { icon: customIcon })
      .addTo(mapaInstancia)
      .bindPopup(`<b>Última ubicación registrada</b>`)
      .openPopup();
  } catch (err) {
    console.error("Error al inicializar el mapa:", err);
  }
};

const tituloAmigable = computed(() => {
  if (mascota.value.nombre && mascota.value.nombre.trim() !== '') {
    return mascota.value.nombre;
  }

  const especie = mascota.value.especie ? mascota.value.especie.toLowerCase() : 'peludito';

  if (mascota.value.tipoReporte === 'ENCONTRADA') {
    if (especie === 'perro') return 'Perrito encontrado';
    if (especie === 'gato') return 'Gatito encontrado';
    return `${mascota.value.especie} encontrad@`;
  } else {
    return `Buscamos a este ${especie}`;
  }
});

// Carga principal de datos
const cargarDetalle = async (idMascota = route.params.id) => {
  cargando.value = true;
  error.value = null;

  try {
    const response = await api.get(`/web/mascotas/detalle/${idMascota}`);
    mascota.value = response.data;
    
    cargando.value = false;
    
    await nextTick();
    initMap();
  } catch (err) {
    console.error("Error al cargar detalle:", err);
    error.value = "No se pudo encontrar la información de esta mascota.";
    cargando.value = false;
  }
};

// Utilidades para las Coincidencias
const obtenerClaseSimilitud = (porcentaje) => {
  if (porcentaje >= 80) return 'fill-alta';
  if (porcentaje >= 50) return 'fill-media';
  return 'fill-baja';
};

const obtenerClaseTipoMatch = (tipo) => {
  if (!tipo) return '';
  return tipo.toUpperCase() === 'ENCONTRADA' ? 'tipo-encontrada-mini' : 'tipo-perdida-mini';
};

watch(() => route.params.id, (nuevoId) => {
  if (nuevoId) {
    cargarDetalle(nuevoId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

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

/* --- Botón de Coincidencias --- */
.btn-ver-match {
  padding: 0.6rem 1.2rem;
  background-color: #ffffff;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  margin-top: 0.5rem;
}

.btn-ver-match:hover { 
  background-color: #007bff; 
  color: #ffffff; 
}

.coincidencia-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
  transition: box-shadow 0.2s ease;
}

.coincidencia-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.estado-mensaje {
  text-align: center;
  padding: 3rem;
  background-color: var(--color-white, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.error {
  color: #dc3545;
}

/* Ficha Principal */
.ficha-mascota {
  background-color: var(--color-white, #ffffff);
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

.badge-success { background-color: #28a745; }
.badge-warning { background-color: #ffc107; color: #000; }
.badge-danger { background-color: #dc3545; }
.badge-default { background-color: #6c757d; }

.titulo-contenedor {
  padding: 1.5rem 2rem;
  text-align: center;
}

.titulo-contenedor h2 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

/* NUEVOS ESTILOS: Fila estética para la fecha y tiempo relativo */
.contenedor-fecha-detalle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin-top: 0.8rem;
  flex-wrap: wrap;
}

.fecha-calendario, .fecha-relativa {
  font-size: 0.95rem;
  color: #4a5568;
  background-color: #edf2f7;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.fecha-relativa {
  background-color: #e2e8f0;
  color: #2d3748;
  font-weight: 600;
}

/* --- ESTILOS BADGES TIPO REPORTE PRINCIPAL --- */
.contenedor-badge-tipo {
  margin-bottom: 0.8rem;
}

.badge-tipo {
  display: inline-block;
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  font-weight: 900;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tipo-perdida {
  background-color: #fff0f0;
  color: #dc3545;
  border: 2px solid #dc3545;
}

.tipo-encontrada {
  background-color: #f0fff4;
  color: #28a745;
  border: 2px solid #28a745;
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
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 5px solid #007bff;
}

.contacto-card { border-left-color: #17a2b8; }

.info-card h3 {
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  font-size: 1.3rem;
}

.icono {
  margin-right: 0.5rem;
  font-style: normal;
}

.lista-datos { list-style: none; padding: 0; }
.lista-datos li { margin-bottom: 0.8rem; font-size: 1.05rem; color: #495057; }
.lista-datos strong { color: #333; display: inline-block; width: 85px; }

/* Footer y Botones */
.ficha-footer {
  padding: 1.5rem 2rem;
  background-color: #f8f9fa;
  text-align: center;
  border-top: 1px solid #eee;
}

.btn-secundario,
.btn-volver {
  padding: 0.8rem 2rem;
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secundario:hover,
.btn-volver:hover {
  background-color: #007bff;
  color: white;
}

/* --- Estilos para Posibles Coincidencias --- */
.coincidencias-card {
  border-left-color: #6f42c1;
  background-color: #f8f9fe;
}

.coincidencias-intro {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.header-match {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}

.header-match h4 {
  margin: 0;
  color: #007bff;
  font-size: 1.1rem;
}

.badge-tipo-mini {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tipo-perdida-mini {
  background-color: #fff0f0;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.tipo-encontrada-mini {
  background-color: #f0fff4;
  color: #28a745;
  border: 1px solid #28a745;
}

.coincidencia-info {
  flex: 1;
  min-width: 200px;
}

.match-desc {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

.coincidencia-score {
  flex: 1;
  min-width: 150px;
  padding: 0 1rem;
}

.score-barra {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.score-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.fill-alta { background-color: #28a745; }
.fill-media { background-color: #ffc107; }
.fill-baja { background-color: #dc3545; }

.score-texto {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

/* --- Estilos del Mapa --- */
.mapa-interactivo {
  height: 350px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ced4da;
  z-index: 1;
  margin-top: 1rem;
}

.coordenadas-texto {
  text-align: right;
  margin-top: 0.5rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .ficha-body {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .imagen-contenedor {
    height: 250px;
  }

  .coincidencia-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .coincidencia-score {
    width: 100%;
    padding: 0;
    margin: 0.5rem 0;
  }
}
</style>