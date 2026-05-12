<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <h1>Sanos y Salvos</h1>
        <p>Bienvenido de vuelta</p>
      </div>

      <form @submit.prevent="iniciarSesion" class="login-form">
        <div class="input-group">
          <label for="correo">Correo Electrónico</label>
          <input type="email" id="correo" v-model="correo" placeholder="ejemplo@correo.com" required />
        </div>

        <div class="input-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" placeholder="••••••••" required />
        </div>

        <div v-if="error" class="error-box">
          {{ error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="cargando">
          <span v-if="cargando">Iniciando sesión...</span>
          <span v-else>Entrar</span>
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

const correo = ref('');
const password = ref('');
const error = ref('');
const cargando = ref(false);

const iniciarSesion = async () => {
  error.value = '';
  cargando.value = true;

  try {
    // Apuntamos a la ruta pública del BFF
    const response = await api.post('/auth/login', {
      correo: correo.value,
      password: password.value
    });

    // Extraemos los datos que envía ms-usuarios a través del BFF
    const { token, sessionId, usuario } = response.data;

    // Guardamos las credenciales de seguridad
    localStorage.setItem('token', token);
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('usuario', JSON.stringify(usuario));

    // Agregamos la retroalimentación
    alert(`¡Bienvenido de vuelta, ${usuario.nombre}!`);

    // Redirigimos al usuario a la lista de mascotas
    router.push('/mascotas');

  } catch (err) {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      error.value = 'Correo o contraseña incorrectos.';
    } else {
      error.value = 'Error al conectar con el servidor. Intenta más tarde.';
    }
    console.error('Error en el login:', err);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
/* Usamos variables CSS globales para el diseño */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 1rem;
}

.login-card {
  background-color: var(--color-white);
  width: 100%;
  max-width: 400px;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(34, 72, 85, 0.1);
  /* Sombra usando color-text con opacidad */
  text-align: center;
}

.brand {
  margin-bottom: 2rem;
}

.brand h1 {
  color: var(--color-primary);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.brand p {
  color: var(--color-text);
  font-size: 1rem;
  opacity: 0.8;
}

.login-form {
  display: flex;
  flex-direction: column;
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
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.input-group input {
  padding: 0.8rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  color: var(--color-text);
  transition: all 0.3s ease;
  outline: none;
}

.input-group input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(56, 138, 152, 0.15);
  /* Efecto de resplandor primario */
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-text);
  /* Cambia al azul oscuro en hover */
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background-color: #A0C4C9;
  /* Un tono apagado del primary */
  cursor: not-allowed;
}

.error-box {
  background-color: #FFF5F5;
  color: #E53E3E;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  border-left: 4px solid #E53E3E;
}
</style>