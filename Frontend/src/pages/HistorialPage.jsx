import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { projectService, taskService } from '../services/apiService';
import { Card, Button, Spinner, Input } from '../components/UI';
import { 
  History, 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock,
  CheckCircle,
  Edit3,
  Trash2,
  Plus,
  FileText,
  Filter
} from 'lucide-react';

export const HistorialPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tema } = useTheme();

  const [proyectos, setProyectos] = useState([]);
  const [proyecto, setProyecto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(id || null);

   const cargarDatos = async () => {
     try {
       setCargando(true);
       
       // Cargar todos los proyectos del usuario
       const proyectosRes = await projectService.obtenerMisProyectos();
       const proyectosData = Array.isArray(proyectosRes.data?.data) 
         ? proyectosRes.data.data 
         : Array.isArray(proyectosRes.data) 
         ? proyectosRes.data 
         : [];
       
       setProyectos(proyectosData);

       const eventosHistorial = [];

       // Si hay un proyecto específico seleccionado
       if (proyectoSeleccionado) {
         const [projRes, tareasRes] = await Promise.all([
           projectService.obtenerPorId(proyectoSeleccionado),
           taskService.obtenerPorProyecto(proyectoSeleccionado),
         ]);

         setProyecto(projRes.data?.data || projRes.data);
         const tasksData = tareasRes.data?.data ?? tareasRes.data;
         const tareas = Array.isArray(tasksData) ? tasksData : [];

         tareas.forEach((tarea) => {
           // Creación de tarea
           if (tarea.createdAt) {
             eventosHistorial.push({
               id: `creacion-${tarea.id || tarea._id}`,
               tipo: 'CREACION_TAREA',
               descripcion: `Tarea "${tarea.titulo}" creada`,
               usuario: tarea.creador?.nombre || 'Sistema',
               fecha: tarea.createdAt,
               metadata: { tarea, tipo: 'tarea' },
             });
           }

           // Edición de tarea (cualquier cambio en updatedAt)
           if (tarea.updatedAt && tarea.updatedAt !== tarea.createdAt) {
             eventosHistorial.push({
               id: `edicion-${tarea.id || tarea._id}-${Date.parse(tarea.updatedAt)}`,
               tipo: 'EDICION_TAREA',
               descripcion: `Tarea "${tarea.titulo}" actualizada`,
               usuario: tarea.creador?.nombre || 'Sistema',
               fecha: tarea.updatedAt,
               metadata: { tarea, tipo: 'tarea' },
             });
           }

           // Completado de tarea
           if (tarea.completada) {
             eventosHistorial.push({
               id: `completado-${tarea.id || tarea._id}`,
               tipo: 'COMPLETADO_TAREA',
               descripcion: `Tarea "${tarea.titulo}" marcada como completada`,
               usuario: tarea.responsables?.[0]?.nombre || 'Usuario',
               fecha: tarea.updatedAt || tarea.createdAt,
               metadata: { tarea, tipo: 'tarea' },
             });
           }
         });
       } else if (proyectosData.length > 0) {
         // Cargar historial de TODOS los proyectos
         for (const proj of proyectosData) {
           try {
             const tareasRes = await taskService.obtenerPorProyecto(proj.id || proj._id);
             const tasksData = tareasRes.data?.data ?? tareasRes.data;
             const tareas = Array.isArray(tasksData) ? tasksData : [];

             tareas.forEach((tarea) => {
               // Creación de tarea
               if (tarea.createdAt) {
                 eventosHistorial.push({
                   id: `creacion-${tarea.id || tarea._id}`,
                   tipo: 'CREACION_TAREA',
                   descripcion: `Tarea "${tarea.titulo}" creada en "${proj.nombre}"`,
                   usuario: tarea.creador?.nombre || 'Sistema',
                   fecha: tarea.createdAt,
                   metadata: { tarea, tipo: 'tarea', proyecto: proj },
                 });
               }

               // Edición de tarea
               if (tarea.updatedAt && tarea.updatedAt !== tarea.createdAt) {
                 eventosHistorial.push({
                   id: `edicion-${tarea.id || tarea._id}-${Date.parse(tarea.updatedAt)}`,
                   tipo: 'EDICION_TAREA',
                   descripcion: `Tarea "${tarea.titulo}" actualizada en "${proj.nombre}"`,
                   usuario: tarea.creador?.nombre || 'Sistema',
                   fecha: tarea.updatedAt,
                   metadata: { tarea, tipo: 'tarea', proyecto: proj },
                 });
               }

               // Completado de tarea
               if (tarea.completada) {
                 eventosHistorial.push({
                   id: `completado-${tarea.id || tarea._id}`,
                   tipo: 'COMPLETADO_TAREA',
                   descripcion: `Tarea "${tarea.titulo}" completada en "${proj.nombre}"`,
                   usuario: tarea.responsables?.[0]?.nombre || 'Usuario',
                   fecha: tarea.updatedAt || tarea.createdAt,
                   metadata: { tarea, tipo: 'tarea', proyecto: proj },
                 });
               }
             });
           } catch (error) {
             console.error(`Error cargando tareas de proyecto ${proj.id}:`, error);
           }
         }
         setProyecto(null); // No hay proyecto específico
       }

       eventosHistorial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
       setHistorial(eventosHistorial);
     } catch (error) {
       console.error('Error cargando historial:', error);
     } finally {
       setCargando(false);
     }
   };

  useEffect(() => {
    cargarDatos();
    
    const interval = setInterval(() => {
      cargarDatos();
    }, 30000);

    return () => clearInterval(interval);
  }, [proyectoSeleccionado]);

  const eventosFiltrados = historial.filter(evento => {
    if (filtroTipo && evento.tipo !== filtroTipo) return false;
    if (filtroUsuario && !evento.usuario?.toLowerCase().includes(filtroUsuario.toLowerCase())) return false;
    return true;
  });

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case 'CREACION_TAREA':
        return <Plus size={16} className="text-green-600" />;
      case 'EDICION_TAREA':
        return <Edit3 size={16} className="text-blue-600" />;
      case 'COMPLETADO_TAREA':
        return <CheckCircle size={16} className="text-purple-600" />;
      case 'ELIMINACION_TAREA':
        return <Trash2 size={16} className="text-red-600" />;
      case 'CREACION_COLUMNA':
      case 'EDICION_COLUMNA':
        return <FileText size={16} className="text-amber-600" />;
      default:
        return <History size={16} className="text-gray-600" />;
    }
  };

  const obtenerColorEvento = (tipo) => {
    switch (tipo) {
      case 'CREACION_TAREA':
        return 'bg-green-50 border-green-200';
      case 'EDICION_TAREA':
        return 'bg-blue-50 border-blue-200';
      case 'COMPLETADO_TAREA':
        return 'bg-purple-50 border-purple-200';
      case 'ELIMINACION_TAREA':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: tema.bg.primary }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/dashboard`)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" style={{ color: tema.text.primary }}>
              Historial de Actividad
            </h1>
            <p style={{ color: tema.text.secondary }}>
              {proyecto?.nombre || 'Todos los proyectos'}
            </p>
          </div>
        </div>

        {/* Selector de Proyecto */}
        {proyectos.length > 1 && (
          <Card className="mb-6">
            <div className="flex items-center gap-2">
              <span className="font-medium">Filtrar por proyecto:</span>
              <select
                value={proyectoSeleccionado || ''}
                onChange={(e) => setProyectoSeleccionado(e.target.value || null)}
                className="tf-select w-auto"
              >
                <option value="">Todos los proyectos</option>
                {proyectos.map((proj) => (
                  <option key={proj.id || proj._id} value={proj.id || proj._id}>
                    {proj.nombre}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <span className="font-medium">Filtrar:</span>
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="tf-select w-auto"
            >
              <option value="">Todos los eventos</option>
              <option value="CREACION_TAREA">Creación de tarea</option>
              <option value="EDICION_TAREA">Edición de tarea</option>
              <option value="COMPLETADO_TAREA">Tarea completada</option>
              <option value="ELIMINACION_TAREA">Eliminación de tarea</option>
              <option value="CREACION_COLUMNA">Creación de columna</option>
            </select>

            <Input
              placeholder="Filtrar por usuario..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-auto"
            />
          </div>
        </Card>

        {/* Timeline de eventos */}
        <div className="space-y-4">
          {eventosFiltrados.length > 0 ? (
            eventosFiltrados.map((evento, index) => (
              <div
                key={evento.id}
                className={`relative pl-6 pb-6 border-l-2 ${
                  index === eventosFiltrados.length - 1 ? 'border-l-0' : ''
                } ${obtenerColorEvento(evento.tipo)} rounded-r-lg p-4`}
              >
                {/* Punto del timeline */}
                <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  {obtenerIcono(evento.tipo)}
                </div>

                {/* Contenido */}
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{evento.descripcion}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    evento.tipo.includes('CREACION') ? 'bg-green-100 text-green-700' :
                    evento.tipo.includes('EDICION') ? 'bg-blue-100 text-blue-700' :
                    evento.tipo.includes('COMPLETADO') ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {evento.tipo.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{evento.usuario}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(evento.fecha).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(evento.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Metadatos adicionales */}
                {evento.metadata?.tarea && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tipo:</span> {evento.metadata.tarea.tipo}
                      {evento.metadata.tarea.prioridad && ` • Prioridad: ${evento.metadata.tarea.prioridad}`}
                      {evento.metadata.tarea.completada && ' • ✅ Completada'}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <History size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No hay actividad registrada</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialPage;
