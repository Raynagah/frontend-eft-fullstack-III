<template>
  <div class="card">
    <div class="card-image">
      <img 
        :src="imagenMascota" 
        :alt="'Foto de ' + (mascota.nombre || 'mascota')" 
        class="mascota-foto"
      />
      
      <span class="badge" :class="estadoClase">
        {{ mascota.sagaStatus || mascota.estado || mascota.tipoReporte }}
      </span>
    </div>

    <div class="card-content">
      <h3 class="card-title">{{ mascota.nombre || 'Sin nombre' }}</h3>
      
      <p class="card-resumen">{{ mascota.resumen }}</p>
    </div>

    <div class="card-actions">
      <router-link :to="`/detalle/${mascota.id || mascota.mascotaId}`" class="btn-detalle">
        Ver Detalle
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mascota: {
    type: Object,
    required: true
  }
});

// Computada con la lógica de rescate (búsqueda en título)
const imagenMascota = computed(() => {
  // 1. Prioridad: URL de fotografía si existe
  const url = props.mascota.fotografiaUrl || props.mascota.fotoUrl;
  if (url && String(url) !== 'null' && String(url).trim() !== '') {
    return url;
  }
  
  // 2. Intentar obtener especie directamente (por si acaso)
  let especie = (props.mascota.especie || '').toLowerCase().trim();

  // 3. ESTRATEGIA DE RESCATE: Si especie viene vacío, buscamos en el título
  if (!especie) {
    // Buscamos "perro" o "gato" en el título
    const contenidoBusqueda = (props.mascota.titulo || '').toLowerCase();

    if (contenidoBusqueda.includes('gato')) {
      especie = 'gato';
    } else if (contenidoBusqueda.includes('perro')) {
      especie = 'perro';
    }
  }

  // 4. Retornar imagen según la especie encontrada o deducida
  if (especie === 'gato') return '/img/gato-default.png';
  if (especie === 'perro') return '/img/perro-default.png';
  
  // 5. Fallback final si nada funcionó
  return '/img/mascota-default.png'; 
});

const estadoClase = computed(() => {
  const estado = (props.mascota.sagaStatus || props.mascota.estado || '').toUpperCase();
  if (estado === 'COMPLETED') return 'badge-success';
  if (estado === 'PENDING') return 'badge-warning';
  if (estado === 'REJECTED' || estado === 'FAILED') return 'badge-danger';
  return 'badge-default';
});
</script>

<style scoped>
/* Estilos generales de la tarjeta (Intactos) */
.card {
  background-color: var(--color-white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* --- MODIFICACIÓN AQUÍ --- */
.card-image {
  position: relative;
  height: 200px;
  width: 100%;
  background-color: #f8f9fa; /* Fondo gris suave para cuando la imagen no llena todo */
  
  /* Centrado perfecto del ícono */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Asegura que NADA se salga */
  padding: 1rem; /* Espaciado para que el ícono no toque los bordes */
}

.card-image img {
  /* Evitamos que se estire innecesariamente */
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  
  /* Contain: Se ajusta al tamaño máximo sin cortarse ni deformarse */
  object-fit: contain; 
}
/* --- FIN MODIFICACIÓN --- */

/* Resto de estilos (Intactos) */
.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  z-index: 2; /* Asegurar que esté sobre la foto */
}

.badge-success { background-color: #28a745; }
.badge-warning { background-color: var(--color-accent, #ffc107); }
.badge-danger { background-color: #dc3545; }
.badge-default { background-color: var(--color-primary, #007bff); }

.card-content {
  padding: 1.5rem;
  flex-grow: 1;
}

.card-title {
  color: var(--color-primary);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.card-resumen {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
}

.card-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.btn-detalle {
  display: inline-block;
  width: 100%;
  padding: 0.6rem 0;
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-detalle:hover {
  background-color: var(--color-primary);
  color: white;
}
</style>