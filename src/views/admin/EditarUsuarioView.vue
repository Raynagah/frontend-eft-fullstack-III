<template>
  <div class="admin-container">
    <div class="admin-content">
      
      <button @click="volverAlPanel" class="btn-back">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver al Panel de Usuarios
      </button>

      <div class="page-header">
        <div>
          <h1 class="main-title">Editar Usuario</h1>
          <p class="subtitle">Actualice la información del perfil y los permisos del sistema.</p>
        </div>
      </div>

      <div v-if="errorMsg" class="error-alert">
        <svg class="icon-alert" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
        <div>
          <strong>No se pudo procesar la solicitud</strong>
          <p>{{ errorMsg }}</p>
        </div>
      </div>

      <div v-if="cargandoDatos" class="loading-state">
        <div class="spinner-large"></div>
        <p>Obteniendo información del usuario...</p>
      </div>

      <UsuarioForm 
        v-else
        :es-editar="true" 
        :datos-iniciales="usuarioCargado"
        :cargando="procesando"
        @guardar="guardarCambios"
        @cancelar="volverAlPanel"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore';
// Recuerda ajustar la ruta del import si metiste el formulario en otra carpeta
import UsuarioForm from '../../components/admin/UsuarioForm.vue'; 

const store = useUsuarioAdminStore();
const router = useRouter();
const route = useRoute(); // <-- Necesario para sacar el ID de la URL

const procesando = ref(false);
const cargandoDatos = ref(true);
const errorMsg = ref('');
const usuarioCargado = ref({});
const usuarioId = route.params.id; // Obtenemos el ID (/admin/usuarios/editar/123)

// Al montar la vista, buscamos los datos de ese usuario específico
onMounted(async () => {
  try {
    // ASUNCIÓN: Estoy usando obtenerUsuario(id), cambia el nombre si en tu store se llama distinto (ej. fetchUsuarioPorId)
    const datos = await store.obtenerUsuario(usuarioId); 
    usuarioCargado.value = datos;
  } catch (error) {
    console.error("Error al cargar el usuario:", error);
    errorMsg.value = "No se pudo cargar la información del usuario. Puede que no exista o haya un problema de conexión.";
  } finally {
    cargandoDatos.value = false;
  }
});

const volverAlPanel = () => {
  router.push('/admin/usuarios'); // Ajusta esta ruta a tu ruta real del listado
};

const guardarCambios = async (datosActualizados) => {
  procesando.value = true;
  errorMsg.value = '';
  
  try {
    // ASUNCIÓN: En tu store debe existir una función para actualizar que reciba ID y Datos
    await store.actualizarUsuario(usuarioId, datosActualizados); 
    
    // Si sale bien, redirigimos al listado
    volverAlPanel();
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    errorMsg.value = error.response?.data?.message || error.message || 'Ocurrió un error inesperado al guardar los cambios.';
  } finally {
    procesando.value = false;
  }
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}

.admin-content {
  max-width: 800px; 
  margin: 0 auto;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color 0.2s ease;
}
.btn-back:hover {
  color: #0f172a;
}

.icon { width: 16px; height: 16px; }
.icon-alert { width: 20px; height: 20px; color: #dc2626; flex-shrink: 0; }

.page-header {
  margin-bottom: 32px;
}

.main-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 6px 0 0 0;
}

.error-alert {
  background-color: #fff5f5;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  font-size: 14px;
}
.error-alert strong { display: block; margin-bottom: 2px; }
.error-alert p { margin: 0; }

/* Estado de carga inicial */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #64748b;
  font-weight: 500;
}

.spinner-large {
  border: 4px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  width: 40px; 
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>