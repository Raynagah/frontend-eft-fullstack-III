import { defineStore } from 'pinia';
import UsuarioService from '../services/usuarioService';

export const useUsuarioAdminStore = defineStore('usuarioAdmin', {
  // 1. STATE: Donde guardamos la información
  state: () => ({
    usuarios: [],
    cargando: false,
    error: null,
  }),

  // ==========================================
  // GETTERS: Filtros y estadísticas en tiempo real
  // ==========================================
  getters: {
    // Totales
    totalUsuarios: (state) => state.usuarios.length,
    
    // Filtros por Rol
    administradores: (state) => state.usuarios.filter(u => u.tipoUsuario === 'admin'),
    totalAdministradores: (state) => state.usuarios.filter(u => u.tipoUsuario === 'admin').length,
    
    clientes: (state) => state.usuarios.filter(u => u.tipoUsuario === 'cliente'),
    totalClientes: (state) => state.usuarios.filter(u => u.tipoUsuario === 'cliente').length,

    // Usuarios Recientes (Asumiendo que un ID mayor significa registro más reciente)
    usuariosRecientes: (state) => {
      return [...state.usuarios].sort((a, b) => b.id - a.id).slice(0, 5);
    },
  },

  // 3. ACTIONS: Métodos para interactuar con el backend y modificar el state
  actions: {
    // En tu archivo de Pinia/Store
  async cargarUsuarios() {
    this.cargando = true;
    try {
      // IMPORTANTE: Asegúrate de que esta ruta llame al nuevo endpoint del BFF
      const { data } = await UsuarioService.listarUsuarios();
      this.usuarios = data; // Aquí ya debe traer el campo cantidadReportes
      
      // Recalcular totales para las tarjetas de arriba
      this.totalUsuarios = data.length;
      this.totalAdministradores = data.filter(u => u.tipoUsuario === 'admin').length;
      this.totalClientes = data.filter(u => u.tipoUsuario === 'cliente').length;
    } catch (error) {
      this.error = "Error al cargar los usuarios.";
    } finally {
      this.cargando = false;
    }
  },

    async crearUsuario(nuevoUsuario) {
      this.cargando = true;
      this.error = null;
      try {
        const response = await UsuarioService.crearUsuarioAdmin(nuevoUsuario);
        // Agregamos el nuevo usuario a la lista local para evitar recargar toda la página
        this.usuarios.push(response.data);
        return response.data; // Retornamos los datos por si la vista los necesita (ej. para cerrar un modal)
      } catch (error) {
        console.error('Error al crear usuario:', error);
        this.error = error.response?.data?.error || 'Error al crear el usuario';
        throw error; // Lanzamos el error para que el componente vue pueda mostrar una alerta
      } finally {
        this.cargando = false;
      }
    },

    async actualizarUsuario(id, datosActualizados) {
      this.cargando = true;
      this.error = null;
      try {
        const response = await UsuarioService.actualizarUsuarioAdmin(id, datosActualizados);
        // Buscamos el usuario en la lista y lo actualizamos
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          this.usuarios[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        this.error = error.response?.data?.error || 'Error al actualizar el usuario';
        throw error;
      } finally {
        this.cargando = false;
      }
    },

    async eliminarUsuario(id) {
      this.cargando = true;
      this.error = null;
      try {
        await UsuarioService.eliminarUsuario(id);
        // Filtramos la lista local para quitar al usuario eliminado
        this.usuarios = this.usuarios.filter(u => u.id !== id);
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        this.error = error.response?.data?.error || 'Error al eliminar el usuario';
        throw error;
      } finally {
        this.cargando = false;
      }
    },
    async obtenerUsuario(id) {
    this.cargando = true;
    this.error = null;
    try {
      const response = await UsuarioService.obtenerUsuario(id); 
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      this.error = 'No se pudo obtener el usuario';
      throw error;
    } finally {
      this.cargando = false;
    }
    }
  }
  
});