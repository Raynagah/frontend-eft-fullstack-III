<template>
  <div class="app-container">
    <header class="navbar">
      <div class="navbar-brand">
        <img src="./assets/Logo Proyecto fullstack III.png" alt="Sanos y Salvos Logo" class="logo-img" />
      </div>
      
      <nav class="navbar-links">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/mascotas" class="nav-link">Mascotas</router-link>
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
  height: 50px; /* Ajusta esto según qué tan grande quieras el logo */
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

.nav-link:hover, .router-link-active {
  color: var(--color-primary);
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
  background-color: var(--color-text); /* Fondo oscuro para el footer */
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
</style>