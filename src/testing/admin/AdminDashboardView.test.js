import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminDashboardView from '../../views/admin/AdminDashboardView.vue';

// 1. Desmontaje automático entre pruebas
enableAutoUnmount(afterEach);

// 2. Mocks de dependencias externas (Router y Stores de Pinia)
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const mockCargarUsuarios = vi.fn();
const mockCargarReportes = vi.fn();

vi.mock('../../stores/usuarioAdminStore', () => ({
  useUsuarioAdminStore: () => ({
    totalUsuarios: 150,
    cargarUsuarios: mockCargarUsuarios
  })
}));

vi.mock('../../stores/reporteAdminStore', () => ({
  useReporteAdminStore: () => ({
    totalReportes: 45,
    cargarReportes: mockCargarReportes
  })
}));

describe('AdminDashboardView.vue', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe disparar la carga de datos de los stores al montarse (onMounted)', () => {
    mount(AdminDashboardView);

    // Validamos que se ejecuten los cargadores iniciales
    expect(mockCargarUsuarios).toHaveBeenCalledTimes(1);
    expect(mockCargarReportes).toHaveBeenCalledTimes(1);
  });

  it('2. Debe renderizar los títulos y el total de estadísticas provistos por los stores', () => {
    const wrapper = mount(AdminDashboardView);

    // Validamos textos fijos del encabezado
    expect(wrapper.find('.main-title').text()).toBe('Panel de Control Principal');
    expect(wrapper.find('.subtitle').text()).toBe('Resumen general del sistema y accesos rápidos.');

    // Validamos que pinte los valores mockeados de los almacenes
    expect(wrapper.text()).toContain('150'); // totalUsuarios
    expect(wrapper.text()).toContain('45');  // totalReportes
  });

  it('3. Debe redirigir a la gestión de usuarios al hacer clic en el botón correspondiente', async () => {
    const wrapper = mount(AdminDashboardView);

    // Buscamos el botón de gestionar usuarios (en tu template es el .btn-primary)
    const btnUsuarios = wrapper.find('.btn-primary');
    await btnUsuarios.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('4. Debe redirigir a la gestión de reportes de mascotas al hacer clic en su respectivo botón', async () => {
    const wrapper = mount(AdminDashboardView);

    // Buscamos el botón de gestionar reportes (en tu template es el .btn-secondary)
    const btnReportes = wrapper.find('.btn-secondary');
    await btnReportes.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/admin/reportes');
  });
});