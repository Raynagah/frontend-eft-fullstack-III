import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../api/axiosConfig.js'; // Asegúrate de que la ruta sea correcta
import PerfilView from '../views/PerfilView.vue';

// 1. Desmontaje automático entre pruebas
enableAutoUnmount(afterEach);

// 2. Mock de Axios (API)
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

describe('PerfilView.vue', () => {
  // Mock de datos del usuario en LocalStorage
  const mockUsuarioStorage = { id: 1, nombre: 'Juan', correo: 'juan@test.com' };
  
  // Mock de datos devueltos por la API
  const mockDatosApi = {
    nombre: 'Juan Perez',
    edad: 30,
    genero: 'Masculino',
    telefono: '123456789',
    ocupacion: 'Ingeniero',
    direccion: 'Calle Falsa 123',
    correo: 'juan@test.com',
    fotoUrl: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiamos y preparamos el localStorage antes de cada test
    localStorage.clear();
    localStorage.setItem('usuario', JSON.stringify(mockUsuarioStorage));
  });

  // Función helper para montar el componente de manera limpia
  const mountComponent = () => {
    return mount(PerfilView, {
      global: {
        stubs: {
          // Sustituimos el componente hijo para evitar errores por dependencias
          MascotaCard: true,
          // Simulamos router-link correctamente
          'router-link': true 
        }
      }
    });
  };

  it('1. Carga los datos personales y reportes al montar exitosamente', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) {
        return Promise.resolve({ data: [{ id: 101, nombre: 'Firulais' }] });
      }
      return Promise.resolve({ data: mockDatosApi });
    });

    const wrapper = mountComponent();
    
    // Verificamos el estado de carga inicial
    expect(wrapper.text()).toContain('Cargando...');

    await flushPromises();

    // Verifica que se hicieron las peticiones con el ID correcto extraído del localStorage
    expect(api.get).toHaveBeenCalledWith('/web/usuarios/1');
    expect(api.get).toHaveBeenCalledWith('/web/usuarios/1/reportes');

    // Verifica que los datos se renderizaron correctamente en la vista de lectura
    expect(wrapper.text()).toContain('Juan Perez');
    expect(wrapper.text()).toContain('Ingeniero');
    
    // Verifica la propiedad computada inicialNombre
    expect(wrapper.find('.avatar-circle').text()).toBe('J');
  });

  it('2. Maneja errores al cargar los datos personales', async () => {
    // Hacemos que la petición de datos principales falle deliberadamente
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Fallo API'));
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Verificamos que se asigna y muestra el mensaje de error en la vista
    expect(wrapper.text()).toContain('Error al cargar datos.');
  });

  it('3. Permite iniciar y cancelar la edición restaurando los datos originales', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // 1. Iniciamos el modo edición clickeando el botón correspondiente
    const btnEditar = wrapper.find('.btn-editar');
    await btnEditar.trigger('click');
    
    // Verificamos la aparición del formulario
    expect(wrapper.find('form.perfil-form').exists()).toBe(true);

    // 2. Modificamos un dato a través de su data-testid
    const inputNombre = wrapper.find('[data-testid="input-nombre-perfil"]');
    await inputNombre.setValue('Nombre Modificado');
    expect(inputNombre.element.value).toBe('Nombre Modificado');

    // 3. Cancelamos la edición usando el botón de cancelar
    const btnCancelar = wrapper.find('.btn-cancelar');
    await btnCancelar.trigger('click');

    // Verificamos que salimos del formulario y que el valor regresó al estado inicial
    expect(wrapper.find('form.perfil-form').exists()).toBe(false);
    expect(wrapper.text()).toContain('Juan Perez'); 
    expect(wrapper.text()).not.toContain('Nombre Modificado');
  });

  it('4. Guarda los datos exitosamente y sale del modo edición', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });
    
    // Respuesta esperada tras el PUT exitoso
    const mockRespuestaPut = { ...mockDatosApi, nombre: 'Juan Actualizado' };
    api.put.mockResolvedValue({ data: mockRespuestaPut });

    const wrapper = mountComponent();
    await flushPromises();

    // Pasamos a edición
    await wrapper.find('.btn-editar').trigger('click');

    // Enviamos el formulario
    const form = wrapper.find('form.perfil-form');
    await form.trigger('submit.prevent');
    await flushPromises();

    // Verificaciones de peticiones de actualización
    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/web/usuarios/1', expect.any(Object));
    
    // Verifica el fin de la edición y la presencia del mensaje de éxito en pantalla
    expect(wrapper.find('form.perfil-form').exists()).toBe(false);
    expect(wrapper.text()).toContain('¡Perfil actualizado con éxito!');
    expect(wrapper.text()).toContain('Juan Actualizado');
  });

  it('5. Muestra error si falla al guardar los datos', async () => {
    // Silenciamos console.error para que el log del catch no ensucie el output de la terminal
    vi.spyOn(console, 'error').mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });
    
    // Simulamos un error de validación del backend durante el PUT
    api.put.mockRejectedValue(new Error('Error de validación'));

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.find('.btn-editar').trigger('click');
    await wrapper.find('form.perfil-form').trigger('submit.prevent');
    await flushPromises();

    // Debería mantenerse en el formulario y desplegar la alerta de error esperada
    expect(wrapper.find('form.perfil-form').exists()).toBe(true);
    expect(wrapper.text()).toContain('No se pudo actualizar. Revisa que todos los campos obligatorios (*) estén llenos.');
  });

  it('6. Muestra un avatar genérico si el usuario carece de nombre', async () => {
    // Caso de borde: API devuelve un nombre nulo
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { ...mockDatosApi, nombre: null } });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Comprobamos la caída al emoji de silueta genérico
    expect(wrapper.find('.avatar-circle').text()).toBe('👤');
  });

  it('7. Interactúa con todos los inputs y avanza el temporizador de éxito para cubrir v-models y setTimeout', async () => {
    // 1. Configuramos cronómetros falsos para capturar el callback del setTimeout
    vi.useFakeTimers();

    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });
    api.put.mockResolvedValue({ data: { ...mockDatosApi, nombre: 'Juan Modificado' } });

    const wrapper = mountComponent();
    await flushPromises();

    // Pasamos al modo edición
    await wrapper.find('.btn-editar').trigger('click');

    // 2. Interactuamos con absolutamente TODOS los v-model pendientes
    await wrapper.find('[data-testid="input-nombre-perfil"]').setValue('Juan Modificado');
    await wrapper.find('[data-testid="input-edad-perfil"]').setValue(35);
    await wrapper.find('[data-testid="input-genero-perfil"]').setValue('Femenino');
    await wrapper.find('[data-testid="input-telefono-perfil"]').setValue('987654321');
    await wrapper.find('[data-testid="input-ocupacion-perfil"]').setValue('Diseñador');
    await wrapper.find('[data-testid="input-direccion-perfil"]').setValue('Avenida Siempre Viva 742');

    // Enviamos el formulario
    await wrapper.find('form.perfil-form').trigger('submit.prevent');
    await flushPromises();

    // Verificamos que apareció el cartel de éxito
    expect(wrapper.text()).toContain('¡Perfil actualizado con éxito!');

    // 3. Viajamos 3 segundos en el futuro para forzar la ejecución de la función dentro del setTimeout
    vi.advanceTimersByTime(3000);
    await wrapper.vm.$nextTick(); // Le damos un ciclo a Vue para procesar la desaparición del mensaje

    // Restauramos los cronómetros reales de Vitest
    vi.useRealTimers();
  });

  it('8. Captura el error en el bloque catch al fallar la carga de mis reportes', async () => {
    // Silenciamos el console.error esperado en la terminal
    vi.spyOn(console, 'error').mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) {
        return Promise.reject(new Error('Error al traer reportes de mascotas'));
      }
      return Promise.resolve({ data: mockDatosApi });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Confirmamos que el catch atrapó la excepción y llamó al console.error
    expect(console.error).toHaveBeenCalled();
  });

  it('9. Maneja correctamente la ausencia de usuario en el localStorage (branch || {})', async () => {
    // 1. Limpiamos el localStorage específicamente para esta prueba
    // Esto sobrescribe el beforeEach y hace que getItem devuelva null
    localStorage.clear();

    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });

    // 2. Montamos el componente
    const wrapper = mountComponent();
    await flushPromises();

    // 3. Verificamos que el componente se monta sin romperse a pesar de no tener usuario local
    expect(wrapper.exists()).toBe(true);
  });

  it('10. Muestra el badge con el rol del usuario si este existe (branch v-if="usuario.rol")', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      
      // Simulamos que la API devuelve los mismos datos, pero agregando un "rol"
      return Promise.resolve({ 
        data: { ...mockDatosApi, rol: 'Administrador' } 
      });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Buscamos el elemento y verificamos que se renderice con el texto correcto
    const badge = wrapper.find('.user-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('Administrador');
  });

  it('11. Permite navegar entre las pestañas de Mis Datos y Reportes', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockDatosApi });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Verificamos que por defecto estamos en Mis Datos
    expect(wrapper.text()).toContain('Información Personal');

    // 1. Hacemos clic en la pestaña de reportes
    await wrapper.find('[data-testid="tab-reportes"]').trigger('click');
    
    // Verificamos que la interfaz cambió al estado vacío de reportes
    expect(wrapper.text()).toContain('Aún no tienes reportes activos');
    expect(wrapper.text()).not.toContain('Información Personal'); // La otra pestaña desapareció

    // 2. Volvemos a hacer clic en la pestaña de datos
    await wrapper.find('[data-testid="tab-datos"]').trigger('click');
    
    // Verificamos que volvió a la vista original
    expect(wrapper.text()).toContain('Información Personal');
  });

  it('12. Redirecciona correctamente a la vista de detalle al hacer clic en un reporte del historial', async () => {
    // Simulamos que el usuario SÍ tiene un reporte en su historial
    const mockReportesUsuario = [
      { id: 101, nombre: 'Firulais', especie: 'Perro', tipoReporte: 'PERDIDA', color: 'Marrón' }
    ];

    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: mockReportesUsuario });
      return Promise.resolve({ data: mockDatosApi });
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Vamos a la pestaña de reportes
    await wrapper.find('[data-testid="tab-reportes"]').trigger('click');

    // Buscamos el link que envuelve a la tarjeta
    const linkDetalle = wrapper.find('[data-testid="link-detalle-reporte"]');
    expect(linkDetalle.exists()).toBe(true);
    expect(linkDetalle.attributes('to')).toBe('/mascotas/101');
  });
});