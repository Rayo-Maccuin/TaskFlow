import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { projectService, taskService, reportService } from '../services/apiService';
import { Card, Button, Spinner, Input } from '../components/UI';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar, 
  ArrowLeft,
  Filter
} from 'lucide-react';

export const ReportesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tema } = useTheme();

  const [proyectos, setProyectos] = useState([]);
  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tareas, setTareas] = useState([]);
  const [periodo, setPeriodo] = useState('30d');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
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
      
      // Si hay un proyectoId específico o seleccionado, cargar sus datos
      if (proyectoSeleccionado) {
        const [projRes, tareasRes] = await Promise.all([
          projectService.obtenerPorId(proyectoSeleccionado),
          taskService.obtenerPorProyecto(proyectoSeleccionado),
        ]);

        setProyecto(projRes.data?.data || projRes.data);
        const tasksData = tareasRes.data?.data ?? tareasRes.data;
        setTareas(Array.isArray(tasksData) ? tasksData : []);
      } else if (proyectosData.length > 0) {
        // Si no hay proyecto seleccionado, cargar todos los proyectos
        const todasLasTareas = [];
        for (const proj of proyectosData) {
          try {
            const tareasRes = await taskService.obtenerPorProyecto(proj.id || proj._id);
            const tasksData = tareasRes.data?.data ?? tareasRes.data;
            todasLasTareas.push(...(Array.isArray(tasksData) ? tasksData : []));
          } catch (error) {
            console.error(`Error cargando tareas de proyecto ${proj.id}:`, error);
          }
        }
        setProyecto(null); // No hay proyecto específico
        setTareas(todasLasTareas);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setTareas([]);
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

  const tareasFiltradas = tareas.filter(t => {
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (filtroEstado && (t.estado || t.columnaNombre) !== filtroEstado) return false;
    return true;
  });

  const stats = {
    total: tareasFiltradas.length,
    completadas: tareasFiltradas.filter(t => t.completada).length,
    pendientes: tareasFiltradas.filter(t => !t.completada).length,
    porTipo: {
      TASK: tareasFiltradas.filter(t => t.tipo === 'TASK').length,
      BUG: tareasFiltradas.filter(t => t.tipo === 'BUG').length,
      FEATURE: tareasFiltradas.filter(t => t.tipo === 'FEATURE').length,
      IMPROVEMENT: tareasFiltradas.filter(t => t.tipo === 'IMPROVEMENT').length,
    },
    porPrioridad: {
      BAJA: tareasFiltradas.filter(t => t.prioridad === 'BAJA').length,
      MEDIA: tareasFiltradas.filter(t => t.prioridad === 'MEDIA').length,
      ALTA: tareasFiltradas.filter(t => t.prioridad === 'ALTA').length,
      URGENTE: tareasFiltradas.filter(t => t.prioridad === 'URGENTE').length,
    },
  };

  const progreso = stats.total > 0 ? Math.round((stats.completadas / stats.total) * 100) : 0;

   const handleExportCSV = async () => {
     const pid = proyectoSeleccionado || id;
     console.log('[ReportesPage] Exportando CSV, pid:', pid, 'proyectoSeleccionado:', proyectoSeleccionado, 'id:', id);
     if (!pid) { alert('Selecciona un proyecto'); return; }
     try {
       const response = await reportService.exportarCSV(pid);
       const blob = response.data;
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `reporte-${proyecto?.nombre || pid}.csv`;
       a.click();
       URL.revokeObjectURL(url);
     } catch (e) {
       console.error('Error exportando CSV', e);
       if (e.response) {
         console.error('Backend response:', e.response.data);
         alert(`Error: ${e.response.data.message || 'Verifica consola'} `);
       } else {
         alert('Error exportando CSV. Verifica que el backend tenga el endpoint.');
       }
     }
   };

   const handleExportPDF = async () => {
     const pid = proyectoSeleccionado || id;
     if (!pid) { alert('Selecciona un proyecto'); return; }
     try {
       const response = await reportService.exportarPDF(pid);
       const blob = response.data;
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `reporte-${proyecto?.nombre || pid}.pdf`;
       a.click();
       URL.revokeObjectURL(url);
     } catch (e) {
       console.error('Error exportando PDF', e);
       alert('Error exportando PDF. Verifica que el backend tenga el endpoint.');
     }
   };

   const handleExportExcel = async () => {
     const pid = proyectoSeleccionado || id;
     console.log('[ReportesPage] Exportando Excel, pid:', pid, 'proyectoSeleccionado:', proyectoSeleccionado, 'id:', id);
     if (!pid) { alert('Selecciona un proyecto'); return; }
     try {
       const response = await reportService.exportarExcel(pid);
       const blob = response.data;
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `reporte-${proyecto?.nombre || pid}.xls`;
       a.click();
       URL.revokeObjectURL(url);
     } catch (e) {
       console.error('Error exportando Excel', e);
       let errMsg = 'Error desconocido';
       if (e.response) {
         // Intentar leer el blob como texto
         const reader = new FileReader();
         reader.onload = () => {
           try {
             const json = JSON.parse(reader.result);
             errMsg = json.message || 'Error en backend';
           } catch {
             errMsg = reader.result || 'Error enbackend (no JSON)';
           }
           alert(`Error ${e.response.status}: ${errMsg}`);
         };
         reader.readAsText(e.response.data);
         return; // La alerta se mostrará en el onload
       } else {
         errMsg = e.message;
       }
       alert(`Error: ${errMsg}`);
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              Reportes y Métricas
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
              <span className="font-medium">Filtros:</span>
            </div>
            
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="tf-select w-auto"
            >
              <option value="">Todos los tipos</option>
              <option value="TASK">Tarea</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE">Feature</option>
              <option value="IMPROVEMENT">Mejora</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="tf-select w-auto"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="COMPLETADO">Completado</option>
            </select>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="tf-select w-auto"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>

             <div className="flex gap-2 ml-auto">
               <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
                 <Download size={16} />
                 CSV
               </Button>
               <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
                 <Download size={16} />
                 Excel
               </Button>
               <Button variant="primary" onClick={handleExportPDF} className="flex items-center gap-2">
                 <Download size={16} />
                 PDF
               </Button>
             </div>
          </div>
        </Card>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tareas</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.completadas}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pendientes}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <PieChart className="text-amber-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Progreso</p>
                <p className="text-3xl font-bold" style={{ color: '#8B5CF6' }}>{progreso}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos de Distribución */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Distribución por Tipo */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Distribución por Tipo</h3>
            <div className="space-y-3">
              {Object.entries(stats.porTipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">{tipo}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: stats.total > 0 ? `${(cantidad / stats.total) * 100}%` : '0%',
                        backgroundColor: 
                          tipo === 'TASK' ? '#6366F1' :
                          tipo === 'BUG' ? '#EF4444' :
                          tipo === 'FEATURE' ? '#14B8A6' : '#A855F7',
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{cantidad}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Distribución por Prioridad */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Distribución por Prioridad</h3>
            <div className="space-y-3">
              {Object.entries(stats.porPrioridad).map(([prioridad, cantidad]) => (
                <div key={prioridad} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">{prioridad}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: stats.total > 0 ? `${(cantidad / stats.total) * 100}%` : '0%',
                        backgroundColor:
                          prioridad === 'BAJA' ? '#6B7280' :
                          prioridad === 'MEDIA' ? '#2563EB' :
                          prioridad === 'ALTA' ? '#D97706' : '#DC2626',
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{cantidad}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Tabla detallada */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Detalle de Tareas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Título</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Prioridad</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Responsables</th>
                  <th className="text-left py-3 px-4">Fecha Límite</th>
                </tr>
              </thead>
              <tbody>
                {tareasFiltradas.map((tarea) => (
                  <tr key={tarea.id || tarea._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={tarea.completada ? 'line-through text-gray-500' : ''}>
                        {tarea.titulo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs text-white"
                            style={{ backgroundColor: 
                              tarea.tipo === 'TASK' ? '#6366F1' :
                              tarea.tipo === 'BUG' ? '#EF4444' :
                              tarea.tipo === 'FEATURE' ? '#14B8A6' : '#A855F7'
                            }}>
                        {tarea.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tarea.prioridad === 'BAJA' ? 'bg-gray-100 text-gray-600' :
                        tarea.prioridad === 'MEDIA' ? 'bg-blue-100 text-blue-700' :
                        tarea.prioridad === 'ALTA' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tarea.prioridad}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tarea.completada ? 'bg-green-100 text-green-700' :
                        tarea.estado === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tarea.completada ? 'COMPLETADO' : (tarea.estado || 'PENDIENTE')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tarea.responsables?.length > 0 ? (
                        <div className="flex gap-1">
                          {tarea.responsables.slice(0, 3).map((resp, idx) => (
                            <div
                              key={resp.id || resp._id || idx}
                              className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs"
                              title={resp.nombre}
                            >
                              {resp.nombre?.[0] || 'U'}
                            </div>
                          ))}
                          {tarea.responsables.length > 3 && (
                            <span className="text-xs text-gray-500">+{tarea.responsables.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {tarea.fechaLimite ? new Date(tarea.fechaLimite).toLocaleDateString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tareasFiltradas.length === 0 && (
              <p className="text-center py-8 text-gray-500">No hay tareas que mostrar</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportesPage;
