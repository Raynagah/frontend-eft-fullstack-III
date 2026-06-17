import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CrearUsuarioView from '../../views/admin/CrearUsuarioView.vue';
import UsuarioForm from '../../components/admin/UsuarioForm.vue';

// 1. Desmontaje automático entre pruebas
enableAutoUnmount(afterEach);

// 2. Mocks de dependencias externas
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const mockCrearUsuario = vi.fn();
vi.mock('../../stores/usuarioAdminStore.js', () => ({
  useUsuarioAdminStore: () => ({
    crearUsuario: mockCrearUsuario
  })
}));

describe('CrearUsuarioView.vue', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciamos console.error para mantener limpia la consola en las pruebas de error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Auxiliar para montar el componente aislando el componente hijo de forma controlada
  const mountComponent = () => {
    return mount(CrearUsuarioView, {
      global: {
        stubs: {
          // Usamos un stub simple para interactuar fácilmente con sus eventos emitidos
          UsuarioForm: true
        }
      }
    });
  };

  it('1. Debe renderizar la estructura base correctamente', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.main-title').text()).toBe('Registrar Nuevo Usuario');
    expect(wrapper.find('.btn-back').text()).toContain('Volver al Panel de Usuarios');
    expect(wrapper.findComponent(UsuarioForm).exists()).toBe(true);
    // La caja de alerta de error no debe existir de entrada
    expect(wrapper.find('.error-alert').exists()).toBe(false);
  });

  it('2. Debe redirigir al panel de usuarios al hacer clic en el botón volver', async () => {
    const wrapper = mountComponent();

    await wrapper.find('.btn-back').trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('3. Debe redirigir al panel cuando el formulario emita el evento cancelar', async () => {
    const wrapper = mountComponent();

    // Localizamos el componente hijo stub y disparamos su emisión de cancelación
    const formulario = wrapper.findComponent(UsuarioForm);
    await formulario.vm.$emit('cancelar');

    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('4. Debe guardar el nuevo usuario exitosamente y redirigir', async () => {
    mockCrearUsuario.mockResolvedValueOnce(); // Simula éxito en la promesa del store
    const wrapper = mountComponent();

    const datosPrueba = { nombre: 'Carlos', correo: 'carlos@empresa.com', rol: 'admin' };
    const formulario = wrapper.findComponent(UsuarioForm);
    
    // Emitimos el evento de guardado con la carga de datos del formulario
    await formulario.vm.$emit('guardar', datosPrueba);

    // Verificamos el estado intermedio de carga reactiva
    expect(wrapper.vm.procesando).toBe(true);

    await flushPromises();

    expect(mockCrearUsuario).toHaveBeenCalledWith(datosPrueba);
    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');
    expect(wrapper.vm.procesando).toBe(false);
  });

  it('5. Debe manejar errores en el catch si falla la creación del usuario en el store', async () => {
    const mensajeErrorBackend = 'El correo electrónico ya se encuentra registrado.';
    mockCrearUsuario.mockRejectedValueOnce(new Error(mensajeErrorBackend));
    
    const wrapper = mountComponent();

    const formulario = wrapper.findComponent(UsuarioForm);
    await formulario.vm.$emit('guardar', { nombre: 'Invalido' });
    await flushPromises();

    // El error debe ser capturado y expuesto en pantalla
    expect(console.error).toHaveBeenCalled();
    const alertaError = wrapper.find('.error-alert');
    expect(alertaError.exists()).toBe(true);
    expect(alertaError.text()).toContain('No se pudo crear el usuario');
    expect(alertaError.text()).toContain(mensajeErrorBackend);
    
    // Verificamos que la bandera del "finally" se haya ejecutado
    expect(wrapper.vm.procesando).toBe(false);
  });

  it('6. Debe usar un mensaje alternativo si el objeto de error no contiene la propiedad message', async () => {
    // Simulamos un error genérico vacío sin propiedad .message
    mockCrearUsuario.mockRejectedValueOnce({});
    
    const wrapper = mountComponent();

    const formulario = wrapper.findComponent(UsuarioForm);
    await formulario.vm.$emit('guardar', { nombre: 'Invalido' });
    await flushPromises();

    const alertaError = wrapper.find('.error-alert');
    expect(alertaError.text()).toContain('Ocurrió un error inesperado al guardar.');
  });
});