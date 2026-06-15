<template>
  <div class="card">
    <div class="card-image">
      <img 
        :src="imagenMascota" 
        :alt="'Foto de ' + (mascota.nombre || 'mascota')" 
        class="mascota-foto"
      />
      
      <span v-if="mascota.tipoReporte" class="badge badge-tipo" :class="tipoReporteClase">
        {{ tipoReporteTexto }}
      </span>

      <span v-if="mascota.sagaStatus || mascota.estado" class="badge badge-estado" :class="estadoClase">
        {{ mascota.sagaStatus || mascota.estado }}
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

// NUEVO: Formateo de texto del tipo de reporte con emojis descriptivos
const tipoReporteTexto = computed(() => {
  const tipo = (props.mascota.tipoReporte || '').toUpperCase();
  if (tipo === 'PERDIDA') return '🔍 Perdida';
  if (tipo === 'ENCONTRADA') return '🤝 Encontrada';
  return props.mascota.tipoReporte;
});

// NUEVO: Clases dinámicas de color para el tipo de reporte
const tipoReporteClase = computed(() => {
  const tipo = (props.mascota.tipoReporte || '').toUpperCase();
  if (tipo === 'PERDIDA') return 'reporte-perdida';
  if (tipo === 'ENCONTRADA') return 'reporte-encontrada';
  return 'reporte-default';
});

// Computada con la lógica de rescate (búsqueda en título)
const imagenMascota = computed(() => {
  const url = props.mascota.fotografiaUrl || props.mascota.fotoUrl;
  if (url && String(url) !== 'null' && String(url).trim() !== '') {
    return url;
  }
  
  let especie = (props.mascota.especie || '').toLowerCase().trim();

  if (!especie) {
    const contenidoBusqueda = (props.mascota.titulo || '').toLowerCase();
    if (contenidoBusqueda.includes('gato')) {
      especie = 'gato';
    } else if (contenidoBusqueda.includes('perro')) {
      especie = 'perro';
    }
  }

  if (especie === 'gato') return '/img/gato-default.png';
  if (especie === 'perro') return '/img/perro-default.png';
  
  return '/img/mascota-default.png'; 
});

const estadoClase = computed(() => {
  const estado = (props.mascota.sagaStatus || props.mascota.estado || '').toUpperCase();
  if (estado === 'COMPLETED' || estado === 'COMPLETADO') return 'badge-success';
  if (estado === 'PENDING' || estado === 'PENDIENTE') return 'badge-warning';
  if (estado === 'REJECTED' || estado === 'FAILED' || estado === 'RECHAZADO') return 'badge-danger';
  return 'badge-default';
});
</script>

<style scoped>
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

.card-image {
  position: relative;
  height: 200px;
  width: 100%;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 1rem;
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain; 
}

/* --- CLASE BASE PARA BADGES --- */
.badge {
  position: absolute;
  top: 10px;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* Posiciones de los Badges */
.badge-tipo { left: 10px; }
.badge-estado { right: 10px; }

/* NUEVOS COLORES PARA EL TIPO DE REPORTE */
.reporte-perdida { background-color: #e53e3e; }     /* Rojo carmesí llamativo */
.reporte-encontrada { background-color: #0d9488; }  /* Verde esmeralda/Teal */
.reporte-default { background-color: #4a5568; }

/* COLORES PARA ESTADO DE LA SAGA */
.badge-success { background-color: #28a745; }
.badge-warning { background-color: #ffc107; color: #212529; } /* Texto oscuro para mejor contraste */
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