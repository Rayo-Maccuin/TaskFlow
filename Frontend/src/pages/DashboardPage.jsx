import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { projectService, taskService } from '../services/apiService';
import { Button, Spinner, Modal, Input, Card } from '../components/UI';
import ProjectCard from '../components/ProjectCard';
import { Plus, Users, CheckCircle2, AlertCircle, BarChart3, FileText, Clock, TrendingUp } from 'lucide-react';

export const DashboardPage = () => {
  const { usuario } = useAuth();
  const { tema } = useTheme();
  const navigate = useNavigate();
  
  const [proyectos, setProyectos] = useState([]);
  const [progresos, setProgresos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [descripcionProyecto, setDescripcionProyecto] = useState('');
  const [fechaInicioProyecto, setFechaInicioProyecto] = useState('');
  const [fechaFinProyecto, setFechaFinProyecto] = useState('');
  const [invitadosProyecto, setInvitadosProyecto] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [creando, setCreando] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);
  
  // Nuevos estados para estadísticas de tareas
  const [statsTareas, setStatsTareas] = useState({
    total: 0,
    completadas: 0,
    enProgreso: 0,
    pendientes: 0,
    porVencer: 0
  });
  const [cargandoStats, setCargandoStats] = useState(false);

  useEffect(() => {
    cargarProyectos();
    
    // Recargar estadísticas cada 30 segundos
    const interval = setInterval(() => {
      if (proyectos.length > 0) {
        cargarEstadisticasTareas(proyectos);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const cargarEstadisticasTareas = async (proyectosList) => {
    try {
      setCargandoStats(true);
      if (!proyectosList || proyectosList.length === 0) {
        setStatsTareas({ total: 0, completadas: 0, enProgreso: 0, pendientes: 0, porVencer: 0 });
        return;
      }

      const tareasPromises = proyectosList.map(p => 
        taskService.obtenerPorProyecto(p.id || p._id)
      );
      const tareasResults = await Promise.allSettled(tareasPromises);
      
      const todasTareas = tareasResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r.value.data?.data || r.value.data || []));

      const stats = {
        total: todasTareas.length,
        completadas: 0,
        enProgreso: 0,
        pendientes: 0,
        porVencer: 0
      };

      const ahora = new Date();
      
      todasTareas.forEach(tarea => {
        const columnaNombre = (tarea.columnaNombre || tarea.estado || '').toUpperCase();
        
        if (columnaNombre === 'COMPLETADO' || tarea.completada) {
          stats.completadas++;
        } else if (columnaNombre === 'EN_PROGRESO') {
          stats.enProgreso++;
        } else {
          stats.pendientes++;
        }
        
        if (tarea.fechaLimite) {
          const fechaLimite = new Date(tarea.fechaLimite);
          const diasRestantes = Math.floor((fechaLimite - ahora) / (1000 * 60 * 60 * 24));
          if (diasRestantes <= 3 && diasRestantes >= 0) {
            stats.porVencer++;
          }
        }
      });
      
      setStatsTareas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas de tareas:', error);
    } finally {
      setCargandoStats(false);
    }
  };

  const cargarProyectos = async () => {
    try {
      setCargando(true);
      const response = await projectService.obtenerMisProyectos();
      const proyectosData = response.data.data || [];
      setProyectos(proyectosData);
      
      // Calcular progreso para cada proyecto y estadísticas
      if (proyectosData.length > 0) {
        const progresosPromises = proyectosData.map(async (proy) => {
          try {
            const tareasRes = await taskService.obtenerPorProyecto(proy.id || proy._id);
            const tareas = tareasRes.data?.data || tareasRes.data || [];
            const total = tareas.length;
            const completadas = tareas.filter(t => t.completada || (t.columnaNombre || '').toUpperCase() === 'COMPLETADO').length;
            return { id: proy.id || proy._id, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0 };
          } catch {
            return { id: proy.id || proy._id, porcentaje: 0 };
          }
        });
        
        const progresosArray = await Promise.all(progresosPromises);
        const progresosMap = {};
        progresosArray.forEach(p => {
          progresosMap[p.id] = p.porcentaje;
        });
        setProgresos(progresosMap);

        // Cargar estadísticas globales
        await cargarEstadisticasTareas(proyectosData);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setCargando(false);
    }
  };

  const estados = ['TODOS', 'PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO'];
  const proyectosFiltrados = estadoFiltro === 'TODOS'
    ? proyectos
    : proyectos.filter((p) => (p.estado || '').toUpperCase() === estadoFiltro);

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!nombreProyecto.trim()) return;

    try {
      setCreando(true);
      const response = await projectService.crear({
        nombre: nombreProyecto.trim(),
        descripcion: descripcionProyecto,
        fechaInicio: fechaInicioProyecto || null,
        fechaFin: fechaFinProyecto || null,
        invitados: invitadosProyecto
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      });
      
      const nuevoProyecto = response.data.data?.proyecto || response.data.proyecto || response.data;
      const nuevoProyectoId = nuevoProyecto?.id || nuevoProyecto?._id;
      
      if (nuevoProyecto && nuevoProyectoId) {
        // Agregar el nuevo proyecto a la lista con progreso 0
        const nuevoProyectoConProgreso = { ...nuevoProyecto };
        setProyectos(prev => [...prev, nuevoProyectoConProgreso]);
        setProgresos(prev => ({ ...prev, [nuevoProyectoId]: 0 }));
        setNombreProyecto('');
        setDescripcionProyecto('');
        setFechaInicioProyecto('');
        setFechaFinProyecto('');
        setInvitadosProyecto('');
        setModalAbierto(false);
        
        setTimeout(() => {
          navigate(`/proyecto/${nuevoProyectoId}`);
        }, 300);
      }
    } catch (error) {
      console.error('Error creando proyecto:', error);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarProyecto = async (idProyecto) => {
    const proyectoSeleccionado = proyectos.find((p) => (p.id || p._id) === idProyecto) || null;
    setProyectoAEliminar(proyectoSeleccionado);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminarProyecto = async () => {
    const proyectoIdEliminar = proyectoAEliminar?.id || proyectoAEliminar?._id;
    if (!proyectoIdEliminar) return;

    try {
      await projectService.eliminar(proyectoIdEliminar);
      const nuevosProyectos = proyectos.filter((p) => (p.id || p._id) !== proyectoIdEliminar);
      setProyectos(nuevosProyectos);
      
      // Recalcular progresos
      if (nuevosProyectos.length > 0) {
        const progresosPromises = nuevosProyectos.map(async (proy) => {
          try {
            const tareasRes = await taskService.obtenerPorProyecto(proy.id || proy._id);
            const tareas = tareasRes.data?.data || tareasRes.data || [];
            const total = tareas.length;
            const completadas = tareas.filter(t => t.completada || (t.columnaNombre || '').toUpperCase() === 'COMPLETADO').length;
            return { id: proy.id || proy._id, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0 };
          } catch {
            return { id: proy.id || proy._id, porcentaje: 0 };
          }
        });
        
        const progresosArray = await Promise.all(progresosPromises);
        const progresosMap = {};
        progresosArray.forEach(p => {
          progresosMap[p.id] = p.porcentaje;
        });
        setProgresos(progresosMap);
      } else {
        setProgresos({});
      }
      
      setModalEliminarAbierto(false);
      setProyectoAEliminar(null);
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tema.bg.primary }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 pb-6" style={{ borderBottom: `2px solid ${tema.bg.tertiary}` }}>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: tema.text.primary }}>
            Bienvenido, {usuario?.nombre}!
            <Users size={32} style={{ color: '#235347' }} />
          </h1>
          <p style={{ color: tema.text.secondary }}>
            Plataforma de Gestion Colaborativa de Tareas Universidad Popular del Cesar - Especializacion de Ingenieria de Software
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color: '#235347' }}>
              {proyectos.length}
            </div>
            <p style={{ color: tema.text.secondary }}>Proyectos</p>
          </Card>
          <Card className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color: '#8CB79B' }}>
              {statsTareas.enProgreso}
            </div>
            <p style={{ color: tema.text.secondary }}>Tareas en Progreso</p>
          </Card>
          <Card className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color: '#10B981' }}>
              {statsTareas.completadas}
            </div>
            <p style={{ color: tema.text.secondary }}>Tareas Completadas</p>
          </Card>
          <Card className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color: '#EF4444' }}>
              {statsTareas.porVencer}
            </div>
            <p style={{ color: tema.text.secondary }}>Por Vencer (3 días)</p>
          </Card>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ color: tema.text.primary }}>
              Mis Proyectos
            </h2>
            <div className="flex items-center gap-3 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm">
              <span className="text-sm font-medium text-slate-600">Filtrar por estado</span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="tf-input bg-slate-50 text-slate-700"
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado === 'TODOS' ? 'Todos los estados' : estado.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => setModalAbierto(true)}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Proyecto</span>
          </Button>
        </div>

        {/* Lista de proyectos */}
        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : proyectosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectosFiltrados.map((proyecto) => {
              const proyectoId = proyecto.id || proyecto._id;
              return (
                <div key={proyectoId} style={{ animation: 'slideInUp 0.35s ease-out' }}>
                  <ProjectCard
                    proyecto={proyecto}
                    progreso={progresos[proyectoId]}
                    onDelete={handleEliminarProyecto}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p style={{ color: tema.text.secondary }} className="mb-4">
              Aún no tienes proyectos
            </p>
            <Button onClick={() => setModalAbierto(true)} variant="primary">
              Crear el primer proyecto
            </Button>
          </Card>
        )}

        {/* Sección de Reportes y Gráficos Rápidos */}
        {proyectos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: tema.text.primary }}>
              Análisis y Reportes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/proyecto/${proyectos[0].id || proyectos[0]._id}/reportes`)}
                title="Ver gráficos y métricas del proyecto"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <BarChart3 className="text-blue-600" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Gráficos</h3>
                    <p className="text-sm text-gray-500">Ver métricas y tendencias</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/proyecto/${proyectos[0].id || proyectos[0]._id}/reportes`)}
                title="Exportar datos a CSV/PDF"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <FileText className="text-green-600" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Reportes</h3>
                    <p className="text-sm text-gray-500">Exportar datos completos</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/proyecto/${proyectos[0].id || proyectos[0]._id}/historial`)}
                title="Ver historial de actividad del proyecto"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Clock className="text-purple-600" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Historial</h3>
                    <p className="text-sm text-gray-500">Actividad y cambios recientes</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Modal crear proyecto */}
        <Modal
          isOpen={modalAbierto}
          onClose={() => {
            setModalAbierto(false);
            setNombreProyecto('');
            setDescripcionProyecto('');
            setFechaInicioProyecto('');
            setFechaFinProyecto('');
            setInvitadosProyecto('');
          }}
          title="Crear Nuevo Proyecto"
          size="lg"
        >
          <form onSubmit={handleCrearProyecto} className="space-y-4">
            <Input
              label="Nombre del proyecto"
              placeholder="Ej: App Movil E-commerce"
              value={nombreProyecto}
              onChange={(e) => setNombreProyecto(e.target.value)}
              required
            />

            <div className="mb-4">
              <label className="tf-label">Descripción</label>
              <textarea
                placeholder="Describe el objetivo del proyecto..."
                value={descripcionProyecto}
                onChange={(e) => setDescripcionProyecto(e.target.value)}
                className="tf-textarea w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800"
                rows="4"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="tf-label">Fecha de inicio</label>
                <input
                  type="date"
                  value={fechaInicioProyecto}
                  onChange={(e) => setFechaInicioProyecto(e.target.value)}
                  className="tf-input w-full"
                />
              </div>
              <div>
                <label className="tf-label">Fecha estimada de fin</label>
                <input
                  type="date"
                  value={fechaFinProyecto}
                  onChange={(e) => setFechaFinProyecto(e.target.value)}
                  className="tf-input w-full"
                />
              </div>
            </div>

            <Input
              label="Invitar miembros (correo electrónico)"
              placeholder="correo@ejemplo.com"
              value={invitadosProyecto}
              onChange={(e) => setInvitadosProyecto(e.target.value)}
              className=""
            />
            <p className="text-sm text-slate-500">Separa varios correos con comas</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 flex items-center justify-center space-x-2"
                disabled={creando}
              >
                {creando ? (
                  <>
                    <Spinner size="sm" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Proyecto</span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={modalEliminarAbierto}
          onClose={() => {
            setModalEliminarAbierto(false);
            setProyectoAEliminar(null);
          }}
          title="Confirmar eliminación"
        >
          <div className="space-y-5">
            <p className="text-center" style={{ color: tema.text.primary }}>
              ¿Seguro que deseas eliminar el proyecto
              <span className="font-semibold"> {proyectoAEliminar?.nombre || ''}</span>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 text-center">
                Esta acción eliminará el tablero y las tareas asociadas. No se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setModalEliminarAbierto(false);
                  setProyectoAEliminar(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={confirmarEliminarProyecto}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DashboardPage;
