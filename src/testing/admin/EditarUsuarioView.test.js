import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EditarUsuarioView from '../../views/admin/EditarUsuarioView.vue';
import UsuarioForm from '../../components/admin/UsuarioForm.vue';

enableAutoUnmount(afterEach);

// 1. Mocks de las utilidades de Vue Router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => ({
    params: { id: 'user-789' } // ID de prueba inyectado en los parámetros de la URL
  })
}));

// 2. Mocks de las acciones del almacén
const mockObtenerUsuario = vi.fn();
const mockActualizarUsuario = vi.fn();
vi.mock('../../stores/usuarioAdminStore', () => ({
  useUsuarioAdminStore: () => ({
    obtenerUsuario: mockObtenerUsuario,
    actualizarUsuario: mockActualizarUsuario
  })
}));

describe('EditarUsuarioView.vue', () => {
  const mockUsuarioInstancia = { id: 'user-789', nombre: 'Eduardo', correo: 'edu@empresa.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const mountComponent = () => {
    return mount(EditarUsuarioView, {
      global: {
        stubs: { UsuarioForm: true }
      }
    });
  };

  it('1. Debe mostrar el spinner de carga al inicio y ocultarlo al obtener con éxito los datos en onMounted', async () => {
    mockObtenerUsuario.mockResolvedValueOnce(mockUsuarioInstancia);
    const wrapper = mountComponent();

    // Verificamos estado inicial de carga antes de resolver promesas
    expect(wrapper.find('.loading-state').exists()).toBe(true);
    expect(wrapper.findComponent(UsuarioForm).exists()).toBe(false);

    await flushPromises();

    expect(mockObtenerUsuario).toHaveBeenCalledWith('user-789');
    expect(wrapper.find('.loading-state').exists()).toBe(false);
    
    // Verificamos que se desmonte el spinner y pase los datos cargados al formulario hijo
    const formHijo = wrapper.findComponent(UsuarioForm);
    expect(formHijo.exists()).toBe(true);
    expect(formHijo.props('datosIniciales')).toEqual(mockUsuarioInstancia);
  });

  it('2. Debe manejar el error si onMounted falla al buscar los detalles del usuario', async () => {
    mockObtenerUsuario.mockRejectedValueOnce(new Error('User Not Found'));
    const wrapper = mountComponent();
    
    await flushPromises();

    expect(wrapper.find('.loading-state').exists()).toBe(false);
    const boxAlerta = wrapper.find('.error-alert');
    expect(boxAlerta.exists()).toBe(true);
    expect(boxAlerta.text()).toContain('No se pudo cargar la información del usuario.');
  });

  it('3. Debe redirigir al panel de administración al hacer clic en el botón volver o al cancelar el formulario', async () => {
    mockObtenerUsuario.mockResolvedValueOnce(mockUsuarioInstancia);
    const wrapper = mountComponent();
    await flushPromises();

    // Prueba sub-ruta A: Botón de volver físico
    await wrapper.find('.btn-back').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');

    // Prueba sub-ruta B: Emisión de cancelación del hijo
    const formHijo = wrapper.findComponent(UsuarioForm);
    await formHijo.vm.$emit('cancelar');
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it('4. Debe actualizar la información del usuario con éxito a través del store y redirigir', async () => {
    mockObtenerUsuario.mockResolvedValueOnce(mockUsuarioInstancia);
    mockActualizarUsuario.mockResolvedValueOnce();
    const wrapper = mountComponent();
    await flushPromises();

    const datosModificados = { nombre: 'Eduardo Editado', correo: 'edu@empresa.com' };
    const formHijo = wrapper.findComponent(UsuarioForm);
    
    // Emitimos guardar desde el formulario
    await formHijo.vm.$emit('guardar', datosModificados);
    expect(wrapper.vm.procesando).toBe(true);

    await flushPromises();

    expect(mockActualizarUsuario).toHaveBeenCalledWith('user-789', datosModificados);
    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');
    expect(wrapper.vm.procesando).toBe(false);
  });

  it('5. Debe cubrir la rama de error de respuesta anidada del backend en el catch de guardado', async () => {
    mockObtenerUsuario.mockResolvedValueOnce(mockUsuarioInstancia);
    // Error estructurado simulando respuesta HTTP con axios (error.response.data.message)
    mockActualizarUsuario.mockRejectedValueOnce({
      response: { data: { message: 'El nombre contiene palabras no corporativas.' } }
    });

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.findComponent(UsuarioForm).vm.$emit('guardar', { nombre: 'Malo' });
    await flushPromises();

    const boxAlerta = wrapper.find('.error-alert');
    expect(boxAlerta.text()).toContain('El nombre contiene palabras no corporativas.');
    expect(wrapper.vm.procesando).toBe(false);
  });

  it('6. Debe cubrir el fallback de error genérico del catch de guardado si no viene mensaje de respuesta ni de objeto', async () => {
    mockObtenerUsuario.mockResolvedValueOnce(mockUsuarioInstancia);
    // Lanzamos un error primitivo/vacío para forzar la última rama del cortocircuito '||'
    mockActualizarUsuario.mockRejectedValueOnce({});

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.findComponent(UsuarioForm).vm.$emit('guardar', { nombre: 'Malo' });
    await flushPromises();

    const boxAlerta = wrapper.find('.error-alert');
    expect(boxAlerta.text()).toContain('Ocurrió un error inesperado al guardar los cambios.');
  });
});