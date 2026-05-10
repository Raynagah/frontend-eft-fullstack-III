<template>
  <div class="card">
    <div class="card-image">
      <img src="https://via.placeholder.com/300x200?text=Foto+Mascota" alt="Foto de la mascota" />
      
      <span class="badge" :class="estadoClase">
        {{ mascota.estado }}
      </span>
    </div>

    <div class="card-content">
      <h3 class="card-title">{{ mascota.nombre }}</h3>
      
      <p class="card-resumen">{{ mascota.resumen }}</p>
    </div>

    <div class="card-actions">
      <router-link :to="`/detalle/${mascota.id}`" class="btn-detalle">
        Ver Detalle
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Recibimos el objeto mascota como Prop desde el componente padre
const props = defineProps({
  mascota: {
    type: Object,
    required: true
  }
});

// Computed property para darle un color dinámico a la etiqueta según el estado de la saga
const estadoClase = computed(() => {
  const estado = props.mascota.estado ? props.mascota.estado.toUpperCase() : '';
  if (estado === 'COMPLETED') return 'badge-success';
  if (estado === 'PENDING') return 'badge-warning';
  if (estado === 'REJECTED' || estado === 'FAILED') return 'badge-danger';
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
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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
}

/* Colores dinámicos para los estados de la Saga */
.badge-success { background-color: #28a745; }
.badge-warning { background-color: var(--color-accent); }
.badge-danger { background-color: #dc3545; }
.badge-default { background-color: var(--color-primary); }

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