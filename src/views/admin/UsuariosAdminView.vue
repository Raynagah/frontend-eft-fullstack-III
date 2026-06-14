<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Panel de Administración de Usuarios</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p class="text-sm text-gray-500 font-semibold">Total Usuarios</p>
          <p class="text-2xl font-bold text-gray-800">{{ store.totalUsuarios }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p class="text-sm text-gray-500 font-semibold">Administradores</p>
          <p class="text-2xl font-bold text-gray-800">{{ store.totalAdministradores }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p class="text-sm text-gray-500 font-semibold">Clientes</p>
          <p class="text-2xl font-bold text-gray-800">{{ store.totalClientes }}</p>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-700">Lista de Usuarios</h2>
        <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow">
          + Nuevo Usuario
        </button>
      </div>
    </div>

    <div v-if="store.cargando" class="text-center py-10">
      <p class="text-gray-500 text-lg animate-pulse">Cargando usuarios...</p>
    </div>

    <div v-else-if="store.error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
      <p class="font-bold">Error</p>
      <p>{{ store.error }}</p>
    </div>

    <div v-else class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th class="py-3 px-6 text-left">ID</th>
              <th class="py-3 px-6 text-left">Nombre</th>
              <th class="py-3 px-6 text-left">Correo</th>
              <th class="py-3 px-6 text-left">Teléfono</th>
              <th class="py-3 px-6 text-center">Rol</th>
              <th class="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-gray-600 text-sm font-light">
            <tr v-for="usuario in store.usuarios" :key="usuario.id" class="border-b border-gray-200 hover:bg-gray-50">
              <td class="py-3 px-6 text-left font-medium">{{ usuario.id }}</td>
              <td class="py-3 px-6 text-left">
                <span class="font-medium">{{ usuario.nombre }}</span>
              </td>
              <td class="py-3 px-6 text-left">{{ usuario.correo }}</td>
              <td class="py-3 px-6 text-left">{{ usuario.telefono || 'N/A' }}</td>
              <td class="py-3 px-6 text-center">
                <span 
                  :class="usuario.tipoUsuario === 'admin' ? 'bg-purple-200 text-purple-700' : 'bg-green-200 text-green-700'" 
                  class="py-1 px-3 rounded-full text-xs font-bold uppercase">
                  {{ usuario.tipoUsuario }}
                </span>
              </td>
              <td class="py-3 px-6 text-center flex justify-center gap-4">
                <button class="text-blue-500 hover:text-blue-700 transition-colors transform hover:scale-110" title="Editar">
                  ✏️
                </button>
                <button @click="abrirModalEliminar(usuario)" class="text-red-500 hover:text-red-700 transition-colors transform hover:scale-110" title="Eliminar">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="store.usuarios.length === 0">
              <td colspan="6" class="py-6 text-center text-gray-500">No hay usuarios registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar Eliminación</h3>
        <p class="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar al usuario <span class="font-bold text-gray-800">{{ usuarioSeleccionado?.nombre }}</span>? Esta acción no se puede deshacer.
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="cerrarModal" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
            :disabled="eliminando">
            Cancelar
          </button>
          <button 
            @click="ejecutarEliminacion" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
            :disabled="eliminando">
            <span v-if="eliminando" class="animate-spin">⏳</span>
            {{ eliminando ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore';

const store = useUsuarioAdminStore();

// Variables reactivas para el Modal
const mostrarModal = ref(false);
const usuarioSeleccionado = ref(null);
const eliminando = ref(false);

onMounted(() => {
  store.cargarUsuarios();
});

// Función para abrir el modal y guardar qué usuario queremos borrar
const abrirModalEliminar = (usuario) => {
  usuarioSeleccionado.value = usuario;
  mostrarModal.value = true;
};

// Función para cerrar el modal y limpiar el usuario seleccionado
const cerrarModal = () => {
  mostrarModal.value = false;
  usuarioSeleccionado.value = null;
};

// Función que realmente ejecuta la acción contra el backend
const ejecutarEliminacion = async () => {
  if (!usuarioSeleccionado.value) return;
  
  eliminando.value = true;
  try {
    await store.eliminarUsuario(usuarioSeleccionado.value.id);
    cerrarModal();
  } catch (error) {
    // El error ya se guarda en el store, así que la vista lo mostrará arriba
    console.error("Falló la eliminación", error);
  } finally {
    eliminando.value = false;
  }
};
</script>