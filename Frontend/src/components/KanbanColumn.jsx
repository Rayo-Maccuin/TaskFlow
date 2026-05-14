import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Plus, Trash2, Pencil, Calendar, Clock, MoreVertical, GripVertical, Eye, Paperclip } from 'lucide-react';
import { Modal, Input, Button } from './UI';
import { TaskDetailsModal } from './TaskDetailsModal';

const KanbanColumn = ({
  columna,
  tareas,
  miembrosProyecto = [],
  onAddTask,
  onDeleteColumn,
  onTaskMove,
  onUpdateTask,
  onAssignResponsible,
  onRemoveResponsible,
  onDeleteTask,
  onRefreshTasks,
}) => {
  const { tema } = useTheme();
  
  // Estados para crear tarea
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState('MEDIA');
  const [nuevoTipo, setNuevoTipo] = useState('TASK');
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('');
  const [nuevaEstimacionHoras, setNuevaEstimacionHoras] = useState('');

  // Estados para editar tarea
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [responsableSeleccionado, setResponsableSeleccionado] = useState('');

  // Estados para UI
  const [dragOver, setDragOver] = useState(false);
  const [menuColumnaAbierto, setMenuColumnaAbierto] = useState(false);
  const [mostrarWIP, setMostrarWIP] = useState(false);
  const [asignandoResponsable, setAsignandoResponsable] = useState(false);
  const [removiendoResponsableId, setRemoviendoResponsableId] = useState('');
  const [tareaDetalleSeleccionada, setTareaDetalleSeleccionada] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const columnaId = columna.id || columna._id;
  const limiteWIP = columna.limiteWIP || null;
  const tareasCompletadas = (tareas || []).filter(t => t.completada).length;

  // Handlers para crear tarea
  const handleAddTask = () => {
    if (nuevoTitulo.trim()) {
      onAddTask(columnaId, {
        titulo: nuevoTitulo.trim(),
        descripcion: nuevaDescripcion.trim(),
        prioridad: nuevaPrioridad,
        tipo: nuevoTipo,
        fechaLimite: nuevaFechaLimite || null,
        estimacionHoras: nuevaEstimacionHoras || 0,
      });
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevaPrioridad('MEDIA');
      setNuevoTipo('TASK');
      setNuevaFechaLimite('');
      setNuevaEstimacionHoras('');
      setModalAbierto(false);
    }
  };

  const handleCerrarModalCrear = () => {
    setModalAbierto(false);
    setNuevoTitulo('');
    setNuevaDescripcion('');
    setNuevaPrioridad('MEDIA');
    setNuevoTipo('TASK');
    setNuevaFechaLimite('');
    setNuevaEstimacionHoras('');
  };

  // Handlers para drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const tareaId = e.dataTransfer.getData('taskId');
    if (tareaId) {
      onTaskMove(tareaId, columnaId);
    }
  };

  // Handlers para editar tarea
  const abrirEdicion = (tarea) => {
    setTareaEditando({
      ...tarea,
      fechaLimite: tarea.fechaLimite
        ? new Date(tarea.fechaLimite).toISOString().slice(0, 10)
        : '',
      estimacionHoras: tarea.estimacionHoras ?? 0,
    });
    setResponsableSeleccionado('');
    setModalEditarAbierto(true);
  };

  const abrirDetalleTarea = (tarea) => {
    setTareaDetalleSeleccionada(tarea);
    setModalDetalleAbierto(true);
  };

  const cerrarDetalleTarea = () => {
    setModalDetalleAbierto(false);
    setTareaDetalleSeleccionada(null);
  };

   const handleGuardarEdicion = async () => {
     if (!tareaEditando?.titulo?.trim()) return;
     await onUpdateTask?.(tareaEditando.id || tareaEditando._id, {
       titulo: tareaEditando.titulo,
       descripcion: tareaEditando.descripcion || '',
       prioridad: tareaEditando.prioridad || 'MEDIA',
       tipo: tareaEditando.tipo || 'TASK',
       fechaLimite: tareaEditando.fechaLimite || null,
       estimacionHoras: Number(tareaEditando.estimacionHoras || 0),
       completada: Boolean(tareaEditando.completada),
     });
     setModalEditarAbierto(false);
     setTareaEditando(null);
   };

  const handleCerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setTareaEditando(null);
    setResponsableSeleccionado('');
  };

  const handleAsignarResponsable = async () => {
    if (!tareaEditando?.id && !tareaEditando?._id) return;
    try {
      setAsignandoResponsable(true);
      await onAssignResponsible(tareaEditando.id || tareaEditando._id, responsableSeleccionado);
      setModalEditarAbierto(false);
      setTareaEditando(null);
      setResponsableSeleccionado('');
    } finally {
      setAsignandoResponsable(false);
    }
  };

  const handleQuitarResponsable = async (idUsuario) => {
    if ((!tareaEditando?.id && !tareaEditando?._id) || !idUsuario || !onRemoveResponsible) return;
    try {
      setRemoviendoResponsableId(idUsuario);
      await onRemoveResponsible(tareaEditando.id || tareaEditando._id, idUsuario);
    } finally {
      setRemoviendoResponsableId('');
    }
  };

  // Helpers para formateo y lógica
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '100, 100, 100';
  };

  const esVencida = (tarea) => {
    if (!tarea?.fechaLimite || tarea?.completada) return false;
    return new Date(tarea.fechaLimite) < new Date();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const obtenerIniciales = (nombre) => {
    if (!nombre) return 'US';
    return nombre
      .split(' ')
      .map((parte) => parte[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const normalizarId = (valor) => {
    if (!valor) return '';
    if (typeof valor === 'string') return valor;
    if (valor._id) return valor._id.toString();
    if (valor.id) return valor.id.toString();
    return valor.toString ? valor.toString() : '';
  };

   const prioridadColors = {
     BAJA: { bg: '#F3F4F6', text: '#6B7280' },
     MEDIA: { bg: '#DBEAFE', text: '#2563EB' },
     ALTA: { bg: '#FEF3C7', text: '#D97706' },
     URGENTE: { bg: '#FEE2E2', text: '#DC2626' },
   };

  const tipoColors = {
    TASK: '#6366F1',
    BUG: '#EF4444',
    FEATURE: '#14B8A6',
    IMPROVEMENT: '#A855F7',
  };

  return (
    <div
      className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden h-fit min-h-96"
      style={{
        backgroundColor: tema?.colores?.fondo || '#FFFFFF',
        color: tema?.colores?.texto || '#000000',
      }}
    >
      {/* Encabezado de columna */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: tema?.colores?.borde || '#E5E7EB' }}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripVertical size={18} className="text-gray-400 cursor-move" />
          <h3 className="font-semibold text-lg">{columna.nombre}</h3>
          <span
            className="px-2 py-1 rounded text-sm font-medium"
            style={{
              backgroundColor: tema?.colores?.destacado || '#E0E7FF',
              color: tema?.colores?.textoDestacado || '#4F46E5',
            }}
          >
            {tareas?.length || 0}
          </span>
          {limiteWIP && (
            <button
              onClick={() => setMostrarWIP(!mostrarWIP)}
              className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: tareasCompletadas >= limiteWIP ? '#FEE2E2' : '#DBeafe',
                color: tareasCompletadas >= limiteWIP ? '#DC2626' : '#2563EB',
              }}
            >
              WIP: {tareasCompletadas}/{limiteWIP}
            </button>
          )}
        </div>

        {/* Menú de opciones */}
        <div className="relative">
          <button
            onClick={() => setMenuColumnaAbierto(!menuColumnaAbierto)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <MoreVertical size={18} />
          </button>
          {menuColumnaAbierto && (
            <div
              className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-10 min-w-40"
              style={{ backgroundColor: tema?.colores?.fondo || '#FFFFFF' }}
            >
              <button
                onClick={() => {
                  onDeleteColumn(columnaId);
                  setMenuColumnaAbierto(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar columna
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Área de tareas */}
      <div
        className={`flex-1 p-3 space-y-2 overflow-y-auto ${
          dragOver ? 'bg-blue-50 border-2 border-blue-300' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundColor: dragOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        }}
      >
         {tareas && tareas.length > 0 ? (
           tareas.map((tarea) => (
             <div
               key={tarea.id || tarea._id}
               draggable
               onDragStart={(e) => e.dataTransfer.setData('taskId', tarea.id || tarea._id)}
               className="p-3 bg-gray-50 rounded-lg cursor-move hover:shadow-md transition-shadow"
               style={{
                 borderLeft: `4px solid ${tipoColors[tarea.tipo] || tipoColors.TASK}`,
                 backgroundColor: tema?.colores?.fondoTarea || '#F9FAFB',
               }}
             >
                {/* Título y tipo */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <p
                      className={`font-medium text-sm ${
                        tarea.completada ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {tarea.titulo}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded text-white ml-2"
                    style={{ backgroundColor: tipoColors[tarea.tipo] || tipoColors.TASK }}
                  >
                    {tarea.tipo}
                  </span>
                </div>

               {/* Descripción */}
               {tarea.descripcion && (
                 <p className="text-xs text-gray-600 mb-2 line-clamp-2">{tarea.descripcion}</p>
               )}

               {/* ETIQUETAS (Decorador Visual) */}
               {tarea.etiquetas && tarea.etiquetas.length > 0 && (
                 <div className="flex flex-wrap gap-1 mb-2">
                   {tarea.etiquetas.map((etiqueta, idx) => (
                     <span
                       key={idx}
                       className="text-xs px-2 py-0.5 rounded-full"
                       style={{
                         backgroundColor: '#DBEAFE',
                         color: '#1E40AF',
                         border: '1px solid #93C5FD'
                       }}
                     >
                       {etiqueta}
                     </span>
                   ))}
                 </div>
               )}

               {/* ARCHIVOS ADJUNTOS (Decorador Visual) */}
               {tarea.adjuntos && tarea.adjuntos.length > 0 && (
                 <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                   <Paperclip size={12} />
                   <span>{tarea.adjuntos.length} archivo(s)</span>
                 </div>
               )}

               {/* Prioridad y meta información */}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={prioridadColors[tarea.prioridad] || prioridadColors.MEDIA}
                >
                  {tarea.prioridad}
                </span>

                {tarea.estimacionHoras && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock size={12} />
                    {tarea.estimacionHoras}h
                  </div>
                )}

                {tarea.fechaLimite && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      esVencida(tarea) ? 'text-red-600 font-bold' : 'text-gray-600'
                    }`}
                  >
                    <Calendar size={12} />
                    {formatearFecha(tarea.fechaLimite)}
                  </div>
                )}
              </div>

              {/* Responsables */}
              {tarea.responsables && tarea.responsables.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {tarea.responsables.map((responsable) => (
                    <div
                      key={normalizarId(responsable)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor: `rgb(${hexToRgb(responsable.color || '#6366F1')})`,
                      }}
                      title={responsable.nombre}
                    >
                      {obtenerIniciales(responsable.nombre)}
                    </div>
                  ))}
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={() => abrirDetalleTarea(tarea)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  <Eye size={14} />
                  Ver detalles
                </button>
                <button
                  onClick={() => abrirEdicion(tarea)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                >
                  <Pencil size={14} />
                  Editar
                </button>
                <button
                  onClick={() => onDeleteTask(tarea.id || tarea._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-20 text-gray-400">
            <p>No hay tareas</p>
          </div>
        )}
      </div>

      {/* Botón añadir tarea */}
      <div className="p-3 border-t" style={{ borderColor: tema?.colores?.borde || '#E5E7EB' }}>
        <button
          onClick={() => setModalAbierto(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: tema?.colores?.destacado || '#E0E7FF',
            color: tema?.colores?.textoDestacado || '#4F46E5',
          }}
        >
          <Plus size={18} />
          Añadir tarea
        </button>
      </div>

      {/* Modal crear tarea */}
      <Modal
        isOpen={modalAbierto}
        onClose={handleCerrarModalCrear}
        titulo="Crear nueva tarea"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <Input
              type="text"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              placeholder="Título de la tarea"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              placeholder="Descripción de la tarea"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prioridad</label>
              <select
                value={nuevaPrioridad}
                onChange={(e) => setNuevaPrioridad(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="TASK">Tarea</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="IMPROVEMENT">Mejora</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha límite</label>
              <Input
                type="date"
                value={nuevaFechaLimite}
                onChange={(e) => setNuevaFechaLimite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Horas estimadas</label>
              <Input
                type="number"
                min="0"
                value={nuevaEstimacionHoras}
                onChange={(e) => setNuevaEstimacionHoras(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={handleCerrarModalCrear}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddTask}
            >
              Crear tarea
            </Button>
          </div>
        </div>
      </Modal>

      <TaskDetailsModal
        tarea={tareaDetalleSeleccionada}
        isOpen={modalDetalleAbierto}
        onClose={cerrarDetalleTarea}
        onTareaActualizada={() => onRefreshTasks?.()}
      />

      {/* Modal editar tarea */}
      <Modal
        isOpen={modalEditarAbierto}
        onClose={handleCerrarModalEditar}
        titulo="Editar tarea"
      >
        {tareaEditando && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input
                type="text"
                value={tareaEditando.titulo}
                onChange={(e) =>
                  setTareaEditando({ ...tareaEditando, titulo: e.target.value })
                }
                placeholder="Título de la tarea"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={tareaEditando.descripcion || ''}
                onChange={(e) =>
                  setTareaEditando({ ...tareaEditando, descripcion: e.target.value })
                }
                placeholder="Descripción de la tarea"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  value={tareaEditando.prioridad}
                  onChange={(e) =>
                    setTareaEditando({ ...tareaEditando, prioridad: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={tareaEditando.tipo}
                  onChange={(e) =>
                    setTareaEditando({ ...tareaEditando, tipo: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="TASK">Tarea</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                  <option value="IMPROVEMENT">Mejora</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha límite</label>
                <Input
                  type="date"
                  value={tareaEditando.fechaLimite}
                  onChange={(e) =>
                    setTareaEditando({ ...tareaEditando, fechaLimite: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Horas estimadas</label>
                <Input
                  type="number"
                  min="0"
                  value={tareaEditando.estimacionHoras}
                  onChange={(e) =>
                    setTareaEditando({
                      ...tareaEditando,
                      estimacionHoras: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Responsables */}
            <div>
              <label className="block text-sm font-medium mb-2">Responsables</label>
              {tareaEditando.responsables && tareaEditando.responsables.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {tareaEditando.responsables.map((responsable) => (
                    <div
                      key={normalizarId(responsable)}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded"
                    >
                      <span className="text-sm">{responsable.nombre}</span>
                      <button
                        onClick={() => handleQuitarResponsable(normalizarId(responsable))}
                        disabled={removiendoResponsableId === normalizarId(responsable)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {removiendoResponsableId === normalizarId(responsable)
                          ? 'Quitando...'
                          : 'Quitar'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">Sin responsables asignados</p>
              )}

              <div className="flex gap-2">
                <select
                  value={responsableSeleccionado}
                  onChange={(e) => setResponsableSeleccionado(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Seleccionar responsable</option>
                  {miembrosProyecto.map((miembro) => (
                    <option key={normalizarId(miembro)} value={normalizarId(miembro)}>
                      {miembro.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAsignarResponsable}
                  disabled={!responsableSeleccionado || asignandoResponsable}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {asignandoResponsable ? 'Asignando...' : 'Asignar'}
                </button>
              </div>
            </div>

            {/* Checkbox completada */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="completada"
                checked={tareaEditando.completada || false}
                onChange={(e) =>
                  setTareaEditando({ ...tareaEditando, completada: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="completada" className="text-sm font-medium text-gray-700">
                Marcar como completada
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={handleCerrarModalEditar}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGuardarEdicion}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KanbanColumn;
