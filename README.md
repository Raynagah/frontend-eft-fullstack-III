# Sanos y Salvos - Red de Reencuentro de Mascotas 🐾

Este proyecto es una plataforma distribuida basada en microservicios diseñada para facilitar el reencuentro de mascotas extraviadas mediante geolocalización y un motor de coincidencias fenotípicas.

## 🧠 Decisiones de Arquitectura: Frontend

### 1. Diagnóstico del Proyecto

¿Cuál es el problema que tiene el proyecto hoy?  
Antes de la implementación del patrón de diseño, el frontend presentaba un **acoplamiento estrecho** entre la lógica de consumo de datos y la representación visual. Dado que el sistema interactúa con múltiples microservicios (Mascotas, Usuarios, Geolocalización y Motor de Coincidencias) a través de un **API Gateway**, el código de los componentes se volvía denso, difícil de testear y poco reutilizable.

### 2. Patrón de Diseño Seleccionado

El patrón que mejor se adapta al proyecto es el **Patrón C: Container / Presenter** (Componentes Inteligentes y Tontos).

### 3. Justificación de la Elección

Consideramos que este patrón es el ideal para el estado actual de "Sanos y Salvos" por las siguientes razones:

* **Separación de Responsabilidades:** Permite aislar la lógica de orquestación de llamadas al Gateway (Container) del diseño visual de las interfaces (Presenter).
* **Mantenibilidad:** Facilita la actualización de la lógica de negocio (como el manejo de sesiones de usuario o filtros de búsqueda) sin alterar el diseño de la UI.
* **Testeabilidad:** Los componentes "Presenters" se vuelven puramente visuales, facilitando pruebas unitarias mediante *props* y *events*.
* **Escalabilidad:** Permite integrar nuevos microservicios de forma modular siguiendo una estructura de carpetas clara y predecible.

---

## 📂 Estructura de Carpetas (Frontend - Vue.js)

Siguiendo el patrón **Container / Presenter**, el proyecto se organiza de la siguiente manera:

```text
src/
├── services/              # Abstracción de APIs (Capa de comunicación)
│   ├── api.js             # Configuración base de Axios / Gateway
│   ├── mascotaService.js  # Microservicio de Mascotas
│   ├── userService.js     # Microservicio de Usuarios (Auth y Sesión)
│   ├── geoService.js      # Microservicio de Geolocalización
│   └── motorService.js    # Microservicio de Coincidencias
│
├── containers/            # COMPONENTES INTELIGENTES (Lógica y Datos)
│   ├── LoginContainer.vue
│   ├── BusquedaMascotasContainer.vue
│   ├── PerfilUsuarioContainer.vue
│   └── RegistroReporteContainer.vue
│
├── components/            # COMPONENTES PRESENTADORES (UI / Visual)
│   ├── common/            # Botones, Inputs y Modales genéricos
│   ├── Mascotas/          # CardMascota.vue, ListaMascotas.vue
│   ├── Usuarios/          # FormLogin.vue, UserProfileCard.vue
│   └── Mapa/              # MarcadorMapa.vue, VistaMapa.vue
│
├── views/                 # Páginas (Rutas de Vue Router)
└── App.vue

```

## Links

Repositorio backend: https://github.com/Raynagah/backend-eft-fullstack-III.git

Link repositorio principal: https://github.com/Raynagah/EFT-Desarrollo-Fullstack-III.git
