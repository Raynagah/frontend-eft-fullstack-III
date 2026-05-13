<template>
  <div class="app-container">
    <header class="navbar">
      <div class="navbar-brand">
        <img src="./assets/Logo Proyecto fullstack III.png" alt="Sanos y Salvos Logo" class="logo-img" />
      </div>

      <nav class="navbar-links">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/mascotas" class="nav-link">Mascotas</router-link>

        <template v-if="!usuarioActual">
          <router-link to="/login" class="nav-link">Iniciar Sesión</router-link>
          <router-link to="/registro" class="nav-link">Registrarse</router-link>
        </template>

        <template v-else>
          <router-link to="/perfil" class="nav-link profile-link">
            <span class="user-greeting">👤 Hola, {{ usuarioActual.nombre }}</span>
          </router-link>

          <button class="btn-danger" @click="cerrarSesion">Salir</button>
        </template>

        <button class="btn-reportar" @click="$router.push('/reportar')">Reportar Mascota</button>
      </nav>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <p>&copy; 2026 Sanos y Salvos. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const usuarioActual = ref(null);

// Función para revisar si hay datos del usuario en el localStorage
const verificarSesion = () => {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    usuarioActual.value = JSON.parse(usuarioGuardado);
  } else {
    usuarioActual.value = null;
  }
};

// Revisamos al cargar la aplicación por primera vez
onMounted(() => {
  verificarSesion();
});

// TRUCO MAGICO: Escuchamos cada vez que cambia la URL (por ejemplo, al volver del login).
// Así la Navbar se actualiza al instante sin recargar el navegador.
watch(() => route.fullPath, () => {
  verificarSesion();
});

const cerrarSesion = () => {
  // Limpiamos todoo rastro de la sesión
  localStorage.removeItem('token');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('usuario');

  // Actualizamos la variable visual
  usuarioActual.value = null;

  alert('Has cerrado sesión correctamente.');
  // Lo enviamos al inicio
  router.push('/');
};
</script>

<style scoped>
/* Estructura Principal */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-white);
  padding: 1rem 5%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 50px;
  object-fit: contain;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.nav-link:hover,
.router-link-active {
  color: var(--color-primary);
}

/* Nuevos estilos para la sesión activa */
.user-greeting {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-danger {
  background-color: #E53E3E;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-family: inherit;
}

.btn-danger:hover {
  background-color: #C53030;
  transform: translateY(-2px);
}

/* Botón de Acción Principal */
.btn-reportar {
  background-color: var(--color-accent);
  color: var(--color-white);
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.3s ease;
  font-family: inherit;
  box-shadow: 0 4px 6px rgba(231, 142, 58, 0.3);
}

.btn-reportar:hover {
  background-color: #cf7c30;
  transform: translateY(-2px);
}

/* Contenido Central */
.main-content {
  flex: 1;
  padding: 2rem 5%;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Footer */
.footer {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--color-text);
  color: var(--color-white);
  font-size: 0.9rem;
}

/* --- Media Queries (Diseño Responsivo) --- */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .navbar-links {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .btn-reportar {
    width: 100%;
    margin-top: 0.5rem;
  }
}
/* Estilo específico para el link del perfil */
.profile-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.profile-link:hover {
  background-color: rgba(56, 138, 152, 0.1); /* Un toque del color primary muy suave */
  text-decoration: none;
}

.user-greeting {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.1rem;
}
</style>