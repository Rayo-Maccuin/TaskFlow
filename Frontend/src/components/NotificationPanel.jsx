import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Settings, Check, CheckCheck, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { notificationService } from '../services/apiService';
import { Button, Card, Badge, Spinner } from './UI';

export const NotificationPanel = ({ isOpen, onClose }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [modalPreferenciasAbierto, setModalPreferenciasAbierto] = useState(false);
  const [conexionSSE, setConexionSSE] = useState(false); // true = SSE, false = polling
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Calcular distribución de canales
  const distribucionCanales = useMemo(() => {
    if (!Array.isArray(notificaciones)) return {};
    return notificaciones.reduce((acc, notif) => {
      const canales = notif.canales && notif.canales.length > 0 ? notif.canales : ['DATABASE'];
      canales.forEach(canal => {
        acc[canal] = (acc[canal] || 0) + 1;
      });
      return acc;
    }, {});
  }, [notificaciones]);

  // Función de polling para obtener notificaciones
  const hacerPolling = async () => {
    try {
      const response = await notificationService.obtenerNotificaciones(1);
      const notifs = response.data.data || [];
      setNotificaciones(prev => {
        // Fusionar sin duplicados por ID
        const map = new Map();
        notifs.forEach(n => map.set(n.id, n));
        prev.forEach(n => map.set(n.id, n)); // Mantener las que ya estaban
        return Array.from(map.values()).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
      const noLeidas = notifs.filter(n => !n.leida).length;
      setTotalNoLeidas(noLeidas);
    } catch (error) {
      console.error('Error en polling:', error);
    }
  };

  // Iniciar polling como fallback
  const iniciarPolling = () => {
    if (pollingIntervalRef.current) return;
    console.log('[NotificationPanel] Iniciando polling (cada 3s)');
    setConexionSSE(false);
    // Primera consulta inmediata
    hacerPolling();
    // Luego cada 3 segundos
    pollingIntervalRef.current = setInterval(hacerPolling, 3000);
  };

  // Detener polling
  const detenerPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const conectarSSE = () => {
    if (eventSourceRef.current) return;

    const token = localStorage.getItem('token');
    const url = token 
      ? `/api/notificaciones/stream?token=${token}`
      : '/api/notificaciones/stream';
    
    console.log('[SSE] Conectando a:', url);
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      console.log('[SSE] Conexión establecida');
      setConexionSSE(true);
      detenerPolling(); // Si SSE funciona, no necesitamos polling
    };

    eventSourceRef.current.onmessage = (event) => {
      console.log('[SSE] Mensaje recibido:', event.data);
      try {
        const nuevaNotificacion = JSON.parse(event.data);
        setNotificaciones(prev => {
          // Buscar si ya existe
          const idx = prev.findIndex(n => n.id === nuevaNotificacion.id);
          if (idx >= 0) {
            // Actualizar notificación existente (ej: canales actualizados)
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...nuevaNotificacion };
            return updated;
          } else {
            // Nueva notificación
            return [nuevaNotificacion, ...prev];
          }
        });
        // Incrementar contador solo si es nueva y no leída
        if (!nuevaNotificacion.leida) {
          setTotalNoLeidas(prev => prev + 1);
        }
      } catch (e) {
        console.error('Error parseando mensaje SSE:', e);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('[SSE] Error, activando polling fallback:', error);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      iniciarPolling();
    };
  };

  const desconectarTodo = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    detenerPolling();
  };

  // Cargar notificaciones iniciales
  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const response = await notificationService.obtenerNotificaciones(pagina);
      const notifs = response.data.data || [];
      setNotificaciones(prev => {
        // Fusionar sin duplicados
        const map = new Map();
        notifs.forEach(n => map.set(n.id, n));
        prev.forEach(n => map.set(n.id, n));
        return Array.from(map.values()).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
      if (response.data.totalPaginas) {
        setTotalPaginas(response.data.totalPaginas);
      } else {
        setTotalPaginas(Math.ceil((response.data.total || notifs.length) / 20));
      }
      const noLeidas = (response.data.data || []).filter(n => !n.leida).length;
      setTotalNoLeidas(noLeidas);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await notificationService.marcarComoLeida(id);
      setNotificaciones(prev =>
        prev.map(notif => notif.id === id ? { ...notif, leida: true } : notif)
      );
      setTotalNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      setNotificaciones(prev => prev.map(notif => ({ ...notif, leida: true })));
      setTotalNoLeidas(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  // Efecto para conectar/desconectar
  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
      conectarSSE();
    } else {
      desconectarTodo();
    }

    return () => desconectarTodo();
  }, [isOpen, pagina]);

  // Iconos de canales
  const obtenerIconoCanal = (canal) => {
    switch (canal) {
      case 'EMAIL': return 'Email';
      case 'SLACK': return 'Slack';
      case 'SMS': return 'SMS';
      case 'WHATSAPP': return 'WhatsApp';
      case 'DATABASE': return 'DB';
      default: return 'Sys';
    }
  };

  const obtenerColorCanal = (canal) => {
    switch (canal) {
      case 'EMAIL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SLACK': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SMS': return 'bg-green-100 text-green-800 border-green-200';
      case 'WHATSAPP': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DATABASE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'ASIGNACION': return 'User';
      case 'VENCIMIENTO': return 'Clock';
      case 'COMENTARIO': return 'MessageSquare';
      case 'CAMBIO_ESTADO': return 'RefreshCw';
      default: return 'Bell';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-4 top-16 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold">Notificaciones</h3>
              {totalNoLeidas > 0 && (
                <Badge variant="primary" className="text-xs">
                  {totalNoLeidas}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalPreferenciasAbierto(true)}
                className="p-1"
              >
                <Settings className="w-4 h-4" />
              </Button>
              {totalNoLeidas > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={marcarTodasComoLeidas}
                  className="p-1"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Indicador de conexión */}
          <div className="flex items-center gap-2 text-xs">
            {conexionSSE ? (
              <span className="flex items-center gap-1 text-green-600">
                <Wifi className="w-3 h-3" /> SSE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <WifiOff className="w-3 h-3" /> Polling
              </span>
            )}
            <button 
              onClick={cargarNotificaciones}
              className="ml-auto text-blue-600 hover:text-blue-800 flex items-center gap-1"
              disabled={cargando}
            >
              <RefreshCw className={`w-3 h-3 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Estadísticas de canales - Patrón Adapter */}
          {Object.keys(distribucionCanales).length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs mt-2">
              <span className="text-gray-500 dark:text-gray-400">Canales:</span>
              {Object.entries(distribucionCanales).map(([canal, count]) => (
                <span 
                  key={canal}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${obtenerColorCanal(canal)}`}
                  title={`${canal}: ${count} notificaciones`}
                >
                  {obtenerIconoCanal(canal)} {canal} ({count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {cargando && notificaciones.length === 0 ? (
            <div className="p-4 text-center">
              <Spinner size="sm" />
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No hay notificaciones
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  !notif.leida ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => !notif.leida && marcarComoLeida(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span className="text-sm">{obtenerIconoTipo(notif.tipo)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`text-xs ${obtenerColorTipo(notif.tipo)}`}>
                        {notif.tipo}
                      </Badge>
                      {/* Indicador de canales usados - Patrón Adapter */}
                      {notif.canales && notif.canales.length > 0 && (
                        <div className="flex gap-1">
                          {notif.canales.map((canal, idx) => (
                            <span 
                              key={idx}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${obtenerColorCanal(canal)}`}
                              title={`Enviado por ${canal}`}
                            >
                              {obtenerIconoCanal(canal)}
                            </span>
                          ))}
                        </div>
                      )}
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {notif.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {notif.mensaje}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leyenda de canales - Patrón Adapter */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
            Patrón Adapter - Canales de notificación:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span>DB</span> <span>Database (SSE)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              <span>Email</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <span>WhatsApp</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
              <span>SMS</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Los badges en cada notificación indican los canales usados.
          </p>
        </div>

        {/* Modal de preferencias */}
        <NotificationPreferencesModal
          isOpen={modalPreferenciasAbierto}
          onClose={() => setModalPreferenciasAbierto(false)}
        />
      </>
    );
  };
};

const NotificationPreferencesModal = ({ isOpen, onClose }) => {
  // ... (mantener el código existente del modal de preferencias)
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Preferencias de Notificación</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium mb-3">Tipos de Notificación</h4>
              <div className="space-y-2">
                {[
                  { key: 'asignacionTarea', label: 'Asignación de tareas' },
                  { key: 'vencimientoTarea', label: 'Vencimiento de tareas' },
                  { key: 'comentarioTarea', label: 'Comentarios en tareas' },
                  { key: 'cambioEstadoTarea', label: 'Cambios de estado' },
                  { key: 'invitacionProyecto', label: 'Invitaciones a proyectos' },
                  { key: 'cambioProyecto', label: 'Cambios en proyectos' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferencias[key]}
                      onChange={(e) => setPreferencias(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Canales de Notificación</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencias.canalInApp}
                    onChange={(e) => setPreferencias(prev => ({
                      ...prev,
                      canalInApp: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm">Notificaciones en la aplicación</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencias.canalEmail}
                    onChange={(e) => setPreferencias(prev => ({
                      ...prev,
                      canalEmail: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm">Notificaciones por email</span>
                </label>
              </div>
            </div>

            {preferencias.canalEmail && (
              <div>
                <h4 className="font-medium mb-3">Frecuencia de Email</h4>
                <select
                  value={preferencias.frecuenciaEmail}
                  onChange={(e) => setPreferencias(prev => ({
                    ...prev,
                    frecuenciaEmail: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="INMEDIATO">Inmediato</option>
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={guardarPreferencias} disabled={cargando} className="flex-1">
              {cargando ? <Spinner size="sm" /> : 'Guardar'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};