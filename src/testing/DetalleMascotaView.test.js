import { reactive, nextTick } from 'vue';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../api/axiosConfig.js'; // Ajustado para usar tu cliente personalizado
import DetalleMascotaView from '../views/DetalleMascotaView.vue';

enableAutoUnmount(afterEach);

// 1. Mock de tu cliente API personalizado
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

// 3. Mock unificado de Leaflet (para que coincida con la importación del componente)
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

describe('DetalleMascotaView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reestablecemos el ID por defecto antes de cada prueba
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

    // Capturamos el botón y hacemos clic
    const botonMatch = wrapper.find('.btn-ver-match');
    await botonMatch.trigger('click');

    // Verificamos que haga push a la ruta de detalle
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
});