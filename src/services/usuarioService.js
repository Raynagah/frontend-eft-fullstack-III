import api from '../api/axiosConfig';

// Definimos la ruta base del BFF para la gestión de administradores
const ADMIN_PATH = '/web/admin/usuarios';

const UsuarioService = {
  // ==========================================
  // PANEL DE ADMINISTRADOR
  // ==========================================

  // Obtener todos los usuarios para la tabla
  listarUsuarios() {
    return api.get(`${ADMIN_PATH}/admin/listar`);
  },

  // Obtener un usuario específico por su ID (Ruta pública/general del BFF)
  obtenerUsuario(id) {
    return api.get(`/web/usuarios/${id}`);
  },

  // Crear un nuevo usuario (Admin o Cliente)
  crearUsuarioAdmin(usuarioData) {
    return api.post(ADMIN_PATH, usuarioData);
  },

  // Actualizar cualquier usuario (incluyendo cambiar su rol)
  actualizarUsuarioAdmin(id, usuarioData) {
    return api.put(`${ADMIN_PATH}/${id}`, usuarioData);
  },

  // Eliminar un usuario
  eliminarUsuario(id) {
    return api.delete(`${ADMIN_PATH}/${id}`);
  }

  
};

export default UsuarioService;