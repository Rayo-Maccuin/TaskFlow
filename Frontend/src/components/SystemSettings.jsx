import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Database, Mail, Shield, Palette } from 'lucide-react';
import { systemService } from '../services/apiService';
import { Button, Card, Input, Textarea, Switch, Spinner, Badge } from './UI';

export const SystemSettings = () => {
  const [configuracion, setConfiguracion] = useState({
    nombreSistema: '',
    descripcionSistema: '',
    emailAdmin: '',
    notificacionesEmail: true,
    registroAbierto: false,
    temaPorDefecto: 'light',
    idiomaPorDefecto: 'es',
    zonaHoraria: 'America/Bogota',
    maxArchivoTamano: 10,
    tiposArchivosPermitidos: ['jpg', 'png', 'pdf', 'doc', 'txt'],
    backupAutomatico: true,
    frecuenciaBackup: 'daily',
    retencionLogs: 30,
    debugMode: false
  });

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Bridge pattern diagnostics state
  const [authStrategy, setAuthStrategy] = useState({
    actual: '',
    disponible: [],
    cargando: false,
    mensaje: ''
  });

  useEffect(() => {
    cargarConfiguracion();
    cargarAuthStrategy();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      const response = await systemService.obtenerConfiguracion();
      setConfiguracion(response.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setMensaje('Error al cargar la configuración');
    } finally {
      setCargando(false);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true);
      setMensaje('');
      await systemService.actualizarConfiguracion(configuracion);
      setMensaje('Configuración guardada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMensaje('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const probarConexionBD = async () => {
    try {
      setCargando(true);
      const response = await systemService.probarConexionBD();
      if (response.data.success) {
        setMensaje('Conexión a la base de datos exitosa');
      } else {
        setMensaje('Error en la conexión a la base de datos');
      }
    } catch (error) {
      setMensaje('Error al probar la conexión');
    } finally {
      setCargando(false);
    }
  };

  const probarConfiguracionEmail = async () => {
    try {
      setCargando(true);
      const response = await systemService.probarEmail();
      if (response.data.success) {
        setMensaje('Configuración de email correcta');
      } else {
        setMensaje('Error en la configuración de email');
      }
    } catch (error) {
      setMensaje('Error al probar la configuración de email');
    } finally {
      setCargando(false);
    }
  };

  const crearBackup = async () => {
    try {
      setCargando(true);
      await systemService.crearBackup();
      setMensaje('Backup creado exitosamente');
    } catch (error) {
      setMensaje('Error al crear el backup');
    } finally {
      setCargando(false);
    }
  };

  const limpiarCache = async () => {
    try {
      setCargando(true);
      await systemService.limpiarCache();
      setMensaje('Cache limpiado exitosamente');
    } catch (error) {
      setMensaje('Error al limpiar el cache');
    } finally {
      setCargando(false);
    }
  };

  // Bridge pattern diagnostic functions
  const cargarAuthStrategy = async () => {
    try {
      setAuthStrategy(prev => ({ ...prev, cargando: true, mensaje: '' }));
      const response = await systemService.obtenerAuthStrategy();
      setAuthStrategy({
        actual: response.data.data.implementacionActual,
        disponible: response.data.data.implementacionesDisponibles,
        cargando: false,
        mensaje: ''
      });
    } catch (error) {
      console.error('Error cargando estrategia de autenticación:', error);
      setAuthStrategy(prev => ({ ...prev, cargando: false, mensaje: 'Error al cargar' }));
    }
  };

  const cambiarAuthStrategy = async (tipo) => {
    try {
      setAuthStrategy(prev => ({ ...prev, cargando: true, mensaje: '' }));
      const response = await systemService.cambiarAuthStrategy(tipo);
      setAuthStrategy({
        actual: response.data.data.nuevaImplementacion,
        disponible: authStrategy.disponible,
        cargando: false,
        mensaje: response.data.message
      });
      setTimeout(() => {
        setAuthStrategy(prev => ({ ...prev, mensaje: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error cambiando estrategia de autenticación:', error);
      setAuthStrategy(prev => ({ ...prev, cargando: false, mensaje: 'Error al cambiar' }));
    }
  };

  // Bridge pattern diagnostic functions
  const cargarAuthStrategy = async () => {
    try {
      setAuthStrategy(prev => ({ ...prev, cargando: true, mensaje: '' }));
      const response = await systemService.obtenerAuthStrategy();
      setAuthStrategy({
        actual: response.data.data.implementacionActual,
        disponible: response.data.data.implementacionesDisponibles,
        cargando: false,
        mensaje: ''
      });
    } catch (error) {
      console.error('Error cargando estrategia de autenticación:', error);
      setAuthStrategy(prev => ({ ...prev, cargando: false, mensaje: 'Error al cargar' }));
    }
  };

  const cambiarAuthStrategy = async (tipo) => {
    try {
      setAuthStrategy(prev => ({ ...prev, cargando: true, mensaje: '' }));
      const response = await systemService.cambiarAuthStrategy(tipo);
      setAuthStrategy({
        actual: response.data.data.nuevaImplementacion,
        disponible: authStrategy.disponible,
        cargando: false,
        mensaje: response.data.message
      });
      setTimeout(() => {
        setAuthStrategy(prev => ({ ...prev, mensaje: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error cambiando estrategia de autenticación:', error);
      setAuthStrategy(prev => ({ ...prev, cargando: false, mensaje: 'Error al cambiar' }));
    }
  };

  const actualizarValor = (campo, valor) => {
    setConfiguracion(prev => ({ ...prev, [campo]: valor }));
  };

  if (cargando && !configuracion.nombreSistema) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="text-gray-600 dark:text-gray-400">Administra la configuración general de la aplicación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cargarConfiguracion} disabled={cargando}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
          <Button onClick={guardarConfiguracion} disabled={guardando}>
            {guardando ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`p-4 rounded-lg ${mensaje.includes('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración General */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Configuración General</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Sistema
              </label>
              <Input
                value={configuracion.nombreSistema}
                onChange={(e) => actualizarValor('nombreSistema', e.target.value)}
                placeholder="TaskFlow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción del Sistema
              </label>
              <Textarea
                value={configuracion.descripcionSistema}
                onChange={(e) => actualizarValor('descripcionSistema', e.target.value)}
                placeholder="Sistema de gestión de tareas y proyectos"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email del Administrador
              </label>
              <Input
                type="email"
                value={configuracion.emailAdmin}
                onChange={(e) => actualizarValor('emailAdmin', e.target.value)}
                placeholder="admin@taskflow.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registro Abierto
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permitir que nuevos usuarios se registren
                </p>
              </div>
              <Switch
                checked={configuracion.registroAbierto}
                onChange={(checked) => actualizarValor('registroAbierto', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo Debug
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Habilitar logs detallados para desarrollo
                </p>
              </div>
              <Switch
                checked={configuracion.debugMode}
                onChange={(checked) => actualizarValor('debugMode', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Apariencia */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Apariencia</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tema por Defecto
              </label>
              <select
                value={configuracion.temaPorDefecto}
                onChange={(e) => actualizarValor('temaPorDefecto', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Idioma por Defecto
              </label>
              <select
                value={configuracion.idiomaPorDefecto}
                onChange={(e) => actualizarValor('idiomaPorDefecto', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zona Horaria
              </label>
              <select
                value={configuracion.zonaHoraria}
                onChange={(e) => actualizarValor('zonaHoraria', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="America/Bogota">Bogotá (GMT-5)</option>
                <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                <option value="America/Santiago">Santiago (GMT-4)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
                <option value="Europe/London">Londres (GMT+0)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Archivos */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Archivos y Almacenamiento</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tamaño Máximo de Archivo (MB)
              </label>
              <Input
                type="number"
                value={configuracion.maxArchivoTamano}
                onChange={(e) => actualizarValor('maxArchivoTamano', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipos de Archivo Permitidos
              </label>
              <div className="flex flex-wrap gap-2">
                {['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'csv', 'zip'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={configuracion.tiposArchivosPermitidos.includes(tipo)}
                      onChange={(e) => {
                        const nuevosTipos = e.target.checked
                          ? [...configuracion.tiposArchivosPermitidos, tipo]
                          : configuracion.tiposArchivosPermitidos.filter(t => t !== tipo);
                        actualizarValor('tiposArchivosPermitidos', nuevosTipos);
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm uppercase">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Backup Automático
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Crear copias de seguridad automáticamente
                </p>
              </div>
              <Switch
                checked={configuracion.backupAutomatico}
                onChange={(checked) => actualizarValor('backupAutomatico', checked)}
              />
            </div>

            {configuracion.backupAutomatico && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frecuencia de Backup
                </label>
                <select
                  value={configuracion.frecuenciaBackup}
                  onChange={(e) => actualizarValor('frecuenciaBackup', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Notificaciones y Email */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Notificaciones</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificaciones por Email
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enviar notificaciones por correo electrónico
                </p>
              </div>
              <Switch
                checked={configuracion.notificacionesEmail}
                onChange={(checked) => actualizarValor('notificacionesEmail', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Retención de Logs (días)
              </label>
              <Input
                type="number"
                value={configuracion.retencionLogs}
                onChange={(e) => actualizarValor('retencionLogs', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-3">Pruebas del Sistema</h4>
              <div className="space-y-2">
                <Button variant="outline" onClick={probarConexionBD} disabled={cargando} className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Probar Conexión BD
                </Button>
                <Button variant="outline" onClick={probarConfiguracionEmail} disabled={cargando} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Probar Email
                </Button>
                <Button variant="outline" onClick={crearBackup} disabled={cargando} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Crear Backup
                </Button>
                <Button variant="outline" onClick={limpiarCache} disabled={cargando} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpiar Cache
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bridge Pattern Diagnostics */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Patrón Bridge - Autenticación</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium">Implementación Actual</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estrategia de autenticación en uso
                </p>
              </div>
              <Badge variant={authStrategy.actual?.includes('JWT') ? 'success' : 'info'}>
                {authStrategy.cargando ? <Spinner size="sm" /> : (authStrategy.actual || 'Cargando...')}
              </Badge>
            </div>

            {authStrategy.mensaje && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
                {authStrategy.mensaje}
              </div>
            )}

            {authStrategy.actual !== 'JWTAuthImplementation' && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-sm">
                ⚠️ Implementación no-JWT activa. La autenticación de la interfaz podría fallar hasta reiniciar sesión.
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Cambiar Implementación (Demo)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Cambia la estrategia de autenticación en tiempo real sin reiniciar el servidor
              </p>
              <div className="flex gap-2">
                <Button
                  variant={authStrategy.actual === 'JWTAuthImplementation' ? 'primary' : 'outline'}
                  onClick={() => cambiarAuthStrategy('JWT')}
                  disabled={authStrategy.cargando || authStrategy.actual === 'JWTAuthImplementation'}
                  className="flex-1"
                >
                  JWT
                </Button>
                <Button
                  variant={authStrategy.actual === 'BasicAuthImplementation' ? 'primary' : 'outline'}
                  onClick={() => cambiarAuthStrategy('BASIC')}
                  disabled={authStrategy.cargando || authStrategy.actual === 'BasicAuthImplementation'}
                  className="flex-1"
                >
                  BASIC
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Los cambios aplican inmediatamente al middleware de autenticación
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};