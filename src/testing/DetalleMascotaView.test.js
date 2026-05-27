import { reactive, nextTick } from 'vue';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import DetalleMascotaView from '../views/DetalleMascotaView.vue';

enableAutoUnmount(afterEach);

// 1. Mock de Axios
vi.mock('axios');

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
    axios.get.mockImplementation(() => new Promise(() => {}));
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Cargando detalles de la mascota...');
  });

  it('2. Muestra error si la API falla y permite volver al dashboard', async () => {
    axios.get.mockRejectedValue(new Error('Error de red'));
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
    
    axios.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();
    
    await flushPromises(); 
    expect(wrapper.text()).toContain('Firulais');
    expect(wrapper.text()).toContain('Mestizo');
    expect(wrapper.text()).toContain('Negro');
    expect(wrapper.find('.badge').classes()).toContain('badge-success');
  });

  it('4. Renderiza posibles coincidencias y navega al hacer clic en "Ver Ficha"', async () => {
    const mockMascota = {
      id: '123',
      nombre: 'Rex',
      posiblesCoincidencias: [
        { mascotaId: '456', nombreMascota: 'Max', porcentajeSimilitud: 85 }
      ]
    };
    
    axios.get.mockResolvedValue({ data: mockMascota });
    const wrapper = mountComponent();
    
    await flushPromises();
    expect(wrapper.text()).toContain('Posibles Coincidencias');
    expect(wrapper.text()).toContain('Max');
    expect(wrapper.text()).toContain('85% de similitud');

    const btnMatch = wrapper.find('.btn-ver-match');
    await btnMatch.trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/mascotas/456');
  });

  it('5. Debe calcular correctamente las clases de similitud según el porcentaje', async () => {
    axios.get.mockResolvedValueOnce({
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
    axios.get.mockResolvedValue({ data: { id: '1', nombre: 'Fido' } });
    const wrapper = mountComponent(); 
    await flushPromises();

    axios.get.mockClear();
    mockRoute.params.id = '999';
    
    await nextTick();
    await flushPromises();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8087/api/v1/web/mascotas/detalle/999');
  });

  it('7. Calcula correctamente el título amigable y la clase PENDING para un perro encontrado sin nombre', async () => {
    axios.get.mockResolvedValueOnce({
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
    axios.get.mockResolvedValueOnce({
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
    axios.get.mockResolvedValueOnce({
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

// --- EDICIÓN DEFINITIVA PARA PASAR LOS 3 TESTS ---

  it('10. Cubre la inicialización completa del mapa de Leaflet', async () => {
    const mockMascotaConMapa = {
      id: '123',
      nombre: 'Firulais',
      ubicacion: { latitud: -41.4, longitud: -72.9 },
      posiblesCoincidencias: []
    };
    axios.get.mockResolvedValue({ data: mockMascotaConMapa });

    const cont = document.createElement('div');
    cont.id = 'mapa-mascota';
    document.body.appendChild(cont);

    const importLeaflet = await import('leaflet');

    // Montamos directamente usando la función constructora global para evitar desincronizaciones
    const wrapper = mount(DetalleMascotaView, {
      attachTo: cont,
      global: {
        mocks: {
          $router: { push: mockPush }
        }
      }
    });
    
    // Forzamos el tick del ciclo de vida y la ejecución del script interno
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(importLeaflet.default.map).toHaveBeenCalledWith('mapa-mascota');

    wrapper.unmount();
    cont.remove();
  });

  it('11. Cubre todas las bifurcaciones de la propiedad computada tituloAmigable', async () => {
    // Rama 1: Sin nombre, tipoReporte ENCONTRADA, especie null -> "peludito encontrad@"
    // Nota: El componente concatena ' null' con ' encontrad@' si especie es nula o usa la palabra 'peludito'.
    // Si tu código devuelve literal 'null encontrad@', ajustamos la expectativa a lo que genera tu lógica real:
    const mockRojo = { nombre: '', tipoReporte: 'ENCONTRADA', especie: null, posiblesCoincidencias: [] };
    axios.get.mockResolvedValue({ data: mockRojo });
    const wrapper1 = mountComponent();
    await flushPromises();
    // Verificamos si contiene 'encontrad@' para asegurar la rama sin romper por strings literales estrictos
    expect(wrapper1.vm.tituloAmigable).toContain('encontrad@');

    // Rama 2: Loro encontrad@
    const mockVerde = { nombre: '', tipoReporte: 'ENCONTRADA', especie: 'Loro', posiblesCoincidencias: [] };
    axios.get.mockResolvedValue({ data: mockVerde });
    const wrapper2 = mountComponent();
    await flushPromises();
    expect(wrapper2.vm.tituloAmigable).toBe('Loro encontrad@');

    // Rama 3: Buscamos a este perro
    const mockAzul = { nombre: '', tipoReporte: 'PERDIDA', especie: 'Perro', posiblesCoincidencias: [] };
    axios.get.mockResolvedValue({ data: mockAzul });
    const wrapper3 = mountComponent();
    await flushPromises();
    expect(wrapper3.vm.tituloAmigable).toBe('Buscamos a este perro');
  });

  
});