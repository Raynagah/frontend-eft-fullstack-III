<template>
  <div v-if="tabActual === 'datos'" class="tab-content fade-in">
      <div class="form-card">
        <div class="card-header">
          <div class="header-user-info">
            <div class="avatar-circle">
              {{ inicialNombre }}
            </div>
            <div class="user-titles">
              <h3>Información Personal</h3>
              <span class="user-badge" v-if="usuario.rol">{{ usuario.rol }}</span>
            </div>
          </div>
          
          <button v-if="!modoEdicion && !cargandoDatos" @click="iniciarEdicion" class="btn-editar">
            ✏️ Editar Perfil
          </button>
        </div>
        
        <div v-if="cargandoDatos" class="loader">Cargando...</div>
        
        <div v-else-if="!modoEdicion" class="perfil-view">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nombre Completo</span>
              <span class="value">{{ usuario.nombre }}</span>
            </div>
            <div class="info-item">
              <span class="label">Correo Electrónico</span>
              <span class="value">{{ usuario.correo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Teléfono</span>
              <span class="value">{{ usuario.telefono }}</span>
            </div>
            <div class="info-item">
              <span class="label">Edad</span>
              <span class="value">{{ usuario.edad ? usuario.edad + ' años' : 'No especificada' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Género</span>
              <span class="value">{{ usuario.genero || 'No especificado' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Ocupación</span>
              <span class="value">{{ usuario.ocupacion || 'No especificada' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Dirección</span>
              <span class="value">{{ usuario.direccion || 'No especificada' }}</span>
            </div>
          </div>
          <div v-if="mensajeExito" class="alert success mt-2">{{ mensajeExito }}</div>
        </div>

        <form v-else @submit.prevent="guardarDatos" class="perfil-form fade-in">
          <p class="form-subtitle">Modifica los campos que necesites actualizar.</p>
          
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Nombre Completo*</label>
              <input type="text" v-model="usuario.nombre" required>
            </div>
            <div class="form-group flex-1">
              <label>Edad*</label>
              <input type="number" v-model="usuario.edad" min="18" max="100" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Género*</label>
              <select v-model="usuario.genero" required>
                <option value="" disabled>Selecciona...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Teléfono*</label>
              <input type="tel" v-model="usuario.telefono" required>
            </div>
          </div>

          <div class="form-group">
            <label>Ocupación</label>
            <input type="text" v-model="usuario.ocupacion" placeholder="Ej: Veterinario, Estudiante...">
          </div>

          <div class="form-group">
            <label>Dirección</label>
            <input type="text" v-model="usuario.direccion" placeholder="Calle, Número, Ciudad">
          </div>

          <div v-if="errorDatos" class="alert error">{{ errorDatos }}</div>

          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="cancelarEdicion" :disabled="guardando">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="tabActual === 'reportes'" class="tab-content fade-in">
       <div v-if="misReportes.length === 0" class="empty-state">
          <h3>No tienes reportes activos</h3>
       </div>
       <div v-else class="mascotas-grid">
          <MascotaCard v-for="m in misReportes" :key="m.id" :mascota="m" />
       </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api/axiosConfig.js';
import MascotaCard from '../components/mascotas/MascotaCard.vue';

const modoEdicion = ref(false);
const usuarioOriginal = ref({}); // Guardará un respaldo de los datos
const tabActual = ref('datos');
const usuarioId = ref(null);

// Lógica para obtener la inicial del nombre para el Avatar
const inicialNombre = computed(() => {
  if (usuario.value && usuario.value.nombre) {
    return usuario.value.nombre.charAt(0).toUpperCase();
  }
  return '👤';
});

// Estado del formulario ampliado
const usuario = ref({
  nombre: '',
  edad: null,
  genero: '',
  telefono: '',
  ocupacion: '',
  direccion: '',
  correo: '', // Solo para mostrar
  fotoUrl: ''
});

const cargandoDatos = ref(true);
const guardando = ref(false);
const mensajeExito = ref('');
const errorDatos = ref('');
const misReportes = ref([]);

onMounted(async () => {
  const userStorage = localStorage.getItem('usuario');
  if (userStorage) {
    const userParseado = JSON.parse(userStorage);
    usuarioId.value = userParseado.id;
    await cargarDatosPersonales();
    await cargarMisReportes();
  }
});

const cargarDatosPersonales = async () => {
  try {
    const response = await api.get(`/web/usuarios/${usuarioId.value}`);
    usuario.value = { ...usuario.value, ...response.data };
    // Guardamos una copia exacta para poder restaurar si cancelan
    usuarioOriginal.value = JSON.parse(JSON.stringify(usuario.value)); 
  } catch (error) {
    errorDatos.value = "Error al cargar datos.";
  } finally {
    cargandoDatos.value = false;
  }
};

const iniciarEdicion = () => {
  errorDatos.value = '';
  modoEdicion.value = true;
};

const cancelarEdicion = () => {
  // Restauramos los datos desde la copia original
  usuario.value = JSON.parse(JSON.stringify(usuarioOriginal.value));
  modoEdicion.value = false;
  errorDatos.value = '';
};

const guardarDatos = async () => {
  guardando.value = true;
  mensajeExito.value = '';
  errorDatos.value = '';

  try {
    const payload = {
      nombre: usuario.value.nombre,
      edad: parseInt(usuario.value.edad),
      genero: usuario.value.genero,
      telefono: usuario.value.telefono,
      ocupacion: usuario.value.ocupacion,
      direccion: usuario.value.direccion,
      fotoUrl: usuario.value.fotoUrl
    };

    const response = await api.put(`/web/usuarios/${usuarioId.value}`, payload);
    
    // Actualizamos tanto el usuario actual como la copia de respaldo
    usuario.value = { ...usuario.value, ...response.data };
    usuarioOriginal.value = JSON.parse(JSON.stringify(usuario.value));
    
    // Salimos del modo edición al guardar con éxito
    modoEdicion.value = false;
    mensajeExito.value = "¡Perfil actualizado con éxito!";
    
    setTimeout(() => { mensajeExito.value = ''; }, 3000);
  } catch (error) {
    console.error(error);
    errorDatos.value = "No se pudo actualizar. Revisa que todos los campos obligatorios (*) estén llenos.";
  } finally {
    guardando.value = false;
  }
};

const cargarMisReportes = async () => {
  try {
    const response = await api.get(`/web/usuarios/${usuarioId.value}/reportes`);
    misReportes.value = response.data;
  } catch (e) { console.error(e); }
};
</script>

<style scoped>

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1.5rem;
}

.header-user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-circle {
  width: 70px;
  height: 70px;
  background-color: var(--color-primary, #388A98);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(56, 138, 152, 0.3);
}

.user-titles h3 {
  margin: 0 0 0.3rem 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.user-badge {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.card-header h3 {
  margin: 0;
}

.btn-editar {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Modo Lectura Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.info-item .value {
  font-size: 1.05rem;
  color: #2c3e50;
  font-weight: 500;
}

/* Botones del formulario */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancelar {
  flex: 1;
  padding: 1rem;
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #e2e6ea;
}

.btn-guardar {
  flex: 2;
  /* (Mismos estilos que ya tenías para btn-guardar) */
}

.mt-2 {
  margin-top: 1rem;
}
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.perfil-form select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  background-color: white;
}
.perfil-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.header-section {
    text-align: center;
    margin-bottom: 2rem;
}

.header-section h2 {
    color: var(--color-primary, #2c3e50);
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
}

.header-section p {
    color: #6c757d;
}

/* --- TABS --- */
.tabs-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 1rem;
}

.tab-btn {
    background: none;
    border: none;
    padding: 0.8rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #6c757d;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab-btn:hover {
    background-color: #f8f9fa;
}

.tab-btn.active {
    color: white;
    background-color: var(--color-primary, #007bff);
}

.fade-in {
    animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* --- FORMULARIO --- */
.form-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    max-width: 600px;
    margin: 0 auto;
}

.form-card h3 {
    margin-top: 0;
    color: #2c3e50;
}

.form-subtitle {
    color: #6c757d;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #343a40;
}

.form-group input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ced4da;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--color-primary, #007bff);
}

.readonly-input {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

.btn-guardar {
    width: 100%;
    padding: 1rem;
    background-color: var(--color-primary, #007bff);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.3s;
}

.btn-guardar:hover:not(:disabled) {
    opacity: 0.9;
}

.btn-guardar:disabled {
    background-color: #6c757d;
    cursor: wait;
}

/* --- ESTADOS Y MENSAJES --- */
.alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
    text-align: center;
}

.alert.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.loader {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    font-weight: 500;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

/* --- GRILLA DE REPORTES --- */
.mascotas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
}
</style>