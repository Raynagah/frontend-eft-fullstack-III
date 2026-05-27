import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ReportarView from '../views/ReportarView.vue'; // Ajusta la ruta si es necesario
import api from '../api/axiosConfig.js';

// ==========================================================
// 1. MOCKS GLOBALES AVANZADOS (Hoisted para capturar eventos)
// ==========================================================

const { mapCallbacks, markerCallbacks, mockMarker, mockMap } = vi.hoisted(() => {
  const mapCbs = {};
  const markerCbs = {};

  // Declaramos los objetos primero para poder retornarlos explícitamente y evitar que "this" sea undefined
  const marker = {
    getLatLng: vi.fn(() => ({ lat: -42.0, lng: -73.0 }))
  };
  marker.addTo = vi.fn(() => marker); // <-- Retorna el objeto explícitamente
  marker.setLatLng = vi.fn(() => marker);
  marker.on = vi.fn((event, cb) => { markerCbs[event] = cb; return marker; });

  const map = {};
  map.setView = vi.fn(() => map);
  map.on = vi.fn((event, cb) => { mapCbs[event] = cb; return map; });

  return { 
    mapCallbacks: mapCbs, 
    markerCallbacks: markerCbs, 
    mockMarker: marker, 
    mockMap: map 
  };
});

// Mock de Axios
vi.mock('../api/axiosConfig.js', () => ({
  default: { post: vi.fn() }
}));

// Mock si usas Leaflet vía import (NPM)
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(() => mockMap) })),
    icon: vi.fn(),
    marker: vi.fn(() => mockMarker)
  }
}));

// Mock si usas Leaflet de forma global (CDN en el index.html)
vi.stubGlobal('L', {
  map: vi.fn(() => mockMap),
  tileLayer: vi.fn(() => ({ addTo: vi.fn(() => mockMap) })),
  icon: vi.fn(),
  marker: vi.fn(() => mockMarker)
});

describe('ReportarView.vue', () => {

  // ==========================================================
  // 2. CONFIGURACIÓN ANTES DE CADA TEST
  // ==========================================================
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Silenciar logs y mockear alert
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Simular Geolocation por defecto (éxito)
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn((success) => 
        success({
          coords: { latitude: -41.4693, longitude: -72.9424 } 
        })
      )
    };
  });

  afterEach(() => {
    delete global.navigator.geolocation;
    vi.restoreAllMocks();
  });

  const createWrapper = () => mount(ReportarView, {
    global: { stubs: ['router-link'] }
  });

  // ==========================================================
  // 3. CASOS DE PRUEBA
  // ==========================================================

  it('1. Renderiza por defecto y cambia campos dinámicos según tipoReporte', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    // Por defecto es PERDIDA, nombre es requerido
    const inputNombre = wrapper.find('[data-testid="input-nombre-mascota"]');
    expect(inputNombre.attributes('required')).toBe('');

    // Cambiamos a ENCONTRADA
    const selectTipo = wrapper.find('[data-testid="select-tipo-reporte"]');
    await selectTipo.setValue('ENCONTRADA');
    
    // El nombre ya no debería ser requerido
    expect(inputNombre.attributes('required')).toBeUndefined();
  });

  it('2. Autocompleta datos del usuario desde localStorage', async () => {
    localStorage.setItem('usuario', JSON.stringify({
      id: 99,
      nombre: 'Ana',
      telefono: '987654',
      email: 'ana@test.com' 
    }));

    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.form.usuarioId).toBe(99);
    expect(wrapper.vm.form.nombreContacto).toBe('Ana');
    expect(wrapper.vm.form.emailContacto).toBe('ana@test.com');
  });

  it('3. Actualiza coordenadas al hacer CLIC en el mapa interactivo', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(mapCallbacks['click']).toBeDefined();
    mapCallbacks['click']({ latlng: { lat: 10.5, lng: -20.5 } });

    expect(wrapper.vm.form.latitud).toBe(10.5);
    expect(wrapper.vm.form.longitud).toBe(-20.5);
    expect(mockMarker.setLatLng).toHaveBeenCalledWith([10.5, -20.5]);
  });

  it('4. Actualiza coordenadas al ARRASTRAR el marcador (dragend)', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(markerCallbacks['dragend']).toBeDefined();
    markerCallbacks['dragend']({ target: mockMarker });

    expect(wrapper.vm.form.latitud).toBe(-42.0);
    expect(wrapper.vm.form.longitud).toBe(-73.0);
  });

  it('5. Alerta si el navegador no soporta geolocalización', async () => {
    delete global.navigator.geolocation; // Forzamos falla
    
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('.btn-ubicacion').trigger('click');
    expect(window.alert).toHaveBeenCalledWith('Tu navegador no soporta geolocalización.');
  });

  it('6. Alerta si getCurrentPosition falla (usuario deniega permisos)', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    // Sobrescribimos el mock solo para este test (ejecuta el callback de error)
    global.navigator.geolocation.getCurrentPosition.mockImplementationOnce((success, errorCb) => {
      errorCb(new Error('User denied Geolocation'));
    });

    await wrapper.find('.btn-ubicacion').trigger('click');
    
    expect(window.alert).toHaveBeenCalledWith(
      'No pudimos obtener una ubicación precisa. Por favor, marca el punto manualmente en el mapa.'
    );
    expect(wrapper.vm.obteniendoUbicacion).toBe(false);
  });

  it('7. Muestra error si se envía sin sesión (usuarioId null)', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.vm.enviarReporte();

    expect(wrapper.find('.alerta.error').text()).toContain('Debes iniciar sesión para reportar una mascota.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('8. Envía el reporte exitosamente', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
    api.post.mockResolvedValueOnce({ data: { success: true } });

    const wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.form.nombre = 'Max';
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(api.post).toHaveBeenCalled();
    expect(wrapper.find('.alerta.exito').exists()).toBe(true);
  });

  it('9. Maneja error 403 del servidor (Permisos)', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
    api.post.mockRejectedValueOnce({ response: { status: 403 } });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.vm.enviarReporte();
    await flushPromises();

    expect(wrapper.find('.alerta.error').text()).toContain('No tienes permiso para realizar esta acción');
  });

  it('10. Maneja error de validación de datos (response.data)', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { msg: 'Bad Request' } } });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.vm.enviarReporte();
    await flushPromises();

    expect(wrapper.find('.alerta.error').text()).toContain('Error en los datos: Revisa los campos e intenta nuevamente.');
  });

  it('11. Maneja error genérico de conexión (Servidor caído)', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.vm.enviarReporte();
    await flushPromises();

    expect(wrapper.find('.alerta.error').text()).toContain('Error de conexión con el servidor. Intenta más tarde.');
  });

  it('12. Obtiene la ubicación del usuario exitosamente (Geolocation Success)', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    // Hacemos clic en el botón que dispara la función ubicarUsuario
    await wrapper.find('.btn-ubicacion').trigger('click');
    await flushPromises();

    // Verificamos que las coordenadas se actualizaron con los datos de nuestro mock
    expect(wrapper.vm.form.latitud).toBe(-41.4693);
    expect(wrapper.vm.form.longitud).toBe(-72.9424);
    
    // Verificamos que el estado de carga vuelve a falso
    expect(wrapper.vm.obteniendoUbicacion).toBe(false);

    // Verificamos que los métodos de Leaflet se llamaron para centrar el mapa
    expect(mockMap.setView).toHaveBeenCalledWith([-41.4693, -72.9424], 17);
    expect(mockMarker.setLatLng).toHaveBeenCalledWith([-41.4693, -72.9424]);
  });

  it('13. Muestra el estado de carga al buscar ubicación (cubre línea 76)', async () => {
    const wrapper = createWrapper();
    
    // Sobrescribimos el mock SOLO para este test, dándole una función vacía 
    // que nunca se resuelve. Esto "congela" el estado de carga.
    global.navigator.geolocation.getCurrentPosition.mockImplementationOnce(() => {});

    await wrapper.find('.btn-ubicacion').trigger('click');
    await flushPromises(); // Damos tiempo a Vue para actualizar el DOM

    // Ahora verificamos que la línea 76 cambió exitosamente
    expect(wrapper.text()).toContain('Buscando con precisión...');
  });

  it('14. Interactúa con todos los inputs para cubrir los v-model', async () => {
    const wrapper = createWrapper();

    // 1. Inputs con data-testid
    await wrapper.find('[data-testid="select-tipo-reporte"]').setValue('ENCONTRADA');
    await wrapper.find('[data-testid="input-nombre-mascota"]').setValue('Fido');
    await wrapper.find('[data-testid="select-especie"]').setValue('Perro');
    await wrapper.find('[data-testid="input-color"]').setValue('Negro');

    // 2. Select sin testid (el tamaño es el tercer select en el DOM)
    const selects = wrapper.findAll('select');
    await selects[2].setValue('Pequeño');

    // 3. Inputs por su tipo o placeholder
    await wrapper.find('input[placeholder="Ej: Labrador o Mestizo"]').setValue('Pug');
    await wrapper.find('input[type="url"]').setValue('https://foto.com/perro.jpg');
    await wrapper.find('input[placeholder="Tu nombre y apellido"]').setValue('Juan Pérez');
    await wrapper.find('input[placeholder="+56 9 1234 5678"]').setValue('+56912345678');
    await wrapper.find('input[type="email"]').setValue('juan@test.com');

    // Verificamos que al menos un par de valores hayan mutado correctamente
    expect(wrapper.vm.form.nombre).toBe('Fido');
    expect(wrapper.vm.form.emailContacto).toBe('juan@test.com');
  });
});