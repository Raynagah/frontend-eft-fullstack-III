<template>
  <div class="form-card">
    <form @submit.prevent="manejarEnvio">
      
      <div class="form-grid">
        <div class="form-group">
          <label for="nombre">Nombre Completo</label>
          <input 
            type="text" 
            id="nombre" 
            v-model="form.nombre" 
            placeholder="Ej: Juan Pérez" 
            maxlength="100"
            required
          />
          <small class="hint">{{ form.nombre ? form.nombre.length : 0 }}/100</small>
        </div>

        <div class="form-group">
          <label for="correo">Correo Electrónico</label>
          <input 
            type="email" 
            id="correo" 
            v-model="form.correo" 
            placeholder="juan@correo.com" 
            required
            :disabled="esEditar"
          />
          <small v-if="esEditar" class="helper-text modified-text">El correo electrónico no puede ser modificado.</small>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="telefono">Teléfono de Contacto</label>
          <input 
            type="text" 
            id="telefono" 
            v-model="form.telefono" 
            placeholder="+569..." 
            required
          />
        </div>

        <div class="form-group">
          <label for="tipoUsuario">Rol del Sistema</label>
          <select id="tipoUsuario" v-model="form.tipoUsuario" required>
            <option value="" disabled selected>Seleccione un rol...</option>
            <option value="cliente">Cliente (Usuario Común)</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="edad">Edad</label>
          <input 
            type="number" 
            id="edad" 
            v-model="form.edad" 
            min="18" 
            max="120" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="genero">Género</label>
          <select id="genero" v-model="form.genero" required>
            <option value="" disabled selected>Seleccione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no especificar">Prefiero no especificar</option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="ocupacion">Ocupación</label>
          <select id="ocupacion" v-model="form.ocupacion" required>
            <option value="" disabled selected>Seleccione...</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="INSTITUCION">Institución / ONG</option>
            <option value="PARTICULAR">Particular</option>
          </select>
        </div>

        <div class="form-group">
          <label for="direccion">Dirección</label>
          <input 
            type="text" 
            id="direccion" 
            v-model="form.direccion" 
            placeholder="Calle, Ciudad" 
            required 
          />
        </div>
      </div>

      <div class="form-grid" v-if="!esEditar">
        <div class="form-group full-width">
          <label for="password">Contraseña de Acceso</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            placeholder="••••••••" 
            required
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancelar')" class="btn btn-secondary" :disabled="cargando">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="cargando">
          <span v-if="cargando" class="loader-inline"></span>
          {{ cargando ? 'Guardando...' : (esEditar ? 'Actualizar Usuario' : 'Registrar Usuario') }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  esEditar: {
    type: Boolean,
    default: false
  },
  datosIniciales: {
    type: Object,
    default: () => ({})
  },
  cargando: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['guardar', 'cancelar']);

// Estado con la estructura completa requerida por tu backend
const form = ref({
  nombre: '',
  correo: '',
  password: '',
  telefono: '',
  tipoUsuario: '', // Campo específico del administrador
  edad: null,
  genero: '',
  ocupacion: '',
  direccion: '',
  fotoUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' // Foto por defecto corporativa
});

// Carga estructurada de datos en caso de Edición
const inicializarFormulario = () => {
  if (props.esEditar && props.datosIniciales) {
    form.value = {
      nombre: props.datosIniciales.nombre || '',
      correo: props.datosIniciales.correo || '',
      telefono: props.datosIniciales.telefono || '',
      tipoUsuario: props.datosIniciales.tipoUsuario || '',
      edad: props.datosIniciales.edad || null,
      genero: props.datosIniciales.genero || '',
      ocupacion: props.datosIniciales.ocupacion || '',
      direccion: props.datosIniciales.direccion || '',
      fotoUrl: props.datosIniciales.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      password: '' // No se expone por seguridad
    };
  }
};

onMounted(inicializarFormulario);
watch(() => props.datosIniciales, inicializarFormulario, { deep: true });

const manejarEnvio = () => {
  // Emitimos el objeto idéntico al que espera procesar tu Store/API
  emit('guardar', { ...form.value });
};
</script>

<style scoped>
/* --- ESTILOS PROPIOS FORMAL Y ESPACIADO --- */
.form-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  padding: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.full-width {
  grid-column: span 2;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

input, select {
  padding: 12px 16px;
  font-size: 14px;
  color: #334155;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
}

input:focus, select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

input:disabled, select:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.hint {
  font-size: 11px;
  text-align: right;
  color: #94a3b8;
  margin-top: 4px;
}

.helper-text {
  font-size: 12px;
  margin-top: 6px;
}

.modified-text {
  color: #64748b;
}

/* --- BOTONES --- */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}
.btn-primary:hover { background-color: #1d4ed8; }

.btn-secondary {
  background-color: white;
  border-color: #cbd5e1;
  color: #334155;
}
.btn-secondary:hover { background-color: #f1f5f9; color: #0f172a; }

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader-inline {
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 14px; height: 14px;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .full-width {
    grid-column: span 1;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>