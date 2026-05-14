import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, notificationService, systemService } from '../services/apiService';
import { Button, Input, PasswordInput, Card, Spinner } from '../components/UI';
import { AlertCircle, CheckCircle, Moon, Sun } from 'lucide-react';
import Avvvatars from 'avvvatars-react';

export const ProfilePage = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const { tema, nombreTema, cambiarTema } = useTheme();

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion ||'');
  const [avatarNombre, setAvatarNombre] = useState(usuario?.email?.split('@')[0] || '');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [seccionPassword, setSeccionPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferenciasNotif, setPreferenciasNotif] = useState({
    asignacion: usuario?.preferenciasNotificacion?.asignacion ?? true,
    vencimiento: usuario?.preferenciasNotificacion?.vencimiento ?? true,
    comentarios: usuario?.preferenciasNotificacion?.comentarios ?? true,
    cambioEstado: usuario?.preferenciasNotificacion?.cambioEstado ?? true,
  });
  const [configSistema, setConfigSistema] = useState({
    nombreSistema: 'TaskFlow',
    limiteArchivoMB: 10,
    politicaPassword: {
      minLength: 6,
      requiereMayuscula: false,
      requiereNumero: false,
    },
  });
  const [cargandoConfigSistema, setCargandoConfigSistema] = useState(false);

  const esAdmin = usuario?.rol === 'ADMIN';

  useEffect(() => {
    const cargarConfigSistema = async () => {
      // Solo admins pueden cargar configuración global
      if (!esAdmin) return;
      
      setCargandoConfigSistema(true);
      try {
        const response = await systemService.obtenerConfiguracion();
        const data = response.data?.data;
        if (data) {
          setConfigSistema({
            nombreSistema: data.nombreSistema || 'TaskFlow',
            limiteArchivoMB: data.limiteArchivoMB ?? 10,
            politicaPassword: {
              minLength: data.politicaPassword?.minLength ?? 6,
              requiereMayuscula: !!data.politicaPassword?.requiereMayuscula,
              requiereNumero: !!data.politicaPassword?.requiereNumero,
            },
          });
        }
      } catch (err) {
        console.warn('No se pudo cargar configuración del sistema:', err.message);
        // No mostrar error al usuario si el endpoint no existe
      } finally {
        setCargandoConfigSistema(false);
      }
    };

    cargarConfigSistema();
  }, [esAdmin]);


  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    try {
      const response = await authService.actualizarPerfil({
        nombre,
        email,
        descripcion,
        avatar: avatarNombre,
      });

      actualizarUsuario(response.data.usuario);
      setExito('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (passwordNueva !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      await authService.cambiarPassword(passwordActual, passwordNueva, confirmPassword);
      setExito('Contraseña actualizada correctamente');
      setSeccionPassword(false);
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarPreferenciasNotif = async () => {
    setError('');
    setExito('');
    try {
      await notificationService.actualizarPreferencias(preferenciasNotif);
      actualizarUsuario({ preferenciasNotificacion: preferenciasNotif });
      setExito('Preferencias de notificación actualizadas');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar preferencias');
    }
  };

  const handleGuardarConfigSistema = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!esAdmin) {
      setError('Solo ADMIN puede modificar la configuración global del sistema');
      return;
    }

    try {
      setCargandoConfigSistema(true);
      const payload = {
        nombreSistema: configSistema.nombreSistema,
        limiteArchivoMB: Number(configSistema.limiteArchivoMB || 10),
        politicaPassword: {
          minLength: Number(configSistema.politicaPassword.minLength || 6),
          requiereMayuscula: !!configSistema.politicaPassword.requiereMayuscula,
          requiereNumero: !!configSistema.politicaPassword.requiereNumero,
        },
      };

      await systemService.actualizarConfiguracion(payload);
      setExito('Configuración global actualizada correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar configuración del sistema');
    } finally {
      setCargandoConfigSistema(false);
    }
  };


  return (
    <div className="min-h-screen" style={{ backgroundColor: tema.bg.primary }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: tema.text.primary }}>
              Mi Perfil
            </h1>
            <p style={{ color: tema.text.secondary }}>Gestiona tu información personal</p>
          </div>
          <button
            onClick={() => cambiarTema(nombreTema === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg"
            title={nombreTema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {nombreTema === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {/* Alertas */}
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

        {/* Información de Perfil */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: tema.text.primary }}>
            Información Personal
          </h2>

          {/* Avatar */}
          <div className="mb-8 flex items-center space-x-6">
            <div className="relative">
              <Avvvatars value={avatarNombre|| usuario?.email} size={100} />
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-50"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: tema.text.primary }}>Avatar Personalizado</p>
              <p style={{ color: tema.text.secondary }} className="text-xs mb-3">
                Ingresa tu nombre de usuario para generar un avatar único
              </p>
              <Input
                placeholder="Tu nombre de usuario"
                value={avatarNombre}
                onChange={(e) => setAvatarNombre(e.target.value)}
              />
            </div>
          </div>

          <form onSubmit={handleActualizarPerfil} className="space-y-4">
            <Input
              label="Nombre"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="mb-4">
              <label className="tf-label">Descripción</label>
              <textarea
                placeholder="Cuéntanos sobre ti..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="tf-textarea"
                rows="4"
              ></textarea>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </Card>

        {/* Cambio de Contraseña */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: tema.text.primary }}>
              Seguridad
            </h2>
            <Button
              onClick={() => setSeccionPassword(!seccionPassword)}
              variant="outline"
            >
              {seccionPassword ? 'Cancelar' : 'Cambiar Contraseña'}
            </Button>
          </div>

          {seccionPassword && (
            <form onSubmit={handleCambiarPassword} className="space-y-4">
              <PasswordInput
                label="Contraseña Actual"
                placeholder="••••••••"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
              />

              <PasswordInput
                label="Nueva Contraseña"
                placeholder="••••••••"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                required
              />

              <PasswordInput
                label="Confirmar Contraseña"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="w-full" disabled={cargando}>
                {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          )}
        </Card>

        {/* Información adicional */}
        <Card className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: tema.text.primary }}>
            Notificaciones
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Asignación de tareas</span>
              <input
                type="checkbox"
                checked={preferenciasNotif.asignacion}
                onChange={(e) => setPreferenciasNotif((p) => ({ ...p, asignacion: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Tareas vencidas</span>
              <input
                type="checkbox"
                checked={preferenciasNotif.vencimiento}
                onChange={(e) => setPreferenciasNotif((p) => ({ ...p, vencimiento: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Comentarios</span>
              <input
                type="checkbox"
                checked={preferenciasNotif.comentarios}
                onChange={(e) => setPreferenciasNotif((p) => ({ ...p, comentarios: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Cambio de estado</span>
              <input
                type="checkbox"
                checked={preferenciasNotif.cambioEstado}
                onChange={(e) => setPreferenciasNotif((p) => ({ ...p, cambioEstado: e.target.checked }))}
              />
            </label>
          </div>
          <Button className="w-full mt-4" onClick={handleGuardarPreferenciasNotif} variant="primary">
            Guardar preferencias
          </Button>
        </Card>

        <Card className="mt-8 bg-blue-50">
          <p style={{ color: tema.text.secondary }} className="mb-2">
            <strong>Email:</strong> {usuario?.email}
          </p>
          <p style={{ color: tema.text.secondary }} className="mb-2">
            <strong>Rol:</strong> {usuario?.rol}
          </p>
          <p style={{ color: tema.text.secondary }}>
            <strong>ID:</strong> {usuario?.id}
          </p>
          <p style={{ color: tema.text.secondary }}>
            <strong>Último acceso:</strong> {usuario?.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString('es-ES') : 'N/D'}
          </p>
        </Card>

        <Card className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold" style={{ color: tema.text.primary }}>
              Configuración Global Del Sistema
            </h2>
            <p className="text-sm mt-1" style={{ color: tema.text.secondary }}>
              {esAdmin
                ? 'Tienes permisos de ADMIN para editar esta configuración.'
                : 'Solo lectura: necesitas rol ADMIN para modificar esta configuración.'}
            </p>
          </div>

          {cargandoConfigSistema ? (
            <div className="py-4 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <form onSubmit={handleGuardarConfigSistema} className="space-y-4">
              <Input
                label="Nombre del sistema"
                value={configSistema.nombreSistema}
                onChange={(e) =>
                  setConfigSistema((prev) => ({ ...prev, nombreSistema: e.target.value }))
                }
                disabled={!esAdmin}
              />

              <Input
                label="Límite de archivo (MB)"
                type="number"
                min="1"
                value={configSistema.limiteArchivoMB}
                onChange={(e) =>
                  setConfigSistema((prev) => ({ ...prev, limiteArchivoMB: e.target.value }))
                }
                disabled={!esAdmin}
              />

              <Input
                label="Mínimo de caracteres para contraseña"
                type="number"
                min="6"
                value={configSistema.politicaPassword.minLength}
                onChange={(e) =>
                  setConfigSistema((prev) => ({
                    ...prev,
                    politicaPassword: {
                      ...prev.politicaPassword,
                      minLength: e.target.value,
                    },
                  }))
                }
                disabled={!esAdmin}
              />

              <label className="flex items-center justify-between">
                <span>Requerir mayúscula en contraseña</span>
                <input
                  type="checkbox"
                  checked={!!configSistema.politicaPassword.requiereMayuscula}
                  onChange={(e) =>
                    setConfigSistema((prev) => ({
                      ...prev,
                      politicaPassword: {
                        ...prev.politicaPassword,
                        requiereMayuscula: e.target.checked,
                      },
                    }))
                  }
                  disabled={!esAdmin}
                />
              </label>

              <label className="flex items-center justify-between">
                <span>Requerir número en contraseña</span>
                <input
                  type="checkbox"
                  checked={!!configSistema.politicaPassword.requiereNumero}
                  onChange={(e) =>
                    setConfigSistema((prev) => ({
                      ...prev,
                      politicaPassword: {
                        ...prev.politicaPassword,
                        requiereNumero: e.target.checked,
                      },
                    }))
                  }
                  disabled={!esAdmin}
                />
              </label>

              {esAdmin && (
                <Button type="submit" variant="primary" className="w-full" disabled={cargandoConfigSistema}>
                  {cargandoConfigSistema ? 'Guardando configuración...' : 'Guardar configuración global'}
                </Button>
              )}
            </form>
          )}
        </Card>

      </div>
    </div>
  );
};

export default ProfilePage;
