<template>
  <div class="admin-container">
    <div class="admin-content">
      
      <button @click="volverAlPanel" class="btn-back">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver al Panel de Usuarios
      </button>

      <div class="page-header">
        <div>
          <h1 class="main-title">Registrar Nuevo Usuario</h1>
          <p class="subtitle">Complete los campos requeridos corporativos para asignar un nuevo acceso al sistema.</p>
        </div>
      </div>

      <div v-if="errorMsg" class="error-alert">
        <svg class="icon-alert" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
        <div>
          <strong>No se pudo crear el usuario</strong>
          <p>{{ errorMsg }}</p>
        </div>
      </div>

      <UsuarioForm 
        :es-editar="false" 
        :cargando="procesando"
        @guardar="guardarNuevoUsuario"
        @cancelar="volverAlPanel"
      />

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore.js';
import UsuarioForm from '../../components/admin/UsuarioForm.vue'; // Ruta a tu componente reutilizable

const store = useUsuarioAdminStore();
const router = useRouter();

const procesando = ref(false);
const errorMsg = ref('');

const volverAlPanel = () => {
  router.push('/admin/usuarios'); // Ajusta esta ruta a tu ruta real del listado
};

const guardarNuevoUsuario = async (datosFormulario) => {
  procesando.value = true;
  errorMsg.value = '';
  
  try {
    // LLamada al método de tu store
    await store.crearUsuario(datosFormulario); 
    
    // Si sale bien, redirigimos de vuelta al listado limpio
    volverAlPanel();
  } catch (error) {
    console.error("Error creando usuario:", error);
    errorMsg.value = error.message || 'Ocurrió un error inesperado al guardar.';
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
  max-width: 800px; /* Un poco más angosto para formularios se ve más ordenado */
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
</style>