import { reactive, nextTick } from 'vue';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import DetalleMascotaView from './DetalleMascotaView.vue';
enableAutoUnmount(afterEach);
// 1. Mock de Axios
vi.mock('axios');

// 2. Mock de Vue Router (para el script setup)
const mockPush = vi.fn();

// Hacemos que la ruta sea reactiva para poder probar el watcher
const mockRoute = reactive({
  params: { id: '123' }
});

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => mockRoute
}));

// 3. Mock de Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn()
    })),
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
  });

  // Función de ayuda para montar el componente con el $router inyectado en el HTML
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
    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        id: '1',
        nombre: 'Fido',
        // Estructura ajustada para coincidir con tu renderizado real
        posiblesCoincidencias: [
          { mascotaId: '2', porcentajeSimilitud: 85 }, // Debería retornar 'fill-alta'
          { mascotaId: '3', porcentajeSimilitud: 60 }, // Debería retornar 'fill-media'
          { mascotaId: '4', porcentajeSimilitud: 30 }  // Debería retornar 'fill-baja'
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
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { id: '1', nombre: 'Fido' } });
    
    const wrapper = mountComponent(); 
    await flushPromises();

    axios.get.mockClear();

    // Simulamos un cambio reactivo en la ruta
    mockRoute.params.id = '999';
    
    // Esperamos a que Vue detecte el cambio en el watcher
    await nextTick();
    await flushPromises();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8087/api/v1/web/mascotas/detalle/999');
  });

  it('7. Calcula correctamente el título amigable y la clase PENDING para un perro encontrado sin nombre', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        id: '777',
        nombre: '   ', // Simulamos un nombre vacío o con espacios para activar el fallback
        tipoReporte: 'ENCONTRADA',
        especie: 'Perro', // Activa la rama "Perrito encontrado"
        estado: 'PENDING', // Prueba la clase "badge-warning" (usa 'estado' en lugar de 'sagaStatus')
        latitud: -41.4, // Prueba la estructura alternativa de coordenadas (fuera de "ubicacion")
        longitud: -72.9
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    // Verificamos el título computado y la clase del estado
    expect(wrapper.text()).toContain('Perrito encontrado');
    expect(wrapper.find('.badge').classes()).toContain('badge-warning');
  });

  it('8. Calcula el título para un gato encontrado y asigna clase REJECTED', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        id: '888',
        nombre: null, // Sin nombre
        tipoReporte: 'ENCONTRADA',
        especie: 'Gato', // Activa la rama "Gatito encontrado"
        sagaStatus: 'REJECTED', // Prueba la clase "badge-danger"
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
        tipoReporte: 'PERDIDA', // Activa la rama "Buscamos a este peludito" si fallara el nombre
        sagaStatus: 'UNKNOWN', // Prueba el "badge-default"
        // Intencionalmente omitimos "ubicacion" y "latitud/longitud"
      }
    });

    const wrapper = mountComponent();
    await flushPromises();

    // El componente debería renderizarse sin fallar en initMap()
    expect(wrapper.text()).toContain('Firulais Sin Mapa');
    expect(wrapper.find('.badge').classes()).toContain('badge-default');
  });
});