import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit3, Trash2, Shield, ShieldCheck, Search, Filter } from 'lucide-react';
import { adminService } from '../services/apiService';
import { Button, Card, Input, Select, Badge, Spinner, Modal } from './UI';

export const AdminPanel = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    administradores: 0,
    proyectosActivos: 0
  });

  // Formulario de usuario
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    rol: 'USER',
    activo: true
  });

  useEffect(() => {
    cargarUsuarios();
    cargarEstadisticas();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await adminService.obtenerUsuarios();
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await adminService.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const guardarUsuario = async () => {
    try {
      setCargando(true);
      if (usuarioEditando) {
        await adminService.actualizarUsuario(usuarioEditando.id, formUsuario);
      } else {
        await adminService.crearUsuario(formUsuario);
      }

      setModalUsuarioAbierto(false);
      setUsuarioEditando(null);
      resetFormUsuario();
      await cargarUsuarios();
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error guardando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuario = async (usuarioId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      setCargando(true);
      await adminService.eliminarUsuario(usuarioId);
      await cargarUsuarios();
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const toggleEstadoUsuario = async (usuarioId, activo) => {
    try {
      if (activo) {
        await adminService.actualizarUsuario(usuarioId, { activo: false });
      } else {
        await adminService.actualizarUsuario(usuarioId, { activo: true });
      }
      await cargarUsuarios();
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error cambiando estado del usuario:', error);
    }
  };

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    resetFormUsuario();
    setModalUsuarioAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setModalUsuarioAbierto(true);
  };

  const resetFormUsuario = () => {
    setFormUsuario({
      nombre: '',
      email: '',
      rol: 'USER',
      activo: true
    });
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideBusqueda = usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = !filtroRol || usuario.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  const obtenerColorRol = (rol) => {
    switch (rol) {
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'MODERATOR': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const obtenerIconoRol = (rol) => {
    switch (rol) {
      case 'ADMIN': return <ShieldCheck className="w-4 h-4" />;
      case 'MODERATOR': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestiona usuarios y configura el sistema</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{estadisticas.totalUsuarios}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="text-2xl font-bold">{estadisticas.usuariosActivos}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{estadisticas.administradores}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Administradores</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              📊
            </div>
            <div>
              <div className="text-2xl font-bold">{estadisticas.proyectosActivos}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Proyectos Activos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filtroRol}
            onChange={(value) => setFiltroRol(value)}
            className="md:w-48"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administradores</option>
            <option value="MODERATOR">Moderadores</option>
            <option value="USER">Usuarios</option>
          </Select>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Usuarios ({usuariosFiltrados.length})</h3>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-2">
            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{usuario.nombre}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{usuario.email}</div>
                  </div>
                  <Badge className={obtenerColorRol(usuario.rol)}>
                    <div className="flex items-center gap-1">
                      {obtenerIconoRol(usuario.rol)}
                      {usuario.rol}
                    </div>
                  </Badge>
                  <Badge variant={usuario.activo ? 'success' : 'secondary'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEstadoUsuario(usuario.id, !usuario.activo)}
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirModalEditar(usuario)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarUsuario(usuario.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {usuariosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron usuarios</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal de usuario */}
      <Modal
        isOpen={modalUsuarioAbierto}
        onClose={() => setModalUsuarioAbierto(false)}
        title={usuarioEditando ? 'Editar Usuario' : 'Crear Usuario'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <Input
              value={formUsuario.nombre}
              onChange={(e) => setFormUsuario(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formUsuario.email}
              onChange={(e) => setFormUsuario(prev => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <Select
              value={formUsuario.rol}
              onChange={(value) => setFormUsuario(prev => ({ ...prev, rol: value }))}
            >
              <option value="USER">Usuario</option>
              <option value="MODERATOR">Moderador</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formUsuario.activo}
              onChange={(e) => setFormUsuario(prev => ({ ...prev, activo: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="activo" className="text-sm">
              Usuario activo
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalUsuarioAbierto(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={guardarUsuario} disabled={cargando} className="flex-1">
            {cargando ? <Spinner size="sm" /> : (usuarioEditando ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};