import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import DetalleMascotaView from './DetalleMascotaView.vue';

// 1. Mock de Axios
vi.mock('axios');

// 2. Mock de Vue Router (para el script setup)
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => ({
    params: { id: '123' }
  })
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
          $router: { push: mockPush } // <--- ¡AQUÍ ESTÁ LA MAGIA!
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
    expect(mockPush).toHaveBeenCalledWith('/mascotas'); // ¡Ahora sí pasará!
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
});