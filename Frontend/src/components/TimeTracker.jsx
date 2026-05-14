import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Calendar, BarChart3 } from 'lucide-react';
import { taskService } from '../services/apiService';
import { Button, Card, Input, Badge, Spinner } from './UI';

export const TimeTracker = ({ tareaId, onTiempoRegistrado }) => {
  const [sesionActiva, setSesionActiva] = useState(null);
  const [tiempoAcumulado, setTiempoAcumulado] = useState(0);
  const [intervalo, setIntervalo] = useState(null);
  const [registrosTiempo, setRegistrosTiempo] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    cargarRegistrosTiempo();
    cargarSesionActiva();

    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [tareaId]);

  const cargarSesionActiva = async () => {
    try {
      const response = await taskService.obtenerSesionActiva(tareaId);
      if (response.data) {
        setSesionActiva(response.data);
        iniciarContador(response.data.inicio);
      }
    } catch (error) {
      console.error('Error cargando sesión activa:', error);
    }
  };

  const cargarRegistrosTiempo = async () => {
    try {
      const response = await taskService.obtenerRegistrosTiempo(tareaId);
      setRegistrosTiempo(response.data);
    } catch (error) {
      console.error('Error cargando registros de tiempo:', error);
    }
  };

  const iniciarContador = (inicio) => {
    const inicioTime = new Date(inicio).getTime();
    const intervaloId = setInterval(() => {
      const ahora = Date.now();
      const transcurrido = Math.floor((ahora - inicioTime) / 1000);
      setTiempoAcumulado(transcurrido);
    }, 1000);
    setIntervalo(intervaloId);
  };

  const iniciarSesion = async () => {
    try {
      setCargando(true);
      const response = await taskService.iniciarSesionTiempo(tareaId);
      setSesionActiva(response.data);
      iniciarContador(response.data.inicio);
    } catch (error) {
      console.error('Error iniciando sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const pausarSesion = async () => {
    try {
      setCargando(true);
      await taskService.pausarSesionTiempo(tareaId);
      if (intervalo) {
        clearInterval(intervalo);
        setIntervalo(null);
      }
      setSesionActiva(null);
      setTiempoAcumulado(0);
      await cargarRegistrosTiempo();
      onTiempoRegistrado && onTiempoRegistrado();
    } catch (error) {
      console.error('Error pausando sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const detenerSesion = async () => {
    try {
      setCargando(true);
      await taskService.detenerSesionTiempo(tareaId);
      if (intervalo) {
        clearInterval(intervalo);
        setIntervalo(null);
      }
      setSesionActiva(null);
      setTiempoAcumulado(0);
      await cargarRegistrosTiempo();
      onTiempoRegistrado && onTiempoRegistrado();
    } catch (error) {
      console.error('Error deteniendo sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const calcularTiempoTotal = () => {
    const tiempoSesion = sesionActiva ? tiempoAcumulado : 0;
    const tiempoRegistrado = registrosTiempo.reduce((total, registro) => total + registro.duracion, 0);
    return tiempoSesion + tiempoRegistrado;
  };

  const calcularEstadisticas = () => {
    if (registrosTiempo.length === 0) return null;

    const totalHoras = registrosTiempo.reduce((total, registro) => total + registro.duracion, 0) / 3600;
    const sesiones = registrosTiempo.length;
    const promedioPorSesion = totalHoras / sesiones;
    const ultimaSesion = registrosTiempo[registrosTiempo.length - 1];

    return {
      totalHoras: totalHoras.toFixed(2),
      sesiones,
      promedioPorSesion: promedioPorSesion.toFixed(2),
      ultimaSesion: ultimaSesion.fecha
    };
  };

  const estadisticas = calcularEstadisticas();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Tracker
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
        >
          <BarChart3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Contador principal */}
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold mb-2">
          {formatearTiempo(calcularTiempoTotal())}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Tiempo total en esta tarea
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-center gap-3 mb-6">
        {!sesionActiva ? (
          <Button
            onClick={iniciarSesion}
            disabled={cargando}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {cargando ? <Spinner size="sm" /> : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={pausarSesion}
              disabled={cargando}
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              {cargando ? <Spinner size="sm" /> : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
            <Button
              onClick={detenerSesion}
              disabled={cargando}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              {cargando ? <Spinner size="sm" /> : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Detener
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Estado actual */}
      {sesionActiva && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Sesión activa</span>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            Iniciada: {new Date(sesionActiva.inicio).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {estadisticas.totalHoras}h
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total registrado
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {estadisticas.sesiones}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Sesiones
            </div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {estadisticas.promedioPorSesion}h promedio
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              por sesión
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {mostrarHistorial && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-3">Historial de sesiones</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {registrosTiempo.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay registros de tiempo
              </p>
            ) : (
              registrosTiempo.map((registro, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm">
                      {new Date(registro.fecha).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {formatearTiempo(registro.duracion)}
                    </Badge>
                  </div>
                  {registro.comentario && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 max-w-32 truncate">
                      {registro.comentario}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};