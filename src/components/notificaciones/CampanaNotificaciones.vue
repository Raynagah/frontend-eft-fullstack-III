<template>
  <div class="notificaciones-wrapper">
    <div class="campana-btn" @click="toggleDropdown">
      🔔
      <span v-if="noLeidas.length > 0" class="badge-notif">{{ noLeidas.length }}</span>
    </div>

    <div v-if="isOpen" class="dropdown-notif">
      <div class="dropdown-header">
        <h4>Notificaciones</h4>
      </div>
      
      <div v-if="noLeidas.length === 0" class="notif-vacia">
        No tienes notificaciones nuevas.
      </div>
      
      <ul v-else class="notif-lista">
        <li 
          v-for="notif in noLeidas.slice(0, 5)" 
          :key="notif.id" 
          @click="irADetalle(notif)"
          class="notif-item"
        >
          <div class="notif-texto">{{ notif.mensaje }}</div>
        </li>
      </ul>

      <div class="dropdown-footer">
        <router-link to="/notificaciones" @click="cerrarDropdown">
          Ver toda la bandeja
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../api/axiosConfig.js';

const router = useRouter();
const isOpen = ref(false);
const notificaciones = ref([]);

const noLeidas = computed(() => {
  return notificaciones.value.filter(n => !n.leido);
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) cargarNotificaciones(); 
};

const cerrarDropdown = () => {
  isOpen.value = false;
};

const cargarNotificaciones = async () => {
  try {
    const usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw) return;
    
    const usuario = JSON.parse(usuarioRaw);
    const response = await api.get(`/web/notificaciones/usuario/${usuario.id}`);
    notificaciones.value = response.data;
  } catch (error) {
    console.error("Error cargando notificaciones", error);
  }
};

const irADetalle = async (notif) => {
  try {
    await api.put(`/web/notificaciones/${notif.id}/leer`);
    cerrarDropdown();
    
    const idDestino = notif.mascotaId || notif.reporteId; 
    if (idDestino) {
      router.push(`/mascotas/${idDestino}`); 
    }
  } catch (error) {
    console.error("Error marcando como leída", error);
  }
};

onMounted(() => {
  cargarNotificaciones();
});
</script>

<style scoped>
/* Estilos simplificados solo para el dropdown */
.notificaciones-wrapper {
  position: relative;
  display: inline-block;
}

.campana-btn {
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
  padding: 5px;
  user-select: none;
}

.badge-notif {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ff4757;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
}

.dropdown-notif {
  position: absolute;
  top: 120%;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #eee;
}

.dropdown-header {
  padding: 12px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.dropdown-header h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.notif-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
}

.notif-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f1f1f1;
  cursor: pointer;
  transition: background 0.2s;
  border-left: 3px solid #ff6b6b; /* Indicador sutil de no leída */
}

.notif-item:hover {
  background: #f5f5f5;
}

.notif-texto {
  font-size: 0.85rem;
  color: #444;
  line-height: 1.3;
}

.notif-vacia {
  padding: 20px;
  text-align: center;
  color: #777;
  font-size: 0.9rem;
}

.dropdown-footer {
  padding: 12px;
  text-align: center;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.dropdown-footer a {
  color: var(--color-primary, #388a98);
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9rem;
}

.dropdown-footer a:hover {
  text-decoration: underline;
}
</style>