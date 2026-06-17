import { reactive, nextTick } from 'vue';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import api from '../api/axiosConfig.js';
import DetalleMascotaView from '../views/DetalleMascotaView.vue';

enableAutoUnmount(afterEach);

// 1. Mock de cliente API personalizado
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// 2. Mock de Vue Router
const mockPush = vi.fn();
const mockRoute = reactive({
  params: { id: '123' }
});

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => mockRoute
}));

// 3. Mock unificado de Leaflet
const mockMapInstance = { setView: vi.fn().mockReturnThis(), remove: vi.fn() };
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    icon: vi.fn(),
    marker: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      openPopup: vi.fn()
    }))
  }
}));

beforeAll(() => {
  // Simulamos window.scrollTo para que JSDOM no se queje
  window.scrollTo = vi.fn();
});

describe('DetalleMascotaView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.params.id = '123';
  });

  const mountComponent = () => {
    return mount(DetalleMascotaView, {
      global: {
        mocks: {
          $router: { push: mockPush }
        }
      }
    });
  };

  it('1. Muestra mensaje de carga inicialmente', () => {
    api.get.mockImplementation(() => new Promise(() => { }));
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Cargando detalles de la mascota...');
  });

  it('2. Muestra error si la API falla y permite volver al dashboard', async () => {
    api.get.mockRejectedValue(new Error('Error de red'));
    const wrapper = mountComponent();

    await flushPromises();
    expect(wrapper.text()).toContain('No se pudo encontrar la información de esta mascota.');

    const btnVolver = wrapper.find('.btn-volver');
    await btnVolver.trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/mascotas');
  });

  it('3. Renderiza los datos de la mascota correctamente al cargar', async () => {
    const mockMascota = {
      id: '123',
      nombre: 'Firulais',
      especie: 'Perro',
      raza: 'Mestizo',
      color: 'Negro',
      tamano: 'Mediano',
      sagaStatus: 'COMPLETED',
      ubicacion: { latitud: -41.4, longitud: -72.9 },
      posiblesCoincidencias: []
    };

    api.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();

    await flushPromises();
    expect(wrapper.text()).toContain('Firulais');
    expect(wrapper.text()).toContain('Mestizo');
    expect(wrapper.text()).toContain('Negro');
    expect(wrapper.find('.badge').classes()).toContain('badge-success');
  });

  it('4. Renderiza posibles coincidencias y navega al hacer clic en "Ir a este reporte"', async () => {
    const mockMascota = {
      id: '123',
      nombre: 'Rex',
      posiblesCoincidencias: [
        { mascotaId: '456', nombreMascota: 'Max', porcentajeSimilitud: 85 }
      ]
    };

    api.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();

    await flushPromises();
    expect(wrapper.text()).toContain('Posibles Coincidencias');
    expect(wrapper.text()).toContain('Max');

    const botonMatch = wrapper.find('.btn-ver-match');
    await botonMatch.trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/detalle/456');
  });

  it('5. Debe calcular correctamente las clases de similitud según el porcentaje', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: '1',
        nombre: 'Fido',
        posiblesCoincidencias: [
          { mascotaId: '2', porcentajeSimilitud: 85 },
          { mascotaId: '3', porcentajeSimilitud: 60 },
          { mascotaId: '4', porcentajeSimilitud: 30 }
        ]
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.html()).toContain('fill-alta');
    expect(wrapper.html()).toContain('fill-media');
    expect(wrapper.html()).toContain('fill-baja');
  });

  it('6. Debe recargar los datos cuando cambia el ID en la ruta (watcher)', async () => {
    api.get.mockResolvedValue({ data: { id: '1', nombre: 'Fido' } });
    const wrapper = mountComponent();
    await flushPromises();

    api.get.mockClear();
    mockRoute.params.id = '999';

    await nextTick();
    await flushPromises();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/web/mascotas/detalle/999');
  });

  it('7. Calcula correctamente el título amigable y la clase PENDING para un perro encontrado sin nombre', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: '777',
        nombre: '   ',
        tipoReporte: 'ENCONTRADA',
        especie: 'Perro',
        estado: 'PENDING',
        latitud: -41.4,
        longitud: -72.9
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Perrito encontrado');
    expect(wrapper.find('.badge').classes()).toContain('badge-warning');
  });

  it('8. Calcula el título para un gato encontrado y asigna clase REJECTED', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: '888',
        nombre: null,
        tipoReporte: 'ENCONTRADA',
        especie: 'Gato',
        sagaStatus: 'REJECTED',
        ubicacion: { latitud: -41.4, longitud: -72.9 }
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Gatito encontrado');
    expect(wrapper.find('.badge').classes()).toContain('badge-danger');
  });

  it('9. Evita inicializar el mapa si la mascota no tiene coordenadas', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: '999',
        nombre: 'Firulais Sin Mapa',
        tipoReporte: 'PERDIDA',
        sagaStatus: 'UNKNOWN',
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Firulais Sin Mapa');
    expect(wrapper.find('.badge').classes()).toContain('badge-default');
  });

  it('10. Cubre la inicialización completa del mapa de Leaflet', async () => {
    const mockMascotaConMapa = {
      id: '123',
      nombre: 'Firulais',
      ubicacion: { latitud: -41.4, longitud: -72.9 },
      posiblesCoincidencias: []
    };
    api.get.mockResolvedValue({ data: mockMascotaConMapa });

    const cont = document.createElement('div');
    cont.id = 'mapa-mascota';
    document.body.appendChild(cont);

    const importLeaflet = await import('leaflet');

    const wrapper = mount(DetalleMascotaView, {
      attachTo: cont,
      global: {
        mocks: {
          $router: { push: mockPush }
        }
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(importLeaflet.default.map).toHaveBeenCalledWith('mapa-mascota');

    wrapper.unmount();
    cont.remove();
  });

  it('11. Cubre todas las bifurcaciones de la propiedad computada tituloAmigable', async () => {
    const mockRojo = { nombre: '', tipoReporte: 'ENCONTRADA', especie: null, posiblesCoincidencias: [] };
    api.get.mockResolvedValue({ data: mockRojo });
    const wrapper1 = mountComponent();
    await flushPromises();
    expect(wrapper1.vm.tituloAmigable).toContain('encontrad@');

    const mockVerde = { nombre: '', tipoReporte: 'ENCONTRADA', especie: 'Loro', posiblesCoincidencias: [] };
    api.get.mockResolvedValue({ data: mockVerde });
    const wrapper2 = mountComponent();
    await flushPromises();
    expect(wrapper2.vm.tituloAmigable).toBe('Loro encontrad@');

    const mockAzul = { nombre: '', tipoReporte: 'PERDIDA', especie: 'Perro', posiblesCoincidencias: [] };
    api.get.mockResolvedValue({ data: mockAzul });
    const wrapper3 = mountComponent();
    await flushPromises();
    expect(wrapper3.vm.tituloAmigable).toBe('Buscamos a este perro');
  });

  it('12. Muestra la descripción de la coincidencia si la propiedad descripcionMatch existe', async () => {
    const mockMascota = {
      id: '123',
      nombre: 'Rex',
      posiblesCoincidencias: [
        { mascotaId: '456', nombreMascota: 'Max', porcentajeSimilitud: 85, descripcionMatch: 'Coincide en la mancha del ojo izquierdo' }
      ]
    };

    api.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();

    await flushPromises();
    expect(wrapper.text()).toContain('Coincide en la mancha del ojo izquierdo');
  });

  it('13. La propiedad computada estadoClase retorna un string vacío si mascota.value es null (estado de carga inicial)', () => {
    api.get.mockReturnValue(new Promise(() => { }));
    const wrapper = mountComponent();
    expect(wrapper.vm.estadoClase).toBe('');
  });

  it('14. Destruye la instancia previa del mapa antes de crear una nueva al cambiar de ruta', async () => {
    const cont = document.createElement('div');
    cont.id = 'mapa-mascota';
    document.body.appendChild(cont);

    api.get.mockResolvedValue({
      data: { id: '1', nombre: 'Fido', ubicacion: { latitud: -41.4, longitud: -72.9 } }
    });

    const wrapper = mount(DetalleMascotaView, { attachTo: cont, global: { mocks: { $router: { push: mockPush } } } });
    await flushPromises();
    await wrapper.vm.$nextTick();

    api.get.mockResolvedValue({
      data: { id: '2', nombre: 'Fido Cambiado', ubicacion: { latitud: -41.4, longitud: -72.9 } }
    });
    mockRoute.params.id = '2';

    await nextTick();
    await flushPromises();

    expect(mockMapInstance.remove).toHaveBeenCalled();

    wrapper.unmount();
    cont.remove();
  });

  it('15. Captura y muestra un error en consola si falla la inicialización de Leaflet', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const cont = document.createElement('div');
    cont.id = 'mapa-mascota';
    document.body.appendChild(cont);

    api.get.mockResolvedValue({
      data: { id: '1', ubicacion: { latitud: -41.4, longitud: -72.9 } }
    });

    const importLeaflet = await import('leaflet');
    importLeaflet.default.marker.mockImplementationOnce(() => {
      throw new Error('Error simulado de Leaflet');
    });

    const wrapper = mount(DetalleMascotaView, { attachTo: cont, global: { mocks: { $router: { push: mockPush } } } });

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(consoleSpy).toHaveBeenCalledWith("Error al inicializar el mapa:", expect.any(Error));

    consoleSpy.mockRestore();
    wrapper.unmount();
    cont.remove();
  });

  it('16. Usa el index como key en el v-for si la coincidencia no tiene mascotaId', async () => {
    const mockMascota = {
      id: '123',
      nombre: 'Rex',
      posiblesCoincidencias: [
        { nombreMascota: 'Match sin ID', porcentajeSimilitud: 90, descripcionMatch: 'Mismo color' }
      ]
    };

    api.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();

    await flushPromises();
    expect(wrapper.text()).toContain('Match sin ID');
  });

  // =========================================================================
  // COBERTURA DE CAPTURAS: clasetipoReporte, obtenerClaseTipoMatch Y BADGES MINI
  // =========================================================================

  it('17. Retorna string vacío en claseTipoReporte si la mascota es null', () => {
    // Forzamos el estado inicial de carga donde api.get no ha resuelto y mascota es null
    api.get.mockReturnValue(new Promise(() => { }));
    const wrapper = mountComponent();

    // Línea 196 de claseTipoReporte cubierta
    expect(wrapper.vm.claseTipoReporte).toBe('');
  });

  it('18. Usa fallback de string vacío si tipoReporte no está definido en la mascota', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: '123',
        nombre: 'Sin Tipo',
        tipoReporte: null, // Fuerza el operador || '' de la línea 197
        ubicacion: { latitud: -41.4, longitud: -72.9 }
      }
    });
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.vm.claseTipoReporte).toBe('tipo-perdida');
  });

  it('19. Cubre la función obtenerClaseTipoMatch cuando el tipo no existe o es PERDIDA', async () => {
    // Probamos directamente la función de utilidad expuesta en la vm
    api.get.mockResolvedValueOnce({ data: { id: '123' } });
    const wrapper = mountComponent();
    await flushPromises();

    // Línea 289: si !tipo return ''
    expect(wrapper.vm.obtenerClaseTipoMatch(null)).toBe('');
    expect(wrapper.vm.obtenerClaseTipoMatch(undefined)).toBe('');

    // Línea 290 (bifurcación alternativa de la condición ternaria)
    expect(wrapper.vm.obtenerClaseTipoMatch('PERDIDA')).toBe('tipo-perdida-mini');
  });

  it('20. Renderiza el badge-tipo-mini en el template para coincidencias ENCONTRADA y PERDIDA', async () => {
    const mockMascotaConCoincidencias = {
      id: '123',
      nombre: 'Falkor',
      posiblesCoincidencias: [
        { mascotaId: '1', nombreMascota: 'Match1', tipoReporte: 'ENCONTRADA', porcentajeSimilitud: 85 },
        { mascotaId: '2', nombreMascota: 'Match2', tipoReporte: 'PERDIDA', porcentajeSimilitud: 55 }
      ]
    };

    api.get.mockResolvedValue({ data: mockMascotaConCoincidencias });
    const wrapper = mountComponent();
    await flushPromises();

    // Esto obliga a Vue a ejecutar las líneas del template 81-86 en ambas ramas
    const badgesMini = wrapper.findAll('.badge-tipo-mini');
    expect(badgesMini.length).toBe(2);
    expect(badgesMini[0].text()).toContain('ENCONTRADA');
    expect(badgesMini[1].text()).toContain('PERDIDA');
  });

  // =========================================================================
  // COBERTURA DE CAPTURA: fechaFormateated Y TODAS LAS RAMAS DE tiempoRelativo
  // =========================================================================

  it('21. Formatea la fecha correctamente con Intl.DateTimeFormat', async () => {
    // Seteamos una fecha fija conocida: 29 de marzo de 2026, 00:43
    const fechaFija = '2026-03-29T00:43:00.000Z';
    api.get.mockResolvedValueOnce({
      data: { id: '123', fechaReporte: fechaFija }
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Comprobamos que pase por la instanciación de 'new Date' y retorne el formato humano
    expect(wrapper.vm.fechaFormateada).not.toBe('');
    expect(wrapper.text()).toContain('2026');
    expect(wrapper.text()).toContain('marzo');
  });

  it('22. Cubre exhaustivamente los bloques matemáticos intermedios de tiempoRelativo', async () => {
    const mockFechaActual = new Date('2026-06-16T12:00:00.000Z');
    // Usamos vi.useFakeTimers para controlar el "new Date()" interno del componente
    vi.useFakeTimers();
    vi.setSystemTime(mockFechaActual);

    // Caso A: "Hace 4 días" (diferenciaDias = 4, entra en < 7)
    const fechaHace4Dias = new Date('2026-06-12T12:00:00.000Z');
    api.get.mockResolvedValueOnce({ data: { id: '1', fechaReporte: fechaHace4Dias.toISOString() } });
    let wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.tiempoRelativo).toBe('Hace 4 días');

    // Caso B: "Hace X semanas" (diferenciaDias = 15, semanas = 2, semanas !== 1)
    const fechaHace2Semanas = new Date('2026-06-01T12:00:00.000Z');
    api.get.mockResolvedValueOnce({ data: { id: '1', fechaReporte: fechaHace2Semanas.toISOString() } });
    wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.tiempoRelativo).toBe('Hace 2 semanas');

    // Caso C: "Hace X meses" (diferenciaDias = 65, meses = 2, meses !== 1)
    const fechaHace2Meses = new Date('2026-04-12T12:00:00.000Z');
    api.get.mockResolvedValueOnce({ data: { id: '1', fechaReporte: fechaHace2Meses.toISOString() } });
    wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.tiempoRelativo).toBe('Hace 2 meses');

    // Restauramos el tiempo global de testing
    vi.useRealTimers();
  });
});