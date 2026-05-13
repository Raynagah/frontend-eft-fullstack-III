<template>
  <div class="reportar-container">
    <div class="header-section">
      <h2>Reportar una Mascota</h2>
      <p>Completa este formulario con la mayor cantidad de detalles posible.</p>
    </div>

    <div v-if="exito" class="alerta exito">
      <h3>¡Reporte creado con éxito!</h3>
      <p>La mascota ha sido registrada en el sistema y se ha notificado a la red.</p>
      <router-link to="/mascotas" class="btn-volver">Volver al Dashboard</router-link>
    </div>

    <form v-else @submit.prevent="enviarReporte" class="formulario-reporte">

      <div v-if="error" class="alerta error">
        {{ error }}
      </div>

      <div class="form-grid">
        <div class="input-group full-width">
          <label>¿Qué deseas reportar? *</label>
          <select v-model="form.tipoReporte" required>
            <option value="PERDIDA">Perdí a mi mascota</option>
            <option value="ENCONTRADA">Encontré una mascota</option>
          </select>
        </div>

        <div class="input-group">
          <label>
            {{ form.tipoReporte === 'PERDIDA' ? 'Nombre de tu mascota *' : 'Nombre (si tiene collar/placa)' }}
          </label>
          <input type="text" v-model="form.nombre" :required="form.tipoReporte === 'PERDIDA'"
            placeholder="Ej: Max, Luna..." />
        </div>

        <div class="input-group">
          <label>Especie *</label>
          <select v-model="form.especie" required>
            <option value="" disabled selected>Selecciona una opción</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
          </select>
        </div>

        <div class="input-group">
          <label>Raza (Opcional)</label>
          <input type="text" v-model="form.raza" placeholder="Ej: Labrador o Mestizo" />
        </div>

        <div class="input-group">
          <label>Color Principal *</label>
          <input type="text" v-model="form.color" required placeholder="Ej: Negro con manchas blancas" />
        </div>

        <div class="input-group">
          <label>Tamaño (Opcional)</label>
          <select v-model="form.tamano">
            <option value="">Selecciona un tamaño</option>
            <option value="Pequeño">Pequeño</option>
            <option value="Mediano">Mediano</option>
            <option value="Grande">Grande</option>
          </select>
        </div>

        <div class="input-group full-width">
          <label>URL de Fotografía (Opcional)</label>
          <input type="url" v-model="form.fotografiaUrl" placeholder="https://ejemplo.com/foto.jpg" />
        </div>

        <div class="input-group full-width mapa-section">
          <label>Ubicación (Haz clic en el mapa para marcar el lugar) *</label>

          <div class="mapa-controles">
            <button type="button" @click="ubicarUsuario" class="btn-ubicacion" :disabled="obteniendoUbicacion">
              <i class="icono">📍</i> {{ obteniendoUbicacion ? 'Buscando con precisión...' : 'Usar mi ubicación actual'
              }}
            </button>
            <span class="coordenadas-preview">
              Lat: {{ form.latitud.toFixed(4) }}, Lng: {{ form.longitud.toFixed(4) }}
            </span>
          </div>
          <p class="nota-mapa">💡 Si la ubicación no es exacta, <strong>arrastra el marcador</strong> o haz clic en el
            mapa para ajustarla.</p>

          <div id="mapa-seleccion" class="mapa-interactivo"></div>
        </div>

        <div class="input-group">
          <label>Tu Nombre *</label>
          <input type="text" v-model="form.nombreContacto" required placeholder="Tu nombre y apellido" />
        </div>

        <div class="input-group">
          <label>Teléfono de Contacto *</label>
          <input type="text" v-model="form.telefonoContacto" required placeholder="+56 9 1234 5678" />
        </div>

        <div class="input-group full-width">
          <label>Correo Electrónico *</label>
          <input type="email" v-model="form.emailContacto" required placeholder="tu@email.com" />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-submit" :disabled="cargando">
          {{ cargando ? 'Enviando...' : 'Publicar Reporte' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../api/axiosConfig.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Estado de la UI
const cargando = ref(false);
const exito = ref(false);
const error = ref(null);
const obteniendoUbicacion = ref(false);

let mapaInstancia = null;
let marcador = null;

// Objeto reactivo (DTO)
const form = ref({
  usuarioId: null,
  tipoReporte: 'PERDIDA',
  nombre: '',
  especie: '', // Inicializado vacío para que tome el "Selecciona una opción"
  raza: '',
  color: '',
  tamano: '',
  fotografiaUrl: '',
  latitud: -41.4693,
  longitud: -72.9423,
  nombreContacto: '',
  telefonoContacto: '',
  emailContacto: ''
});

// Inicializar el mapa de Leaflet
const initMap = () => {
  mapaInstancia = L.map('mapa-seleccion').setView([form.value.latitud, form.value.longitud], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapaInstancia);

  const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  marcador = L.marker([form.value.latitud, form.value.longitud], {
    icon: customIcon,
    draggable: true
  }).addTo(mapaInstancia);

  mapaInstancia.on('click', (e) => {
    const { lat, lng } = e.latlng;
    form.value.latitud = lat;
    form.value.longitud = lng;
    marcador.setLatLng([lat, lng]);
  });

  marcador.on('dragend', (e) => {
    const { lat, lng } = e.target.getLatLng();
    form.value.latitud = lat;
    form.value.longitud = lng;
  });
};

const ubicarUsuario = () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  obteniendoUbicacion.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      form.value.latitud = lat;
      form.value.longitud = lng;

      mapaInstancia.setView([lat, lng], 17);
      marcador.setLatLng([lat, lng]);

      obteniendoUbicacion.value = false;
    },
    (err) => {
      console.error(err);
      alert("No pudimos obtener una ubicación precisa. Por favor, marca el punto manualmente en el mapa.");
      obteniendoUbicacion.value = false;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
};

const enviarReporte = async () => {
  // Verificación de seguridad antes de enviar
  if (!form.value.usuarioId) {
    error.value = "Debes iniciar sesión para reportar una mascota.";
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await api.post('/web/mascotas/reportar', form.value);
    exito.value = true;
  } catch (err) {
    console.error("Error al enviar formulario:", err);
    if (err.response && err.response.status === 403) {
      error.value = "No tienes permiso para realizar esta acción. Verifica tu sesión.";
    } else if (err.response && err.response.data) {
      error.value = "Error en los datos: Revisa los campos e intenta nuevamente.";
    } else {
      error.value = "Error de conexión con el servidor. Intenta más tarde.";
    }
  } finally {
    cargando.value = false;
  }
};

onMounted(async () => {
  // Recuperar los datos del usuario logueado
  const userStorage = localStorage.getItem('usuario');

  if (userStorage) {
    const userParseado = JSON.parse(userStorage);

    // Autocompletar datos técnicos
    form.value.usuarioId = userParseado.id;

    // Autocompletar datos de contacto
    form.value.nombreContacto = userParseado.nombre || '';
    form.value.telefonoContacto = userParseado.telefono || '';
    form.value.emailContacto = userParseado.correo || userParseado.email || '';
  }

  await nextTick();
  initMap();
});
</script>

<style scoped>
.nota-mapa {
  font-size: 0.9rem;
  color: #17a2b8;
  margin-bottom: 1rem;
  background-color: #e0f7fa;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.reportar-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 0;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h2 {
  color: #007bff;
  color: var(--color-primary, #007bff);
  font-size: 2.2rem;
}

.formulario-reporte {
  background-color: var(--color-white, #ffffff);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.input-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

input,
select {
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus,
select:focus {
  outline: none;
  border-color: #007bff;
  border-color: var(--color-primary, #007bff);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn-submit {
  background-color: #ff9800;
  background-color: var(--color-accent, #ff9800);
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(0.9);
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* Alertas */
.alerta {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.alerta.exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alerta.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.btn-volver {
  display: inline-block;
  margin-top: 1rem;
  background-color: #007bff;
  background-color: var(--color-primary, #007bff);
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
}

/* NUEVOS ESTILOS PARA EL MAPA */
.mapa-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.mapa-controles {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-ubicacion {
  background-color: white;
  border: 1px solid #ced4da;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #495057;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.btn-ubicacion:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.btn-ubicacion:disabled {
  opacity: 0.7;
  cursor: wait;
}

.coordenadas-preview {
  font-family: monospace;
  color: #6c757d;
  font-size: 0.9rem;
  background: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 1px solid #e9ecef;
}

.mapa-interactivo {
  height: 350px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ced4da;
  z-index: 1;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .mapa-controles {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>