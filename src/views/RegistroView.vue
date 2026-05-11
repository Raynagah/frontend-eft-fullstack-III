<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <h1>Sanos y Salvos</h1>
        <p>Crea tu cuenta de usuario</p>
      </div>

      <form @submit.prevent="registrarUsuario" class="login-form">
        
        <div class="row">
          <div class="input-group">
            <label for="nombre">Nombre Completo</label>
            <input 
              type="text" 
              id="nombre" 
              v-model="formulario.nombre" 
              placeholder="Ej: Juan Pérez" 
              maxlength="100"
              required 
            />
            <small class="hint">{{ formulario.nombre.length }}/100</small>
          </div>
          <div class="input-group">
            <label for="correo">Correo Electrónico</label>
            <input type="email" id="correo" v-model="formulario.correo" placeholder="juan@correo.com" required />
          </div>
        </div>

        <div class="row">
          <div class="input-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" v-model="formulario.password" placeholder="••••••••" required />
          </div>
          <div class="input-group">
            <label for="telefono">Teléfono</label>
            <input type="text" id="telefono" v-model="formulario.telefono" placeholder="+569..." required />
          </div>
        </div>

        <div class="row">
          <div class="input-group">
            <label for="edad">Edad</label>
            <input type="number" id="edad" v-model="formulario.edad" min="18" max="120" required />
          </div>
          <div class="input-group">
            <label for="genero">Género</label>
            <select id="genero" v-model="formulario.genero" required>
              <option value="" disabled>Seleccione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiero no especificar">Prefiero no especificar</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="input-group">
            <label for="ocupacion">Ocupación</label>
            <select id="ocupacion" v-model="formulario.ocupacion" required>
              <option value="" disabled>Seleccione...</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="INSTITUCION">Institución / ONG</option>
              <option value="PARTICULAR">Particular</option>
            </select>
          </div>
          <div class="input-group">
            <label for="direccion">Dirección</label>
            <input type="text" id="direccion" v-model="formulario.direccion" placeholder="Calle, Ciudad" required />
          </div>
        </div>

        <div v-if="error" class="error-box">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="cargando">
          <span v-if="cargando">Procesando...</span>
          <span v-else>Crear mi cuenta</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axiosConfig.js';

const router = useRouter();
const error = ref('');
const cargando = ref(false);

const formulario = ref({
  nombre: '',
  correo: '',
  password: '',
  telefono: '',
  edad: null,
  genero: '',
  ocupacion: '',
  direccion: '',
  fotoUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' // Foto por defecto
});

const registrarUsuario = async () => {
  error.value = '';
  cargando.value = true;

  try {
    // Enviamos el objeto completo al BFF
    await api.post('/auth/registro', formulario.value);
    
    alert(`¡Cuenta creada con éxito! Bienvenido a Sanos y Salvos.`);
    router.push('/login');
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al registrar. Revisa los datos e intenta nuevamente.';
    console.error('Error en registro:', err);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 2rem 1rem;
}

.login-card {
  background-color: var(--color-white);
  width: 100%;
  max-width: 650px; /* Un poco más ancho para las filas de dos columnas */
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(34, 72, 85, 0.1);
}

.brand { margin-bottom: 2rem; text-align: center; }
.brand h1 { color: var(--color-primary); font-weight: 700; margin-bottom: 0.5rem; }

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.input-group label {
  color: var(--color-text);
  font-weight: 600;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.input-group input, 
.input-group select {
  padding: 0.7rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--color-primary);
}

.hint {
  font-size: 0.75rem;
  text-align: right;
  color: #94A3B8;
  margin-top: 2px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-primary:hover:not(:disabled) { background-color: var(--color-text); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.error-box {
  background-color: #FFF5F5;
  color: #E53E3E;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid #E53E3E;
  font-size: 0.9rem;
}

/* Responsivo para celulares */
@media (max-width: 600px) {
  .row {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}
</style>