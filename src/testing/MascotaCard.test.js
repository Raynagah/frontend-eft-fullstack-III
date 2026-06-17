import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import MascotaCard from '../components/mascotas/mascotaCard.vue';

// Necesitamos simular (stub) el router-link porque el componente lo usa
const globalMountOptions = {
  stubs: {
    'router-link': true
  }
};

describe('Componente MascotaCard.vue', () => {

  // --- TEST 1: Renderizado básico ---
  it('Debe renderizar el nombre y el resumen correctamente', () => {
    const mascotaMock = {
      id: 1,
      nombre: 'Firulais',
      resumen: 'Se perdió cerca del parque',
      sagaStatus: 'COMPLETED'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

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

    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('https://mi-servidor.com/foto.jpg');
  });

  // --- TEST 3: Lógica de Imagen (Estrategia de rescate: Perro) ---
  it('Debe usar la imagen de perro por defecto si el título lo menciona', () => {
    const mascotaMock = {
      nombre: 'Max',
      titulo: 'Perro perdido con collar azul',
      especie: ''
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('/img/perro-default.png');
  });

  // --- TEST 4: Lógica de Estado (Clases CSS - REJECTED) ---
  it('Debe aplicar la clase badge-danger si el estado es REJECTED', () => {
    const mascotaMock = {
      nombre: 'Pelusa',
      sagaStatus: 'REJECTED'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    const badge = screen.getByText('REJECTED');
    expect(badge.classList.contains('badge-danger')).toBe(true);
  });

  // --- TEST 5: Rescate de nombre faltante ---
  it('Debe mostrar "Sin nombre" y el alt genérico si la mascota no tiene nombre definido', () => {
    const mascotaMock = {
      resumen: 'Mascota encontrada sin placa',
      sagaStatus: 'COMPLETED'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    expect(screen.getByText('Sin nombre')).toBeTruthy();
    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('alt')).toBe('Foto de mascota');
  });

  // --- TEST 6: Lógica de Imagen (Gato) ---
  it('Debe usar la imagen de gato por defecto si el texto de búsqueda contiene la palabra gato', () => {
    const mascotaMock = {
      nombre: 'Michi',
      titulo: 'Se busca gato perdido color pardo',
      especie: ''
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('/img/gato-default.png');
  });

  // --- TEST 7: Lógica de Estado (PENDING) ---
  it('Debe aplicar la clase badge-warning si el estado es PENDING', () => {
    const mascotaMock = {
      nombre: 'Simba',
      sagaStatus: 'PENDING'
    };

    render(MascotaCard, {
      props: { mascota: mascotaMock },
      global: globalMountOptions
    });

    const badge = screen.getByText('PENDING');
    expect(badge.classList.contains('badge-warning')).toBe(true);
  });

  // --- NUEVO TEST 8: Lógica de tiempo relativo ---
  it('Debe calcular correctamente el tiempo relativo en base a la fecha actual', () => {
    const hoy = new Date();

    // Función auxiliar para restar días y probar todas las ramas matemáticas
    const generarFecha = (diasAtras) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - diasAtras);
      return fecha.toISOString();
    };

    const verificarTiempo = (fechaIso, textoEsperado) => {
      const { unmount } = render(MascotaCard, {
        props: { mascota: { fechaReporte: fechaIso } },
        global: globalMountOptions
      });
      expect(screen.getByText(`🕒 ${textoEsperado}`)).toBeTruthy();
      unmount(); // Desmontamos para no ensuciar el DOM en cada ciclo
    };

    verificarTiempo(generarFecha(0), 'Hoy');
    verificarTiempo(generarFecha(1), 'Ayer');
    verificarTiempo(generarFecha(5), 'Hace 5 días');
    verificarTiempo(generarFecha(8), 'Hace 1 semana');
    verificarTiempo(generarFecha(15), 'Hace 2 semanas');
    verificarTiempo(generarFecha(35), 'Hace 1 mes');
    verificarTiempo(generarFecha(65), 'Hace 2 meses');
    verificarTiempo(generarFecha(-2), 'Reciente'); // Simulación de fecha futura
  });

  // --- NUEVO TEST 9: Tipos de Reporte ---
  it('Debe renderizar textos y clases correctas según el tipo de reporte', () => {
    const verificarTipo = (tipo, textoEsperado, claseEsperada) => {
      const { unmount } = render(MascotaCard, {
        props: { mascota: { tipoReporte: tipo } },
        global: globalMountOptions
      });
      const badge = screen.getByText(textoEsperado);
      expect(badge.classList.contains(claseEsperada)).toBe(true);
      unmount();
    };

    verificarTipo('PERDIDA', '🔍 Perdida', 'reporte-perdida');
    verificarTipo('ENCONTRADA', '🤝 Encontrada', 'reporte-encontrada');
    verificarTipo('OTRO_TIPO', 'OTRO_TIPO', 'reporte-default'); // Rama por defecto
  });

  // --- NUEVO TEST 10: Fallbacks de Imagen ---
  it('Debe manejar propiedades fotoUrl, ignorar strings "null" y aplicar fallback por defecto', () => {
    // Escenario 1: Tiene fotoUrl en lugar de fotografiaUrl
    const { unmount: unmount1 } = render(MascotaCard, {
      props: { mascota: { fotoUrl: 'https://img.com/alternativa.png' } },
      global: globalMountOptions
    });
    expect(screen.getByRole('img').getAttribute('src')).toBe('https://img.com/alternativa.png');
    unmount1();

    // Escenario 2: La URL es el string "null" literal y no se puede deducir la especie
    const { unmount: unmount2 } = render(MascotaCard, {
      props: { mascota: { fotoUrl: 'null', especie: 'Tortuga', titulo: 'Perdí mi mascota' } },
      global: globalMountOptions
    });
    expect(screen.getByRole('img').getAttribute('src')).toBe('/img/mascota-default.png');
    unmount2();
  });

  // --- NUEVO TEST 11: Lógica de Estado (Traducciones y Fallbacks) ---
  it('Debe aplicar las clases correctas para estados en español y estados no mapeados', () => {
    const verificarEstado = (estado, claseEsperada) => {
      const { unmount } = render(MascotaCard, {
        props: { mascota: { estado: estado } }, // Usamos 'estado' en vez de 'sagaStatus'
        global: globalMountOptions
      });
      const badge = screen.getByText(estado);
      expect(badge.classList.contains(claseEsperada)).toBe(true);
      unmount();
    };

    verificarEstado('COMPLETADO', 'badge-success');
    verificarEstado('PENDIENTE', 'badge-warning');
    verificarEstado('RECHAZADO', 'badge-danger');
    verificarEstado('FAILED_SYNC', 'badge-danger');
    verificarEstado('ESTADO_DESCONOCIDO', 'badge-default'); // Rama por defecto
  });

  // --- TEST 12: Cobertura de Fallbacks (Mascota completamente vacía) ---
  it('Debe manejar un objeto mascota vacío usando todos los fallbacks (|| \'\') por defecto', () => {
    // Pasamos un objeto sin propiedades para forzar todas las evaluaciones || ''
    render(MascotaCard, {
      props: { mascota: {} }, 
      global: globalMountOptions
    });

    // 1. Fallback de imagen y especie: Al no haber URL, especie ni título, usa la general
    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('/img/mascota-default.png');
    
    // 2. Fallback de nombre: Muestra 'Sin nombre' y el alt por defecto
    expect(screen.getByText('Sin nombre')).toBeTruthy();
    expect(imagen.getAttribute('alt')).toBe('Foto de mascota');

    // Nota: Los badges de tipoReporte y estado no se renderizan porque tienen v-if,
    // pero internamente el componente calculó sus fallbacks a '' sin romperse.
  });

  // --- TEST 13: Cobertura de URL vacía con espacios ---
  it('Debe ignorar URLs de imagen que solo contienen espacios en blanco y usar el fallback', () => {
    render(MascotaCard, {
      props: { 
        mascota: { 
          fotoUrl: '   ', // Solo espacios para forzar String(url).trim() === ''
          titulo: 'Busco perro perdido' 
        } 
      },
      global: globalMountOptions
    });

    // Como la URL es inválida (vacía al hacer trim), debe caer al fallback
    // y como el título dice "perrito", deduce que es un perro
    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('/img/perro-default.png');
  });

  // --- TEST: Fallback de tipoReporte con valor distinto (Líneas 77-80 y 85-88) ---
  it('Debe aplicar la clase y texto por defecto si el tipoReporte no es PERDIDA ni ENCONTRADA', () => {
    const { container } = render(MascotaCard, {
      props: { 
        mascota: { 
          titulo: 'Mascota vista',
          tipoReporte: 'AVISTAMIENTO' // Un estado que no cubren los IFs
        } 
      },
      global: globalMountOptions
    });

    // Validamos que devuelva el texto crudo (Línea 80)
    expect(screen.getByText('AVISTAMIENTO')).toBeTruthy();
    
    // Validamos que asigne la clase por defecto (Línea 88)
    const elementoReporte = container.querySelector('.reporte-default');
    expect(elementoReporte).toBeTruthy();
  });

  // --- TEST: Fallback de estado con valor distinto (Línea 120) ---
  it('Debe aplicar la clase badge-default si el estado no coincide con los valores conocidos', () => {
    const { container } = render(MascotaCard, {
      props: { 
        mascota: { 
          titulo: 'Perrito',
          estado: 'NUEVO_ESTADO_RARO' // Estado no mapeado
        } 
      },
      global: globalMountOptions
    });

    // Validamos que caiga al último return de estadoClase (Línea 120)
    const badgeEstado = container.querySelector('.badge-default');
    expect(badgeEstado).toBeTruthy();
  });

  // --- TEST: Valores nulos o indefinidos ---
  it('Debe manejar propiedades nulas o ausentes en la mascota de forma segura', () => {
    // Mandamos el objeto vacío para forzar que (props.mascota.propiedad || '') se evalúe sin errores
    const { container } = render(MascotaCard, {
      props: { 
        mascota: {} // Sin tipoReporte, sin estado, sin especie
      },
      global: globalMountOptions
    });

    // Al no haber datos, las etiquetas (badges) no deberían renderizarse en el DOM (v-if / v-show)
    expect(container.querySelector('.reporte-default')).toBeNull();
    expect(container.querySelector('.badge-default')).toBeNull();
    
    // Lo que sí debe renderizarse sí o sí es el fallback de la imagen
    const imagen = screen.getByRole('img');
    expect(imagen.getAttribute('src')).toBe('/img/mascota-default.png');
  });
});