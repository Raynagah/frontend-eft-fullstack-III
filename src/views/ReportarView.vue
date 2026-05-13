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
          <label>Especie (Ej. Perro, Gato) *</label>
          <input type="text" v-model="form.especie" required placeholder="Ej: Perro" />
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

        <div class="input-group">
          <label>Latitud *</label>
          <input type="number" step="any" v-model="form.latitud" required />
        </div>

        <div class="input-group">
          <label>Longitud *</label>
          <input type="number" step="any" v-model="form.longitud" required />
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
          <label>Correo Electrónico (Opcional)</label>
          <input type="email" v-model="form.emailContacto" placeholder="tu@email.com" />
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
import { ref } from 'vue';
import axios from 'axios';

// Estado de la UI
const cargando = ref(false);
const exito = ref(false);
const error = ref(null);

// Objeto reactivo que coincide EXACTAMENTE con el WebReporteRequestDTO del BFF
const form = ref({
  usuarioId: 1, // Hardcodeado por ahora simulando el usuario logueado
  tipoReporte: 'PERDIDA',
  especie: '',
  raza: '',
  color: '',
  tamano: '',
  fotografiaUrl: '',
  latitud: -41.47, // Coordenadas por defecto (Puerto Montt)
  longitud: -72.94,
  nombreContacto: '',
  telefonoContacto: '',
  emailContacto: ''
});

const enviarReporte = async () => {
  cargando.value = true;
  error.value = null;

  try {
    // Apuntamos al endpoint POST de nuestro BFF
    await axios.post('http://localhost:8087/api/v1/web/mascotas/reportar', form.value);
    
    // Si llegamos aquí, el servidor respondió con un código 2xx (Éxito)
    exito.value = true;
  } catch (err) {
    console.error("Error al enviar formulario:", err);
    // Verificamos si el BFF nos devolvió un error de validación u otro problema
    if (err.response && err.response.data) {
      error.value = "Error en los datos: Revisa los campos e intenta nuevamente.";
    } else {
      error.value = "Error de conexión con el servidor. Intenta más tarde.";
    }
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.reportar-container {
  max-width: 800px; /* Limitamos el ancho para que el formulario no sea enorme */
  margin: 0 auto;
  padding: 1rem 0;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h2 {
  color: var(--color-primary);
  font-size: 2.2rem;
}

.formulario-reporte {
  background-color: var(--color-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
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
  color: var(--color-text);
  font-size: 0.95rem;
}

input, select {
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(56, 138, 152, 0.2);
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn-submit {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s;
  box-shadow: 0 4px 10px rgba(231, 142, 58, 0.3);
}

.btn-submit:hover:not(:disabled) {
  background-color: #cf7c30;
  transform: translateY(-2px);
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
  background-color: var(--color-primary);
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
}

/* Responsividad: En celulares, todos los campos ocupan el ancho completo */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>