import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsuarioAdminStore } from '../../stores/usuarioAdminStore';
import UsuarioService from '../../services/usuarioService';

describe('UsuarioAdminStore', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useUsuarioAdminStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- GETTERS ---
    it('Debe devolver correctamente las estadísticas y listas filtradas de los getters', () => {
        // Llenamos el store con datos falsos
        store.usuarios = [
            { id: 1, tipoUsuario: 'admin' },
            { id: 2, tipoUsuario: 'cliente' },
            { id: 3, tipoUsuario: 'cliente' },
            { id: 4, tipoUsuario: 'admin' },
            { id: 5, tipoUsuario: 'cliente' },
            { id: 6, tipoUsuario: 'cliente' } // 6 usuarios en total
        ];

        expect(store.totalUsuarios).toBe(6);
        expect(store.administradores.length).toBe(2);
        expect(store.totalAdministradores).toBe(2);
        expect(store.clientes.length).toBe(4);
        expect(store.totalClientes).toBe(4);

        // Verificamos los recientes (solo los 5 con IDs más altos, ordenados de mayor a menor)
        const recientes = store.usuariosRecientes;
        expect(recientes.length).toBe(5);
        expect(recientes[0].id).toBe(6);
        expect(recientes[4].id).toBe(2);
    });

    // --- ACTIONS: cargarUsuarios ---
    it('Debe cargar los usuarios y recalcular totales (Éxito)', async () => {
        const mockData = [{ id: 1, tipoUsuario: 'admin' }, { id: 2, tipoUsuario: 'cliente' }];
        vi.spyOn(UsuarioService, 'listarUsuarios').mockResolvedValue({ data: mockData });

        await store.cargarUsuarios();

        expect(store.usuarios).toEqual(mockData);
        expect(store.totalUsuarios).toBe(2);
        expect(store.totalAdministradores).toBe(1);
        expect(store.totalClientes).toBe(1);
        expect(store.cargando).toBe(false);
    });

    it('Debe manejar el error al cargar usuarios (Error)', async () => {
        vi.spyOn(UsuarioService, 'listarUsuarios').mockRejectedValue(new Error('Fallo crítico'));

        await store.cargarUsuarios();

        expect(store.error).toBe('Error al cargar los usuarios.');
        expect(store.cargando).toBe(false);
    });

    // --- ACTIONS: crearUsuario ---
    it('Debe crear un usuario y pushearlo a la lista (Éxito)', async () => {
        const nuevoUser = { nombre: 'Juan' };
        const mockResponse = { id: 99, nombre: 'Juan', tipoUsuario: 'cliente' };
        vi.spyOn(UsuarioService, 'crearUsuarioAdmin').mockResolvedValue({ data: mockResponse });

        const resultado = await store.crearUsuario(nuevoUser);

        expect(resultado).toEqual(mockResponse);
        expect(store.usuarios[0]).toEqual(mockResponse);
        expect(store.cargando).toBe(false);
    });
    it('Debe usar el mensaje por defecto al crear usuario si el error es genérico (sin error.response)', async () => {
        // Simulamos una caída de red (no hay respuesta del backend)
        const errorGenerico = new Error('Network Error');
        vi.spyOn(UsuarioService, 'crearUsuarioAdmin').mockRejectedValue(errorGenerico);

        // Capturamos la excepción que lanza el throw
        await expect(store.crearUsuario({ nombre: 'Prueba' })).rejects.toThrow('Network Error');

        // Validamos que se usó el lado derecho del ||
        expect(store.error).toBe('Error al crear el usuario');
        // Validamos que pasó por el finally en la ruta de error
        expect(store.cargando).toBe(false);
    });

    it('Debe manejar errores al crear usuario, leyendo el error del backend si existe (Error)', async () => {
        // Simulamos un error estructurado que proviene de axios
        const errorBackend = { response: { data: { error: 'El email ya existe' } } };
        vi.spyOn(UsuarioService, 'crearUsuarioAdmin').mockRejectedValue(errorBackend);

        await expect(store.crearUsuario({})).rejects.toEqual(errorBackend);
        expect(store.error).toBe('El email ya existe');
    });

    it('Debe limpiar el estado de carga al fallar la creación (Backend Error)', async () => {
    const errorBackend = { response: { data: { error: 'Error del servidor' } } };
    vi.spyOn(UsuarioService, 'crearUsuarioAdmin').mockRejectedValue(errorBackend);

    try {
        await store.crearUsuario({});
    } catch (e) { /* error esperado */ }

    expect(store.cargando).toBe(false); // Cubre la línea 65
    expect(store.error).toBe('Error del servidor'); // Cubre el lado izquierdo del || en línea 63
});

    // --- ACTIONS: actualizarUsuario ---
    it('Debe actualizar un usuario y reflejarlo en la lista local (Éxito)', async () => {
        store.usuarios = [{ id: 1, nombre: 'Viejo' }];
        const datosNuevos = { nombre: 'Nuevo' };
        vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockResolvedValue({ data: { id: 1, nombre: 'Nuevo' } });

        const resultado = await store.actualizarUsuario(1, datosNuevos);

        expect(resultado.nombre).toBe('Nuevo');
        expect(store.usuarios[0].nombre).toBe('Nuevo'); // Se actualizó en la lista
    });
    it('Debe usar el mensaje por defecto al actualizar usuario si el error es genérico (sin error.response)', async () => {
        const errorGenerico = new Error('Timeout');
        vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockRejectedValue(errorGenerico);

        await expect(store.actualizarUsuario(1, { nombre: 'Prueba' })).rejects.toThrow('Timeout');

        // Validamos el fallback
        expect(store.error).toBe('Error al actualizar el usuario');
        // Validamos el finally
        expect(store.cargando).toBe(false);
    });

    it('No debe romper la lista si intenta actualizar un ID que no existe en el state (Éxito pero no encontrado)', async () => {
        store.usuarios = [{ id: 1, nombre: 'Viejo' }];
        vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockResolvedValue({ data: { id: 2, nombre: 'Fantasma' } });

        // Actualizamos el id 2, que no existe en nuestra lista local
        await store.actualizarUsuario(2, { nombre: 'Fantasma' });

        // Verificamos que no alteró a nuestro usuario 1
        expect(store.usuarios[0].nombre).toBe('Viejo');
    });

    it('Debe manejar el error genérico al actualizar usuario (Error sin response)', async () => {
        // Simulamos un error genérico (sin response.data.error) para probar el '||'
        const errorGenerico = new Error('Error de red');
        vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockRejectedValue(errorGenerico);

        await expect(store.actualizarUsuario(1, {})).rejects.toThrow('Error de red');
        expect(store.error).toBe('Error al actualizar el usuario');
    });

    it('Debe leer el error específico del backend al actualizar usuario (Lado izquierdo del ||)', async () => {
        // Simulamos un error estructurado como si viniera de Axios
        const errorBackend = { response: { data: { error: 'El correo ya está en uso por otro usuario' } } };
        vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockRejectedValue(errorBackend);

        await expect(store.actualizarUsuario(1, {})).rejects.toEqual(errorBackend);
        // Validamos que capturó el mensaje exacto del backend
        expect(store.error).toBe('El correo ya está en uso por otro usuario');
    });

    it('Debe limpiar el estado de carga al fallar la actualización (Backend Error)', async () => {
    const errorBackend = { response: { data: { error: 'Error en update' } } };
    vi.spyOn(UsuarioService, 'actualizarUsuarioAdmin').mockRejectedValue(errorBackend);

    try {
        await store.actualizarUsuario(1, {});
    } catch (e) { /* error esperado */ }

    expect(store.cargando).toBe(false); // Cubre línea 85
    expect(store.error).toBe('Error en update'); // Cubre lado izquierdo línea 83
});

    // --- ACTIONS: eliminarUsuario ---
    it('Debe eliminar un usuario de la lista (Éxito)', async () => {
        store.usuarios = [{ id: 1 }, { id: 2 }];
        vi.spyOn(UsuarioService, 'eliminarUsuario').mockResolvedValue({});

        await store.eliminarUsuario(1);

        expect(store.usuarios.length).toBe(1);
        expect(store.usuarios[0].id).toBe(2);
    });

    it('Debe manejar errores genéricos al eliminar usuario (Error sin response)', async () => {
        vi.spyOn(UsuarioService, 'eliminarUsuario').mockRejectedValue(new Error('Fallo en DB'));

        await expect(store.eliminarUsuario(1)).rejects.toThrow('Fallo en DB');
        expect(store.error).toBe('Error al eliminar el usuario');
    });
    it('Debe usar el mensaje por defecto al eliminar usuario si el error es genérico (sin error.response)', async () => {
        const errorGenerico = new Error('CORS Error');
        vi.spyOn(UsuarioService, 'eliminarUsuario').mockRejectedValue(errorGenerico);

        await expect(store.eliminarUsuario(1)).rejects.toThrow('CORS Error');

        // Validamos el fallback
        expect(store.error).toBe('Error al eliminar el usuario');
        // Validamos el finally
        expect(store.cargando).toBe(false);
    });

    it('Debe leer el error específico del backend al eliminar usuario (Lado izquierdo del ||)', async () => {
        // Simulamos un error estructurado
        const errorBackend = { response: { data: { error: 'No puedes eliminar al administrador principal' } } };
        vi.spyOn(UsuarioService, 'eliminarUsuario').mockRejectedValue(errorBackend);

        await expect(store.eliminarUsuario(1)).rejects.toEqual(errorBackend);
        // Validamos que capturó el mensaje exacto del backend
        expect(store.error).toBe('No puedes eliminar al administrador principal');
    });

    it('Debe limpiar el estado de carga al fallar la eliminación (Backend Error)', async () => {
    const errorBackend = { response: { data: { error: 'Error en delete' } } };
    vi.spyOn(UsuarioService, 'eliminarUsuario').mockRejectedValue(errorBackend);

    try {
        await store.eliminarUsuario(1);
    } catch (e) { /* error esperado */ }

    expect(store.cargando).toBe(false); // Cubre línea 101
    expect(store.error).toBe('Error en delete'); // Cubre lado izquierdo línea 99
});

    // --- ACTIONS: obtenerUsuario ---
    it('Debe obtener la data de un usuario por ID (Éxito)', async () => {
        vi.spyOn(UsuarioService, 'obtenerUsuario').mockResolvedValue({ data: { id: 1, nombre: 'Ana' } });

        const resultado = await store.obtenerUsuario(1);
        expect(resultado.nombre).toBe('Ana');
        expect(store.cargando).toBe(false);
    });

    it('Debe manejar errores al obtener usuario (Error)', async () => {
        vi.spyOn(UsuarioService, 'obtenerUsuario').mockRejectedValue(new Error('No encontrado'));

        await expect(store.obtenerUsuario(99)).rejects.toThrow('No encontrado');
        expect(store.error).toBe('No se pudo obtener el usuario');
    });
    it('Debe limpiar el estado de carga en el finally incluso si obtenerUsuario falla', async () => {
        vi.spyOn(UsuarioService, 'obtenerUsuario').mockRejectedValue(new Error('No existe'));

        await expect(store.obtenerUsuario(99)).rejects.toThrow('No existe');

        expect(store.error).toBe('No se pudo obtener el usuario');
        // Esto asegura que la línea 116 quede en verde
        expect(store.cargando).toBe(false);
    });
});