import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import MascotaCard from './mascotaCard.vue';

// Necesitamos simular (stub) el router-link porque el componente lo usa
const globalMountOptions = {
  stubs: {
    'router-link': true
  }
};

describe('Componente MascotaCard.vue', () => {
  
  // --- TEST 1: Renderizado básico ---
  it('Debe renderizar el nombre y el resumen correctamente', () => {
    // Arrange: Preparamos los datos de la mascota
    const mascotaMock = {
      id: 1,
      nombre: 'Firulais',
      resumen: 'Se perdió cerca del parque',
      sagaStatus: 'COMPLETED'
    };

    // Act: Renderizamos el componente pasándole los props
    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    // Assert: Verificamos que los textos existan en la pantalla
    expect(screen.getByText('Firulais')).toBeTruthy();
    expect(screen.getByText('Se perdió cerca del parque')).toBeTruthy();
    expect(screen.getByText('COMPLETED')).toBeTruthy();
  });

  // --- TEST 2: Lógica de Imagen (Prioridad 1: URL) ---
  it('Debe usar la fotografiaUrl si está disponible', () => {
    const mascotaMock = {
      nombre: 'Kuky',
      fotografiaUrl: 'https://mi-servidor.com/foto.jpg'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    // Buscamos la imagen por su rol y verificamos el atributo src
    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('https://mi-servidor.com/foto.jpg');
  });

  // --- TEST 3: Lógica de Imagen (Estrategia de rescate: Perro) ---
  it('Debe usar la imagen de perro por defecto si el título lo menciona', () => {
    const mascotaMock = {
      nombre: 'Max',
      titulo: 'Perro perdido con collar azul', // Aquí está la palabra clave
      especie: '' // No hay especie explícita ni URL
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    const imagen = screen.getByRole('img');
    // Verifica tu computed property: si es perro devuelve '/img/perro-default.png'
    expect(imagen.getAttribute('src')).toBe('/img/perro-default.png');
  });

  // --- TEST 4: Lógica de Estado (Clases CSS) ---
  it('Debe aplicar la clase badge-danger si el estado es REJECTED', () => {
    const mascotaMock = {
      nombre: 'Pelusa',
      sagaStatus: 'REJECTED'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    // Buscamos el elemento que contiene el texto REJECTED
    const badge = screen.getByText('REJECTED');
    // Comprobamos que el elemento HTML contenga esa clase CSS específica
    expect(badge.classList.contains('badge-danger')).toBe(true);
  });
});