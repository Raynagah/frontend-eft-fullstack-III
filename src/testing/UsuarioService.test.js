import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UsuarioService from '../services/usuarioService';
import api from '../api/axiosConfig';

describe('UsuarioService', () => {
  beforeEach(() => {
    // Preparamos nuestros espías para todos los verbos HTTP usados
    vi.spyOn(api, 'get').mockResolvedValue({ data: 'mock-get' });
    vi.spyOn(api, 'post').mockResolvedValue({ data: 'mock-post' });
    vi.spyOn(api, 'put').mockResolvedValue({ data: 'mock-put' });
    vi.spyOn(api, 'delete').mockResolvedValue({ data: 'mock-delete' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Debe listar los usuarios llamando al endpoint de admin (GET)', async () => {
    const response = await UsuarioService.listarUsuarios();
    expect(api.get).toHaveBeenCalledWith('/web/admin/usuarios/admin/listar');
    expect(response.data).toBe('mock-get');
  });

  it('Debe obtener un usuario específico por ID (GET)', async () => {
    const idUsuario = 45;
    const response = await UsuarioService.obtenerUsuario(idUsuario);
    expect(api.get).toHaveBeenCalledWith(`/web/usuarios/${idUsuario}`);
    expect(response.data).toBe('mock-get');
  });

  it('Debe crear un usuario nuevo enviando los datos (POST)', async () => {
    const mockData = { nombre: 'Juan', rol: 'admin' };
    const response = await UsuarioService.crearUsuarioAdmin(mockData);
    
    expect(api.post).toHaveBeenCalledWith('/web/admin/usuarios', mockData);
    expect(response.data).toBe('mock-post');
  });

  it('Debe actualizar un usuario enviando su ID y datos (PUT)', async () => {
    const idUsuario = 88;
    const mockData = { rol: 'cliente' };
    const response = await UsuarioService.actualizarUsuarioAdmin(idUsuario, mockData);
    
    expect(api.put).toHaveBeenCalledWith(`/web/admin/usuarios/${idUsuario}`, mockData);
    expect(response.data).toBe('mock-put');
  });

  it('Debe eliminar un usuario por su ID (DELETE)', async () => {
    const idUsuario = 99;
    const response = await UsuarioService.eliminarUsuario(idUsuario);
    
    expect(api.delete).toHaveBeenCalledWith(`/web/admin/usuarios/${idUsuario}`);
    expect(response.data).toBe('mock-delete');
  });
});