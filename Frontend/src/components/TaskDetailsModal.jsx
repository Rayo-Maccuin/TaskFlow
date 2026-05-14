import React, { useState, useEffect } from 'react';
import {
  X, Clock, Paperclip, MessageSquare, Plus, CheckCircle2,
  Circle, Calendar, User, Tag, AlertTriangle, Play, Pause,
  Save, Edit3, Trash2, Download, Eye, Copy
} from 'lucide-react';
import { taskService, fileService, authService } from '../services/apiService';
import { Button, Card, Input, Textarea, Badge, Spinner, Modal } from './UI';

export const TaskDetailsModal = ({ tarea, isOpen, onClose, onTareaActualizada }) => {
  const [detallesTarea, setDetallesTarea] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoComentario, setEditandoComentario] = useState(null);

  // Debug: logs cuando detallesTarea cambia
  useEffect(() => {
    console.log('[TaskDetailsModal] detallesTarea actualizado:', detallesTarea);
    if (detallesTarea) {
      console.log('[TaskDetailsModal] registrosTiempo:', detallesTarea.registrosTiempo);
      console.log('[TaskDetailsModal] tiempo total:', detallesTarea.registrosTiempo?.reduce((sum, r) => sum + Number(r.horas || 0), 0));
    }
  }, [detallesTarea]);

  // Estados para edición
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIA');
  const [tipo, setTipo] = useState('TASK');
  const [fechaLimite, setFechaLimite] = useState('');
  const [estimacionHoras, setEstimacionHoras] = useState(0);
  const [etiquetas, setEtiquetas] = useState([]);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [responsables, setResponsables] = useState([]);
  const [proyectoId, setProyectoId] = useState(null);
  const [columnaId, setColumnaId] = useState(null);

  // Estados para nueva funcionalidad
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [tiempoRegistrado, setTiempoRegistrado] = useState({ horas: 0, comentario: '' });
  const [errorTiempo, setErrorTiempo] = useState('');
  const [subtareaNueva, setSubtareaNueva] = useState({ titulo: '', completada: false });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [tiempoTracker, setTiempoTracker] = useState({ activo: false, inicio: null, tiempoAcumulado: 0 });
  // Estado para agregar responsables
  const [usuarioBuscado, setUsuarioBuscado] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    if (isOpen && tarea) {
      cargarDetallesTarea();
    }
  }, [isOpen, tarea]);

   // ============================================
   // FUNCIONES DEL MODAL - Scope correcto
   // ============================================

  const cargarDetallesTarea = async () => {
    console.log('cargarDetallesTarea - Iniciando para tarea', tarea.id);
    try {
      setCargando(true);
      const response = await taskService.obtenerTarea(tarea.id);
      console.log('Respuesta GET obtenerTarea:', response);
      
      const tareaData = response.data?.data || response.data;
      console.log('TareaData extraída:', tareaData);
      
      if (!tareaData) {
        console.error('No se recibieron datos de la tarea');
        return;
      }
      
      setDetallesTarea(tareaData);
      setTitulo(tareaData.titulo || '');
      setDescripcion(tareaData.descripcion || '');
      setPrioridad(tareaData.prioridad || 'MEDIA');
      setTipo(tareaData.tipo || 'TASK');
      setFechaLimite(tareaData.fechaLimite ? tareaData.fechaLimite.split('T')[0] : '');
      setEstimacionHoras(tareaData.estimacionHoras || 0);
      setEtiquetas(Array.isArray(tareaData.etiquetas) ? tareaData.etiquetas : []);
      setResponsables(Array.isArray(tareaData.responsables) ? tareaData.responsables : []);
      setProyectoId(tareaData.proyectoId || null);
      setColumnaId(tareaData.columnaId || null);
      
      console.log('Estados de edición inicializados. registrosTiempo:', tareaData.registrosTiempo);
    } catch (error) {
      console.error('Error cargando detalles de tarea:', error);
    } finally {
      setCargando(false);
    }
  };

  const guardarCambios = async () => {
    try {
      setCargando(true);
      const responsablesIds = responsables.map(r => r.id || r);
      const response = await taskService.actualizarTarea(tarea.id, {
        titulo,
        descripcion,
        prioridad,
        tipo,
        fechaLimite: fechaLimite || null,
        estimacionHoras: parseFloat(estimacionHoras) || 0,
        etiquetas,
        responsables: responsablesIds,
        subtareas: detallesTarea.subtareas || []
      });

      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }

      setModoEdicion(false);
      onTareaActualizada && onTareaActualizada();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    } finally {
      setCargando(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    if (!detallesTarea) return;
    setTitulo(detallesTarea.titulo || '');
    setDescripcion(detallesTarea.descripcion || '');
    setPrioridad(detallesTarea.prioridad || 'MEDIA');
    setTipo(detallesTarea.tipo || 'TASK');
    setFechaLimite(detallesTarea.fechaLimite ? detallesTarea.fechaLimite.split('T')[0] : '');
    setEstimacionHoras(detallesTarea.estimacionHoras || 0);
    setEtiquetas(detallesTarea.etiquetas || []);
    setResponsables(detallesTarea.responsables || []);
    setProyectoId(detallesTarea.proyectoId || null);
    setColumnaId(detallesTarea.columnaId || null);
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      const response = await taskService.agregarComentario(tarea.id, nuevoComentario);
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setNuevoComentario('');
    } catch (error) {
      console.error('Error agregando comentario:', error);
    }
  };

  const editarComentario = async (comentarioId, contenido) => {
    try {
      const response = await taskService.editarComentario(tarea.id, comentarioId, contenido);
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setEditandoComentario(null);
    } catch (error) {
      console.error('Error editando comentario:', error);
    }
  };

  const eliminarComentario = async (comentarioId) => {
    try {
      const response = await taskService.eliminarComentario(tarea.id, comentarioId);
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
    } catch (error) {
      console.error('Error eliminando comentario:', error);
    }
  };

  const registrarTiempo = async () => {
    const horas = parseFloat(tiempoRegistrado.horas);
    setErrorTiempo('');
    
    if (isNaN(horas) || horas <= 0) {
      setErrorTiempo('Debes ingresar un número de horas válido mayor a 0');
      return;
    }

    try {
      const response = await taskService.registrarTiempo(tarea.id, horas, tiempoRegistrado.comentario || '');
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setTiempoRegistrado({ horas: 0, comentario: '' });
    } catch (error) {
      console.error('Error registrando tiempo:', error.response?.data || error.message);
      setErrorTiempo(error.response?.data?.message || 'Error al registrar el tiempo');
    }
  };

  const agregarSubtarea = async () => {
    if (!subtareaNueva.titulo.trim()) return;

    try {
      const subtareasActuales = detallesTarea.subtareas || [];
      const nuevasSubtareas = [
        ...subtareasActuales,
        { id: Date.now().toString(), titulo: subtareaNueva.titulo, completada: false }
      ];
      const responsablesIds = responsables.map(r => r.id || r);
      const payload = {
        titulo,
        descripcion,
        prioridad,
        tipo,
        fechaLimite: fechaLimite || null,
        estimacionHoras: parseFloat(estimacionHoras) || 0,
        etiquetas,
        responsables: responsablesIds,
        subtareas: nuevasSubtareas
      };
      console.log('Payload actualizar (agregarSubtarea):', payload);
      const response = await taskService.actualizarTarea(tarea.id, payload);
      console.log('Respuesta:', response.data);
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setSubtareaNueva({ titulo: '', completada: false });
    } catch (error) {
      console.error('Error agregando subtarea:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        alert('Error: ' + (error.response.data.message || 'No se pudo agregar la subtarea'));
      } else {
        console.error('Error sin respuesta:', error.message);
      }
    }
  };

  const toggleSubtarea = async (subtareaId) => {
    try {
      const subtareasActuales = detallesTarea.subtareas || [];
      const nuevasSubtareas = subtareasActuales.map((s) =>
        s.id === subtareaId ? { ...s, completada: !s.completada } : s
      );
      const responsablesIds = responsables.map(r => r.id || r);
      const response = await taskService.actualizarTarea(tarea.id, {
        titulo,
        descripcion,
        prioridad,
        tipo,
        fechaLimite: fechaLimite || null,
        estimacionHoras: parseFloat(estimacionHoras) || 0,
        etiquetas,
        responsables: responsablesIds,
        subtareas: nuevasSubtareas
      });
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
    } catch (error) {
      console.error('Error actualizando subtarea:', error);
    }
  };

  const clonarTarea = async () => {
    try {
      await taskService.clonarTarea(tarea.id);
      onClose();
    } catch (error) {
      console.error('Error clonando tarea:', error);
    }
  };

  const obtenerIniciales = (valor) => {
    if (!valor) return 'US';
    return valor
      .split(' ')
      .map((parte) => parte[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const buscarUsuarios = async () => {
    if (!usuarioBuscado.trim()) {
      setUsuariosEncontrados([]);
      return;
    }

    try {
      const response = await authService.buscarUsuarios(usuarioBuscado);
      setUsuariosEncontrados(response.data);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      setUsuariosEncontrados([]);
    }
  };

  const agregarResponsableUsuario = async (idUsuario) => {
    try {
      const response = await taskService.asignarResponsable(tarea.id, idUsuario);
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setUsuarioBuscado('');
      setUsuariosEncontrados([]);
      setUsuarioSeleccionado(null);
    } catch (error) {
      console.error('Error agregando responsable:', error);
    }
  };

  const agregarEtiqueta = async () => {
    if (!nuevaEtiqueta.trim()) return;

    try {
      const nuevasEtiquetas = [...etiquetas, nuevaEtiqueta.trim()];
      const responsablesIds = responsables.map(r => r.id || r);
      const response = await taskService.actualizarTarea(tarea.id, {
        titulo,
        descripcion,
        prioridad,
        tipo,
        fechaLimite: fechaLimite || null,
        estimacionHoras: parseFloat(estimacionHoras) || 0,
        etiquetas: nuevasEtiquetas,
        responsables: responsablesIds,
        subtareas: detallesTarea.subtareas || []
      });
      if (response.data.success && response.data.data) {
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setNuevaEtiqueta('');
    } catch (error) {
      console.error('Error agregando etiqueta:', error);
    }
  };

  const adjuntarArchivo = async () => {
    if (!archivoSeleccionado) return;

    try {
      console.log('[TaskDetailsModal] Adjuntando archivo:', archivoSeleccionado.name, 'tarea:', tarea.id);
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      const response = await fileService.subirArchivo(tarea.id, formData);
      console.log('[TaskDetailsModal] Respuesta subir archivo:', response.data);
      if (response.data.success && response.data.data) {
        console.log('[TaskDetailsModal] Tarea actualizada con adjuntos:', response.data.data.adjuntos);
        setDetallesTarea(response.data.data);
        const data = response.data.data;
        setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
        setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
      }
      setArchivoSeleccionado(null);
    } catch (error) {
      console.error('[TaskDetailsModal] Error adjuntando archivo:', error.response?.data || error.message);
      let msg = 'Error al subir archivo';
      if (error.response) {
        if (error.response.status === 413) {
          msg = 'Archivo demasiado grande (máximo 10MB)';
        } else if (error.response.data?.message) {
          msg = error.response.data.message;
        }
      } else if (error.message) {
        msg = error.message;
      }
      alert(msg);
    }
  };

    if (!isOpen || !tarea) return null;

   if (cargando || !detallesTarea) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.15)]">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-slate-600">Cargando detalles de la tarea...</p>
          </div>
        </div>
      </div>
    );
  }

  const subtareas = detallesTarea.subtareas || [];
  const comentarios = detallesTarea.comentarios || [];
  const archivos = detallesTarea.adjuntos || [];
  const responsablesLista = detallesTarea.responsables || [];
  const etiquetasLista = detallesTarea.etiquetas || [];
  const tiempoRegistradoTotal = detallesTarea.registrosTiempo?.reduce((total, item) => total + Number(item.horas || 0), 0) || 0;
  const subtareasCompletadas = subtareas.filter((item) => item.completada).length;
  const progresoSubtareas = subtareas.length > 0 ? Math.round((subtareasCompletadas / subtareas.length) * 100) : 0;
  const estaVencida = detallesTarea.fechaLimite && !detallesTarea.completada && new Date(detallesTarea.fechaLimite) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[1600px] h-[calc(100vh-64px)] overflow-hidden rounded-[28px] bg-[#F5F7F6] shadow-[0_30px_90px_rgba(15,23,42,0.15)] flex flex-col">
        {/* Header fijo */}
        <div className="flex items-center justify-between gap-4 border-b border-[#D7E3DD] bg-white px-8 py-5 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-[#DCEFE8] px-3 py-1 text-xs font-semibold text-[#032F2D]">
                {detallesTarea?.tipo || 'TAREA'}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  detallesTarea?.prioridad === 'URGENTE'
                    ? 'bg-[#FEE2E2] text-[#B91C1C]'
                    : detallesTarea?.prioridad === 'ALTA'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : detallesTarea?.prioridad === 'MEDIA'
                    ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                    : 'bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {detallesTarea?.prioridad || 'MEDIA'}
              </span>
              {estaVencida && (
                <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#B91C1C]">
                  Vencida
                </span>
              )}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#1F2937]">
              {detallesTarea?.titulo}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Columna #{detallesTarea?.columnaId || '-'}</span>
              <span>Proyecto #{detallesTarea?.proyectoId || '-'}</span>
              {detallesTarea?.id && <span>Tarea #{detallesTarea.id}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={clonarTarea}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Clonar
            </Button>
            {modoEdicion ? (
              <>
                <Button
                  variant="secondary"
                  onClick={guardarCambios}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelarEdicion}
                  className="flex items-center gap-2"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setModoEdicion(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 pb-16 min-h-0">
            <div className="grid gap-6">
              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Descripción</p>
                  <span className="text-sm text-slate-500">Última actualización {detallesTarea?.updatedAt ? new Date(detallesTarea.updatedAt).toLocaleDateString() : '-'}</span>
                </div>
                {modoEdicion ? (
                  <Textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe la tarea"
                    rows={6}
                  />
                ) : (
                  <p className="text-base leading-7 text-slate-700 whitespace-pre-wrap">
                    {detallesTarea.descripcion || 'No hay descripción disponible para esta tarea.'}
                  </p>
                )}
              </section>

              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Subtareas</p>
                    <p className="mt-1 text-sm text-slate-500">{subtareasCompletadas}/{subtareas.length} completadas</p>
                  </div>
                  <span className="text-sm font-semibold text-[#032F2D]">{progresoSubtareas}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#032F2D] transition-all duration-300" style={{ width: `${progresoSubtareas}%` }} />
                </div>

                <div className="mt-5 space-y-3">
                  {subtareas.length > 0 ? (
                    subtareas.map((subtarea, index) => (
                      <label
                        key={index}
                        className={`group flex items-center justify-between gap-4 rounded-[20px] border px-4 py-4 transition ${
                          subtarea.completada ? 'border-slate-200 bg-slate-50 opacity-80' : 'border-[#E5E7EB] bg-white hover:border-[#032F2D]/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={subtarea.completada}
                            onChange={() => toggleSubtarea(subtarea.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#032F2D] focus:ring-[#032F2D]"
                          />
                          <span className={`${subtarea.completada ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {subtarea.titulo}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay subtareas registradas.</p>
                  )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Nueva subtarea"
                    value={subtareaNueva.titulo}
                    onChange={(e) => setSubtareaNueva((prev) => ({ ...prev, titulo: e.target.value }))}
                  />
                  <Button onClick={agregarSubtarea} variant="secondary" className="whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Comentarios</p>
                    <p className="mt-1 text-sm text-slate-500">{comentarios.length} comentarios</p>
                  </div>
                </div>
                <div className="space-y-4 mb-4 max-h-[360px] overflow-y-auto pr-2">
                  {comentarios.length > 0 ? (
                    comentarios.map((comentario, index) => (
                      <div key={index} className="rounded-[24px] border border-[#E5E7EB] bg-[#F8FAFB] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">{comentario.autor || 'Usuario'}</span>
                          <span>{comentario.fecha ? new Date(comentario.fecha).toLocaleString() : '-'}</span>
                        </div>
                        {editandoComentario === index ? (
                          <div className="mt-3 space-y-3">
                            <Textarea
                              value={comentario.contenido}
                              onChange={(e) => {
                                const nuevosComentarios = [...detallesTarea.comentarios];
                                nuevosComentarios[index].contenido = e.target.value;
                                setDetallesTarea((prev) => ({ ...prev, comentarios: nuevosComentarios }));
                              }}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => editarComentario(comentario.id, comentario.contenido)}>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditandoComentario(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-slate-700">{comentario.contenido}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Aún no hay comentarios en esta tarea.</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Agregar un comentario"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={agregarComentario} variant="secondary">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comentar
                  </Button>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Archivos adjuntos</p>
                    <p className="mt-1 text-sm text-slate-500">{archivos.length} archivos</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {archivos.length > 0 ? (
                    archivos.map((archivo, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 rounded-[24px] border border-[#E5E7EB] bg-[#FBFCFD] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{archivo.nombre}</p>
                            <p className="text-xs text-slate-500">{archivo.tamano || archivo.size || '—'}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(archivo.url)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay archivos adjuntos.</p>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="file"
                    onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                    className="hidden"
                    id="archivo-input"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="archivo-input"
                    className="flex-1 rounded-2xl border border-[#D7E3DD] bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                  >
                    Seleccionar archivo
                  </label>
                  <Button
                    onClick={adjuntarArchivo}
                    variant="secondary"
                    disabled={!archivoSeleccionado}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                </div>
                {archivoSeleccionado && (
                  <p className="text-sm text-slate-500">Archivo seleccionado: {archivoSeleccionado.name}</p>
                )}
              </section>
            </div>
          </div>

          <aside className="hidden w-[360px] shrink-0 border-l border-[#D7E3DD] bg-[#F5F7F6] p-6 xl:block overflow-y-auto min-h-0">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 mb-4">Detalles</p>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex justify-between gap-4">
                    <span>Estado</span>
                    <span className="font-medium text-slate-800">{detallesTarea.completada ? 'Completada' : 'Pendiente'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Prioridad</span>
                    <span className="font-medium text-slate-800">{detallesTarea.prioridad}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tipo</span>
                    <span className="font-medium text-slate-800">{detallesTarea.tipo}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Vencimiento</span>
                    <span className="font-medium text-slate-800">{detallesTarea.fechaLimite ? new Date(detallesTarea.fechaLimite).toLocaleDateString() : 'No definido'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Estimación</span>
                    <span className="font-medium text-slate-800">{detallesTarea.estimacionHoras || 0}h</span>
                  </div>
                </div>
               </section>

               <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                 <div className="flex items-center justify-between gap-4 mb-4">
                   <div>
                     <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Etiquetas</p>
                     <p className="mt-1 text-sm text-slate-500">{etiquetas.length} etiquetas</p>
                   </div>
                 </div>
                 <div className="space-y-3 mb-4">
                   {etiquetas.length > 0 ? (
                     etiquetas.map((etiqueta, index) => (
                       <div key={index} className="flex items-center justify-between gap-3 rounded-[24px] border border-[#E5E7EB] bg-[#FBFCFD] px-4 py-3">
                         <div className="flex items-center gap-3">
                           <Tag className="w-4 h-4 text-slate-500" />
                           <div>
                             <p className="text-sm font-medium text-slate-700">{etiqueta}</p>
                           </div>
                         </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            const nuevasEtiquetas = [...etiquetas];
                            nuevasEtiquetas.splice(index, 1);
                            const responsablesIds = responsables.map(r => r.id || r);
                            taskService.actualizarTarea(tarea.id, {
                              titulo,
                              descripcion,
                              prioridad,
                              tipo,
                              fechaLimite: fechaLimite || null,
                              estimacionHoras: parseFloat(estimacionHoras) || 0,
                              etiquetas: nuevasEtiquetas,
                              responsables: responsablesIds,
                              subtareas: detallesTarea.subtareas || []
                            }).then(response => {
                              if (response.data.success && response.data.data) {
                                setDetallesTarea(response.data.data);
                                const data = response.data.data;
                                setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
                                setResponsables(Array.isArray(data.responsables) ? data.responsables : []);
                              }
                            }).catch(err => console.error('Error eliminando etiqueta:', err));
                          }}>
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm text-slate-500">No hay etiquetas.</p>
                   )}
                 </div>
                 <div className="flex flex-col gap-3 sm:flex-row">
                   <Input
                     placeholder="Nueva etiqueta"
                     value={nuevaEtiqueta}
                     onChange={(e) => setNuevaEtiqueta(e.target.value)}
                   />
                   <Button onClick={agregarEtiqueta} variant="secondary">
                     <Tag className="w-4 h-4 mr-2" />
                     Agregar
                   </Button>
                 </div>
               </section>

               <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                 <p className="text-sm uppercase tracking-[0.18em] text-slate-500 mb-4">Responsables</p>
                 <div className="flex flex-wrap gap-2">
                   {responsablesLista.length > 0 ? (
                     responsablesLista.map((responsable, index) => (
                       <div key={index} className="flex items-center gap-2 rounded-2xl bg-[#F5FBF8] px-3 py-2 text-sm text-slate-700">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFE8] text-xs font-semibold text-[#032F2D]">
                           {obtenerIniciales(responsable.nombre || responsable.email || 'US')}
                         </div>
                         <div>
                           <p>{responsable.nombre || responsable.email || 'Usuario'}</p>
                         </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm text-slate-500">Sin responsables asignados.</p>
                   )}
                 </div>
                   <div className="mt-4 flex gap-2">
                     <Input
                       placeholder="Buscar usuarios..."
                       value={usuarioBuscado}
                       onChange={(e) => {
                         setUsuarioBuscado(e.target.value);
                         buscarUsuarios();
                       }}
                       className="flex-1"
                     />
                     <Button variant="secondary" size="sm" onClick={() => usuarioSeleccionado && agregarResponsableUsuario(usuarioSeleccionado)} disabled={!usuarioSeleccionado}>
                       Agregar
                     </Button>
                   </div>
                  {usuariosEncontrados.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto border-t border-[#D7E3DD]">
                      <div className="px-4 py-2 text-sm font-medium text-slate-700">Seleccione un usuario</div>
                      {usuariosEncontrados.map((usuario, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                            usuarioSeleccionado === usuario.id ? 'bg-slate-100' : ''
                          }`}
                          onClick={() => setUsuarioSeleccionado(usuario.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFE8] text-xs font-semibold text-[#032F2D]">
                              {obtenerIniciales(usuario.nombre || usuario.email || 'US')}
                            </div>
                            <div>
                              <p className="font-medium">{usuario.nombre || usuario.email || 'Usuario'}</p>
                              <p className="text-xs text-slate-500">{usuario.email}</p>
                            </div>
                          </div>
                          <CheckCircle2 className={usuarioSeleccionado === usuario.id ? 'w-4 h-4 text-[#032F2D]' : 'hidden'} />
                        </div>
                      ))}
                    </div>
                  )}
               </section>

              <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 mb-4">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {etiquetasLista.length > 0 ? (
                    etiquetasLista.map((etiqueta, index) => (
                      <span key={index} className="rounded-full bg-[#032F2D] px-3 py-1 text-xs font-semibold text-white">
                        {etiqueta}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay etiquetas.</p>
                  )}
                </div>
              </section>

               <section className="rounded-[24px] border border-[#D7E3DD] bg-white p-6 shadow-sm">
                 <div className="flex items-center gap-3 mb-4 text-sm uppercase tracking-[0.18em] text-slate-500">
                   <Clock className="w-4 h-4" />
                   <span>Tiempo</span>
                 </div>
                 <div className="rounded-3xl bg-[#DCEFE8] p-4 text-slate-800 mb-4">
                   <p className="text-sm text-slate-500">Total registrado</p>
                   <p className="mt-2 text-2xl font-semibold">{tiempoRegistradoTotal.toFixed(1)}h</p>
                 </div>

                 {/* Formulario para registrar tiempo */}
                 <div className="mb-4 p-4 border border-[#D7E3DD] rounded-2xl bg-[#F8FAFB]">
                   <h4 className="text-sm font-medium text-slate-700 mb-3">Registrar nuevo tiempo</h4>
                   <div className="flex flex-col gap-3">
                     <div className="flex gap-2">
                       <Input
                         type="number"
                         placeholder="Horas"
                         min="0"
                         step="0.5"
                         value={tiempoRegistrado.horas || ''}
                         onChange={(e) => setTiempoRegistrado(prev => ({ 
                           ...prev, 
                           horas: e.target.value 
                         }))}
                         className="w-24"
                       />
                       <Input
                         placeholder="Descripción (opcional)"
                         value={tiempoRegistrado.comentario}
                         onChange={(e) => setTiempoRegistrado(prev => ({ 
                           ...prev, 
                           comentario: e.target.value 
                         }))}
                         className="flex-1"
                       />
                       <Button 
                         onClick={registrarTiempo} 
                         variant="secondary" 
                         size="sm"
                       >
                         <Plus className="w-4 h-4 mr-1" />
                         Agregar
                       </Button>
                     </div>
                     {errorTiempo && (
                       <p className="text-sm text-red-600 mt-1">{errorTiempo}</p>
                     )}
                   </div>
                 </div>

                 {/* Lista de registros de tiempo */}
                 <div className="space-y-3">
                   {detallesTarea.registrosTiempo?.length > 0 ? (
                     detallesTarea.registrosTiempo.map((item, index) => (
                       <div key={index} className="rounded-2xl bg-[#F8FAFB] p-4 border border-[#E5E7EB]">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <p className="text-sm font-medium text-slate-700">
                               {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES', { 
                                 day: 'numeric', 
                                 month: 'short', 
                                 year: 'numeric' 
                               }) : 'Fecha desconocida'}
                             </p>
                             {item.comentario ? (
                               <p className="text-sm text-slate-600 mt-1 italic">"{item.comentario}"</p>
                             ) : (
                               <p className="text-sm text-slate-400 mt-1 italic">Sin descripción</p>
                             )}
                           </div>
                           <div className="text-right ml-4">
                             <p className="text-xl font-bold text-[#032F2D]">{item.horas || 0}h</p>
                             <p className="text-xs text-slate-500">horas</p>
                           </div>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-8 text-slate-500">
                       <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                       <p>No hay registros de tiempo.</p>
                     </div>
                   )}
                 </div>
               </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};