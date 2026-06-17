<template>
  <div class="bandeja-container">
    <div class="header-bandeja">
      <h2>Mis Notificaciones</h2>
      
      <div class="filtros">
        <button 
          :class="{ activo: filtroActual === 'todas' }" 
          @click="filtroActual = 'todas'"
        >
          Todas <span class="badge">{{ totalTodas }}</span>
        </button>
        
        <button 
          :class="{ activo: filtroActual === 'noleidas' }" 
          @click="filtroActual = 'noleidas'"
        >
          No Leídas <span class="badge" :class="{'badge-noleidas': totalNoLeidas > 0}">{{ totalNoLeidas }}</span>
        </button>
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando notificaciones...</div>
    
    <div v-else-if="notificacionesFiltradas.length === 0" class="empty-state">
      No tienes notificaciones en esta categoría.
    </div>

    <div v-else class="lista-notificaciones">
      <div 
        v-for="notificacion in notificacionesFiltradas" 
        :key="notificacion.id"
        class="notif-card"
        :class="{ 'no-leida': !notificacion.leido }"
      >
        <div class="notif-content">
          <span v-if="!notificacion.leido" class="punto-nuevo"></span>
          <div class="textos">
            <p>{{ notificacion.mensaje }}</p>
            </div>
        </div>

        <div class="notif-acciones">
          <button 
            v-if="!notificacion.leido"
            class="btn-leer btn-solo-check" 
            @click="marcarComoLeidaSola(notificacion)"
            title="Marcar como leída"
          >
            ✓
          </button>

          <button 
            class="btn-leer btn-ir" 
            @click="irADetalle(notificacion)"
          >
            Ir al reporte ➔
          </button>

          <button 
            class="btn-leer btn-eliminar" 
            @click="eliminarNotificacionSola(notificacion)"
            title="Eliminar notificación"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axiosConfig.js';

const router = useRouter();
const notificaciones = ref([]);
const cargando = ref(true);
const filtroActual = ref('todas');

const totalTodas = computed(() => notificaciones.value.length);
const totalNoLeidas = computed(() => notificaciones.value.filter(n => !n.leido).length);

const notificacionesFiltradas = computed(() => {
  let lista = notificaciones.value;
  if (filtroActual.value === 'noleidas') {
    lista = lista.filter(n => !n.leido);
  }
  return [...lista].sort((a, b) => a.leido - b.leido);
});

const cargarBandeja = async () => {
  try {
    cargando.value = true;
    const usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw) return;
    
    const usuario = JSON.parse(usuarioRaw);
    const response = await api.get(`/web/notificaciones/usuario/${usuario.id}`);
    notificaciones.value = response.data;
  } catch (error) {
    console.error("Error al cargar la bandeja", error);
  } finally {
    cargando.value = false;
  }
};

const marcarComoLeidaSola = async (notif) => {
  try {
    await api.put(`/web/notificaciones/${notif.id}/leer`);
    notif.leido = true;
  } catch (error) {
    console.error("Error al actualizar estado", error);
  }
};

const eliminarNotificacionSola = async (notif) => {
  // Confirmación opcional para evitar clicks accidentales
  if (!confirm("¿Estás seguro de que deseas eliminar esta notificación?")) return;
  
  try {
    await api.delete(`/web/notificaciones/${notif.id}`);
    
    // Filtramos el arreglo local para removerla visualmente de inmediato
    notificaciones.value = notificaciones.value.filter(n => n.id !== notif.id);
  } catch (error) {
    console.error("Error al eliminar la notificación:", error);
  }
};

const irADetalle = async (notif) => {
  try {
    // 1. Marca como leída si no lo está
    if (!notif.leido) {
      await api.put(`/web/notificaciones/${notif.id}/leer`);
      notif.leido = true;
    }
    
    // 2. Obtiene el ID (en tu DTO le pusimos reporteId)
    const idDestino = notif.mascotaId || notif.reporteId; 
    
    console.log("Notificación completa:", notif); // <-- Para debug
    console.log("Intentando ir al ID:", idDestino); // <-- Para debug
    
    // 3. Redirige a la ruta correcta
    if (idDestino) {
      router.push(`/detalle/${idDestino}`); // <-- CAMBIAMOS /mascotas/ por /detalle/
    } else {
      console.warn("La notificación no tiene un ID de reporte asociado.");
    }
  } catch (error) {
    console.error("Error en la redirección:", error);
  }
};

onMounted(() => {
  cargarBandeja();
});
</script>

<style scoped>
.bandeja-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.header-bandeja {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

h2 {
  color: #2d3436;
  margin: 0;
}

/* Filtros */
.filtros {
  display: flex;
  gap: 10px;
}

.filtros button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  transition: all 0.2s ease;
}

.filtros button.activo {
  background: var(--color-accent, #e78e3a);
  color: white;
  border-color: var(--color-accent, #e78e3a);
}

/* Tarjetas */
.notif-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  border-left: 4px solid transparent;
  transition: background 0.2s;
}

.no-leida {
  border-left-color: #ff6b6b;
  background-color: #fff9f9;
}

.notif-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.textos p {
  margin: 0;
  color: #444;
  line-height: 1.4;
}

.punto-nuevo {
  min-width: 10px;
  height: 10px;
  background-color: #ff6b6b;
  border-radius: 50%;
  margin-top: 6px;
}

/* Botones */
.notif-acciones {
  display: flex;
  gap: 10px;
}

.btn-leer {
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-solo-check {
  background: transparent;
  border: 1px solid #4ecdc4;
  color: #4ecdc4;
}

.btn-solo-check:hover {
  background: #4ecdc4;
  color: white;
}

.btn-ir {
  background: #f1f3f5;
  color: #3b4144;
}

.btn-ir:hover {
  background: #e2e6ea;
  color: black;
}

.loading, .empty-state {
  text-align: center;
  color: #666;
  padding: 3rem;
}

.btn-eliminar {
  background: transparent;
  border: 1px solid #ff4757;
  color: #ff4757;
}

.btn-eliminar:hover {
  background: #ff4757;
  color: white;
}

.badge {
  display: inline-block;
  background: #f1f3f5;
  color: #666;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
  margin-left: 6px;
  font-weight: bold;
  transition: all 0.2s ease;
}

/* Cuando el botón está activo, adaptamos el color del badge */
.filtros button.activo .badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Estilo especial para resaltar cuando hay no leídas (solo si el botón no está activo) */
.filtros button:not(.activo) .badge-noleidas {
  background: #ffe3e3;
  color: #ff4757;
}
</style>