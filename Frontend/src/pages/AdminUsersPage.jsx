import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminService } from '../services/apiService';
import { Button, Card, Spinner } from '../components/UI';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const AdminUsersPage = () => {
  const { usuario } = useAuth();
  const { tema } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [proyectos, setProyectos] = useState([]);

  const esAdmin = usuario?.rol === 'ADMIN';

  const cargarUsuarios = async () => {
    if (!esAdmin) return;
    try {
      setCargando(true);
      const response = await adminService.obtenerUsuarios();
      const lista = response.data?.data || response.data || [];
      const sinAdminActual = lista.filter((u) => u._id !== usuario?.id);
      const normalizada = sinAdminActual.map((u) => ({
        ...u,
        proyectosSoloLectura: Array.isArray(u.proyectosSoloLectura)
          ? u.proyectosSoloLectura.map((p) => (typeof p === 'string' ? p : p?._id || p).toString())
          : [],
      }));
      setUsuarios(normalizada);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const cargarProyectos = async () => {
    if (!esAdmin) return;
    try {
      // No hay endpoint específico de lista de proyectos para admin aún
      // Temporal: usar proyectos propios o dejar vacío
      setProyectos([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar proyectos');
    }
  };

  useEffect(() => {
    cargarUsuarios();
    cargarProyectos();
  }, [esAdmin]);

  const toggleProyectoSoloLectura = (userId, proyectoId) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u._id !== userId) return u;

        const actuales = new Set((u.proyectosSoloLectura || []).map((p) => p.toString()));
        if (actuales.has(proyectoId.toString())) {
          actuales.delete(proyectoId.toString());
        } else {
          actuales.add(proyectoId.toString());
        }

        return { ...u, proyectosSoloLectura: Array.from(actuales) };
      })
    );
  };

  const actualizarUsuarioLocal = (id, cambios) => {
    setUsuarios((prev) => prev.map((u) => (u._id === id ? { ...u, ...cambios } : u)));
  };

  const handleGuardarUsuario = async (userRow) => {
    setError('');
    setExito('');
    try {
      await adminService.editarUsuario(userRow._id, {
        rol: userRow.rol,
        soloLectura: !!userRow.soloLectura,
        proyectosSoloLectura: userRow.proyectosSoloLectura || [],
      });
      setExito(`Usuario ${userRow.nombre} actualizado correctamente`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleCambiarEstado = async (userRow) => {
    setError('');
    setExito('');
    try {
      if (userRow.activo) {
        await adminService.desactivarUsuario(userRow._id);
        setExito(`Usuario ${userRow.nombre} desactivado`);
      } else {
        await adminService.reactivarUsuario(userRow._id);
        setExito(`Usuario ${userRow.nombre} reactivado`);
      }
      await cargarUsuarios();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  };

  if (usuario && !esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: tema.bg.primary }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: tema.text.primary }}>
            Gestión De Usuarios
          </h1>
          <p style={{ color: tema.text.secondary }}>
            Panel exclusivo para ADMIN: roles, solo lectura y estado de acceso.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {exito && (
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-4">
            <CheckCircle size={20} />
            <span>{exito}</span>
          </div>
        )}

        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold" style={{ color: tema.text.primary }}>
              Usuarios
            </h2>
            <Button type="button" variant="outline" onClick={cargarUsuarios}>
              Refrescar
            </Button>
          </div>

          {cargando ? (
            <div className="py-4 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios.map((u) => (
                <div
                  key={u._id}
                  className="rounded-lg p-3"
                  style={{
                    border: '1px solid rgba(148, 163, 184, 0.45)',
                    backgroundColor: 'rgba(15, 23, 42, 0.15)',
                  }}
                >
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-base" style={{ color: tema.text.primary }}>{u.nombre}</p>
                      <p className="text-sm font-medium" style={{ color: tema.text.secondary }}>{u.email}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: tema.text.secondary }}>
                        Rol
                      </label>
                      <select
                        value={u.rol}
                        onChange={(e) => actualizarUsuarioLocal(u._id, { rol: e.target.value })}
                        className="tf-select text-slate-900 bg-white font-semibold"
                      >
                        <option value="DEVELOPER">DEVELOPER</option>
                        <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between border border-slate-400/60 rounded-md px-3 py-2">
                      <span className="text-sm font-semibold" style={{ color: tema.text.primary }}>Solo lectura</span>
                      <input
                        type="checkbox"
                        checked={!!u.soloLectura}
                        onChange={(e) => actualizarUsuarioLocal(u._id, { soloLectura: e.target.checked })}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="primary"
                      className="!text-white"
                      onClick={() => handleGuardarUsuario(u)}
                    >
                      Guardar cambios
                    </Button>
                  </div>

                    <div className="mt-3 border border-slate-400/50 rounded-md p-3">
                      <p className="text-sm font-semibold mb-2" style={{ color: tema.text.primary }}>
                        Proyectos en solo lectura
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {proyectos.length === 0 && (
                          <p className="text-sm" style={{ color: tema.text.secondary }}>
                            No hay proyectos disponibles
                          </p>
                        )}
                        {proyectos.map((p) => {
                          const checked = (u.proyectosSoloLectura || []).includes(p._id.toString());
                          return (
                            <label key={p._id} className="flex items-center justify-between gap-3">
                              <span className="text-sm" style={{ color: tema.text.primary }}>{p.nombre}</span>
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600"
                                checked={checked}
                                onChange={() => toggleProyectoSoloLectura(u._id, p._id)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                  {u._id !== usuario?.id && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant={u.activo ? 'danger' : 'secondary'}
                        className="!text-white"
                        onClick={() => handleCambiarEstado(u)}
                      >
                        {u.activo ? 'Desactivar acceso' : 'Reactivar acceso'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersPage;
