import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'vue-router';
import api from '../api/axiosConfig.js';
import BandejaNotificaciones from '../views/BandejaNotificacionesView.vue';

// Mock dinámico de las dependencias
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

describe('BandejaNotificaciones.vue - Cobertura 100%', () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    localStorage.setItem('usuario', JSON.stringify({ id: 42 }));
    
    // Resolve base para evitar bloqueos por carga
    vi.mocked(api.get).mockResolvedValue({ data: [] });
  });

  // --- ESCENARIOS DE CARGA (onMounted) ---
  
  it('Debe renderizar la lista cargada exitosamente y procesar el ordenamiento de filtros', async () => {
    const mockNotifs = [
      { id: 1, mensaje: 'Notificación A', leido: true },
      { id: 2, mensaje: 'Notificación B', leido: false }
    ];
    vi.mocked(api.get).mockResolvedValue({ data: mockNotifs });

    const wrapper = mount(BandejaNotificaciones);
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/web/notificaciones/usuario/42');
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.findAll('.notif-card')).toHaveLength(2);
    
    const cards = wrapper.findAll('.notif-card');
    expect(cards[0].classes()).toContain('no-leida');
  });

  it('Debe detener la carga si no existe un usuario en localStorage', async () => {
    localStorage.removeItem('usuario');
    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find('.loading').exists()).toBe(false);
  });

  it('Debe capturar el error y apagar el estado "cargando" si falla la API de obtención', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(new Error('API Drop'));

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    expect(spyConsole).toHaveBeenCalled();
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  // --- FILTROS ---

  it('Debe alternar los filtros de visualización y calcular totales', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 1, mensaje: 'Leída', leido: true },
        { id: 2, mensaje: 'No Leída', leido: false }
      ]
    });

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    const botonesFiltro = wrapper.findAll('.filtros button');
    
    await botonesFiltro[1].trigger('click');
    expect(wrapper.findAll('.notif-card')).toHaveLength(1);

    await botonesFiltro[0].trigger('click');
    expect(wrapper.findAll('.notif-card')).toHaveLength(2);
  });

  // --- ACCIÓN: MARCAR COMO LEÍDA ---

  it('Debe marcar de forma aislada como leída y controlar excepciones del servidor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 10, mensaje: 'M1', leido: false, reporteId: 5 }] });
    vi.mocked(api.put).mockResolvedValue({});
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    // 1. Caso de éxito al marcar sola
    await wrapper.find('.btn-solo-check').trigger('click');
    expect(api.put).toHaveBeenCalledWith('/web/notificaciones/10/leer');

    // 2. Provocamos que falle el PUT para la cobertura del catch en irADetalle
    vi.mocked(api.put).mockRejectedValueOnce(new Error('Fail put'));
    
    // Remontamos o reiniciamos el estado con una no leída para obligar a irADetalle a pasar por el PUT fallido
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 11, mensaje: 'M2', leido: false, reporteId: 6 }] });
    const wrapperError = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapperError.find('.btn-ir').trigger('click'); 
    expect(spyConsole).toHaveBeenCalled();
  });

  // --- ACCIÓN: ELIMINAR ---

  it('Debe eliminar local y remotamente si se confirma la ventana emergente', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 15, mensaje: 'M2', leido: true }] });
    vi.mocked(api.delete).mockResolvedValue({});
    const spyConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-eliminar').trigger('click');
    expect(spyConfirm).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith('/web/notificaciones/15');
    
    await wrapper.vm.$nextTick(); // <--- CORRECCIÓN: Esperar el ciclo de renderizado de Vue
    expect(wrapper.find('.notif-card').exists()).toBe(false); 
  });

  it('Debe cancelar el proceso de eliminación si el usuario declina el cuadro de diálogo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 15, mensaje: 'M2', leido: true }] });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-eliminar').trigger('click');
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('Debe controlar el error por consola si falla el borrado en el servidor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 15, mensaje: 'M2', leido: true }] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.delete).mockRejectedValue(new Error('DB Lock'));
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-eliminar').trigger('click');
    expect(spyConsole).toHaveBeenCalled();
  });

  // --- ACCIÓN: REDIRECCIÓN E IR A DETALLE ---

  it('Debe redirigir a la ruta usando mascotaId con prioridad sobre reporteId', async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: [{ id: 1, mensaje: 'M', leido: true, mascotaId: 88, reporteId: 99 }] 
    });

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-ir').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/detalle/88');
  });

  it('Debe utilizar reporteId si mascotaId no está definido', async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: [{ id: 1, mensaje: 'M', leido: true, reporteId: 99 }] 
    });

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-ir').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/detalle/99');
  });

  it('Debe alertar mediante advertencia si la notificación carece de IDs de destino', async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: [{ id: 1, mensaje: 'Sin ID', leido: true }] 
    });
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(BandejaNotificaciones);
    await flushPromises();

    await wrapper.find('.btn-ir').trigger('click');
    expect(spyWarn).toHaveBeenCalledWith("La notificación no tiene un ID de reporte asociado.");
  });
});