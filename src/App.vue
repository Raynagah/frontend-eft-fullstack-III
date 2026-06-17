<template>
  <div class="app-container">
    <header class="navbar">
      
      <div class="navbar-brand-group">
        <router-link to="/" class="navbar-logo-link">
          <img src="../src/assets/Logo Proyecto fullstack III.png" alt="Logo Sanos y Salvos" class="navbar-logo" />
        </router-link>

        <template v-if="usuarioActual?.tipoUsuario === 'admin'">
          <router-link 
            v-if="!route.path.startsWith('/admin')" 
            to="/admin" 
            class="nav-link admin-link">
            ⚙️ Panel Admin
          </router-link>
          <router-link 
            v-else 
            to="/mascotas" 
            class="nav-link admin-link">
            🏠 Volver a la pagina
          </router-link>
        </template>
      </div>

      <nav class="navbar-links">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/mascotas" class="nav-link">Mascotas</router-link>

        <template v-if="!usuarioActual">
          <router-link to="/login" class="nav-link">Iniciar Sesión</router-link>
          <router-link to="/registro" class="nav-link">Registrarse</router-link>
          <button class="btn-reportar" @click="$router.push('/reportar')">Reportar Mascota</button>
        </template>

        <template v-else>
          <button class="btn-reportar" @click="$router.push('/reportar')">Reportar Mascota</button>

          <div class="user-menu-capsule">
            
            <router-link to="/perfil" class="profile-chip" title="Ir a mi perfil">
              <span class="profile-avatar">👤</span>
              <span class="profile-name">{{ usuarioActual.nombre }}</span>
            </router-link>

            <div class="bell-container">
              <CampanaNotificaciones />
            </div>

            <button class="btn-logout-pill" @click="cerrarSesion">Cerrar Sesión</button>
            
          </div>
        </template>
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
import CampanaNotificaciones from './components/notificaciones/CampanaNotificaciones.vue';

const router = useRouter();
const route = useRoute();
const usuarioActual = ref(null);

const verificarSesion = () => {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    usuarioActual.value = JSON.parse(usuarioGuardado);
  } else {
    usuarioActual.value = null;
  }
};

onMounted(() => {
  verificarSesion();
});

watch(() => route.fullPath, () => {
  verificarSesion();
});

const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('usuario');
  usuarioActual.value = null;
  alert('Has cerrado sesión correctamente.');
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

/* Navbar Global (Aumentado el padding vertical) */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-white);
  padding: 1.2rem 5%; 
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

/* Enlaces del menú (Escalados a 1.15rem) */
.navbar-links {
  display: flex;
  align-items: center;
  gap: 2.2rem; 
}

.nav-link {
  text-decoration: none;
  color: var(--color-text, #4a5568);
  font-weight: 600;
  font-size: 1.15rem; 
  transition: color 0.3s ease;
}

.nav-link:hover,
.router-link-active {
  color: var(--color-primary, #388A98);
}

/* --- CÁPSULA DE USUARIO (Más espaciosa) --- */
.user-menu-capsule {
  display: flex;
  align-items: center;
  gap: 1.5rem; 
  background-color: #f8fafc; 
  padding: 0.5rem 1.2rem; 
  border-radius: 35px;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
}

/* Perfil (Texto más grande) */
.profile-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--color-text, #4a5568);
  font-weight: 700;
  font-size: 1.1rem; 
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.profile-chip:hover {
  color: var(--color-primary, #388A98);
}

.profile-avatar {
  font-size: 1.3rem; 
}

/* Campana de Notificaciones (Escalada) */
.bell-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bell-container:hover {
  background-color: #e2e8f0;
}

/* Forzar tamaño y color adaptado a la campana interna */
.bell-container :deep(svg), 
.bell-container :deep(i),
.bell-container :deep(span) {
  color: var(--color-primary, #388A98) !important;
  font-size: 1.45rem !important; /* Icono de campana notablemente más grande */
}

/* --- NUEVO: Botón Cerrar Sesión estilo Pill Rojo --- */
.btn-logout-pill {
  background-color: #E53E3E;
  color: white;
  border: none;
  padding: 0.55rem 1.4rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(229, 62, 62, 0.2);
}

.btn-logout-pill:hover {
  background-color: #C53030;
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(229, 62, 62, 0.3);
}

/* Botón de Acción Principal Naranja (Más imponente) */
.btn-reportar {
  background-color: var(--color-accent, #E78E3A);
  color: white;
  border: none;
  padding: 0.75rem 1.8rem; 
  border-radius: 25px;
  font-weight: 700;
  font-size: 1.1rem; 
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 10px rgba(231, 142, 58, 0.25);
}

.btn-reportar:hover {
  background-color: #cf7c30;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(231, 142, 58, 0.35);
}

/* Logo (Crecido a 76px para mejor visualización de los textos internos) */
.navbar-logo {
  height: 76px;      
  width: auto;
  display: block;
}

.navbar-logo-link {
  display: inline-block;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.navbar-logo-link:hover {
  transform: scale(1.02);
}

/* Contenido e Inferior */
.main-content {
  flex: 1;
  padding: 2rem 5%;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.footer {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--color-text, #2d3748);
  color: white;
  font-size: 1rem;
}

/* Ajuste Responsivo */
@media (max-width: 950px) {
  .navbar {
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.2rem;
  }

  .navbar-links {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  .user-menu-capsule {
    width: 100%;
    justify-content: center;
  }

  .btn-reportar {
    width: 100%;
  }
}

/* --- NUEVO: Contenedor para alinear el logo y el botón admin --- */
.navbar-brand-group {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* Espacio entre el logo y el botón */
}

/* Enlace especial para el Admin */
.admin-link {
  color: var(--color-accent, #E78E3A); 
  font-weight: 800;
  border: 2px dashed var(--color-accent, #E78E3A);
  padding: 0.4rem 1rem;
  border-radius: 8px;
  background-color: #fffaf0;
  transition: all 0.3s ease;
}

.admin-link:hover {
  background-color: var(--color-accent, #E78E3A);
  color: white;
  text-decoration: none;
}

/* Ajuste Responsivo Actualizado */
@media (max-width: 950px) {
  .navbar {
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.2rem;
  }

  /* Aseguramos que el logo y botón admin se vean bien en móviles */
  .navbar-brand-group {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .navbar-links {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  .user-menu-capsule {
    width: 100%;
    justify-content: center;
  }

  .btn-reportar {
    width: 100%;
  }
}
</style>