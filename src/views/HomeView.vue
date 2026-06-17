<template>
  <div class="home-container">
    <section class="home-hero">
      <div class="hero-content">
        <h1>Bienvenido a Sanos y Salvos</h1>
        <p>Ayudamos a que las mascotas vuelvan a su hogar. Tu reporte puede hacer la diferencia.</p>
        <div class="hero-actions">
          <router-link to="/reportar" class="btn btn-primary">Reportar Mascota</router-link>
          <router-link to="/mascotas" class="btn btn-secondary">Ver listado completo</router-link>
        </div>
        <p class="hero-auth-note">⚠️ Recuerda que necesitas iniciar sesión para crear un reporte.</p>
      </div>
    </section>

    <section class="recent-reports">
      <h2>Últimos reportes publicados</h2>
      <div v-if="cargando" class="loading">Cargando rescates...</div>
      
      <div v-else-if="ultimosReportes.length === 0" class="empty-state">
        <p>Aún no hay reportes activos en la plataforma.</p>
      </div>

      <div v-else class="mascotas-grid">
        <div v-for="mascota in ultimosReportes" :key="mascota.id" class="mascota-card">
          <img :src="mascota.fotografiaUrl || 'https://via.placeholder.com/300x200?text=Sin+Foto'" :alt="mascota.nombre" class="card-img" />
          
          <div class="card-body">
            <span :class="['badge', mascota.tipoReporte.toLowerCase()]">
              {{ mascota.tipoReporte === 'PERDIDA' ? 'Perdida' : 'Encontrada' }}
            </span>
            
            <div class="card-header-row">
              <h3>{{ mascota.nombre || 'Mascota sin nombre' }}</h3>
              <span v-if="obtenerTiempoRelativo(mascota.fechaReporte)" class="card-time" :title="mascota.fechaReporte">
                🕒 {{ obtenerTiempoRelativo(mascota.fechaReporte) }}
              </span>
            </div>

            <p class="resumen">{{ mascota.resumen }}</p>
            <router-link :to="`/detalle/${mascota.id}`" class="enlace-detalle">Ver detalle</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="how-it-works">
      <h2>¿Cómo funciona el proceso?</h2>
      <div class="steps-grid">
        <div class="step">
          <div class="step-icon">🔐</div>
          <h3>1. Cuenta Activa</h3>
          <p>Regístrate e inicia sesión de forma segura para proteger tus datos de contacto.</p>
        </div>
        <div class="step">
          <div class="step-icon">📝</div>
          <h3>2. Reporta</h3>
          <p>Ingresa los detalles, coordenadas y una fotografía de la mascota perdida o encontrada.</p>
        </div>
        <div class="step">
          <div class="step-icon">🔍</div>
          <h3>3. Coincidencias</h3>
          <p>Nuestro motor inteligente buscará mascotas similares reportadas en tu misma zona geográfica.</p>
        </div>
        <div class="step">
          <div class="step-icon">🤝</div>
          <h3>4. Reencuentro</h3>
          <p>Ponte en contacto directo con la comunidad para gestionar la devolución segura del animal.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axiosConfig.js'; 

const ultimosReportes = ref([]);
const cargando = ref(true);

// NUEVO: Función para formatear el tiempo relativo directamente en las tarjetas del bucle
const obtenerTiempoRelativo = (fechaString) => {
  if (!fechaString) return '';

  const fechaReporte = new Date(fechaString);
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
    return semanas === 1 ? 'Hace 1 sem.' : `Hace ${semanas} sem.`;
  }
  
  const meses = Math.floor(diferenciaDias / 30);
  return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
};

const cargarUltimosReportes = async () => {
  try {
    const response = await api.get('/web/mascotas');
    const todasLasMascotas = response.data.content || response.data;

    ultimosReportes.value = todasLasMascotas
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);

  } catch (error) {
    console.error("Error al cargar los últimos reportes:", error);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarUltimosReportes();
});
</script>

<style scoped>
.home-container {
  --color-primary: #ff6b6b;
  --color-primary-hover: #ff5252;
  --color-secondary: #4ecdc4;
  --color-secondary-hover: #45b7aa;
  --color-text: #2d3436;
  --color-bg-light: #f9f9f9;
  
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--color-text);
}

/* --- HERO --- */
.home-hero {
  background: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop') center/cover;
  color: white;
  text-align: center;
  padding: 6rem 1rem;
  border-radius: 0 0 20px 20px;
  margin-bottom: 3rem;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.hero-auth-note {
  font-size: 0.95rem !important;
  color: #ffeaa7;
  font-style: italic;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
}

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background-color: var(--color-secondary-hover);
  transform: translateY(-2px);
}

/* --- RECENT REPORTS --- */
.recent-reports, .how-it-works {
  max-width: 1200px;
  margin: 0 auto 4rem auto;
  padding: 0 1rem;
}

h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--color-text);
}

.mascotas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.mascota-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.mascota-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.badge {
  align-self: flex-start;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
}

.badge.perdida { background-color: var(--color-primary); }
.badge.encontrada { background-color: var(--color-secondary); }

/* NUEVO: Contenedor flex para alinear título y la fecha de forma responsiva */
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.card-body h3 {
  font-size: 1.1rem;
  margin: 0;
}

/* NUEVO: Estilo estético para la fecha en el Home (abreviado sem. para ajustar espacio) */
.card-time {
  font-size: 0.72rem;
  color: #555555;
  background-color: #f1f3f5;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  white-space: nowrap;
  font-weight: 500;
}

.resumen {
  font-size: 0.9rem;
  color: #666;
  flex-grow: 1;
  margin-bottom: 1rem;
}

.enlace-detalle {
  color: var(--color-secondary);
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9rem;
}

/* --- HOW IT WORKS --- */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  text-align: center;
}

.step {
  padding: 2rem 1.5rem;
  background-color: var(--color-bg-light);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-icon {
  font-size: 2.8rem;
  margin-bottom: 1rem;
}

.step h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.step p {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.loading, .empty-state {
  text-align: center;
  color: #666;
  font-size: 1.2rem;
  padding: 2rem;
}
</style>