import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { projectService, taskService, reportService, authService } from '../services/apiService';
import { Button, Spinner, Card, Input, Modal } from '../components/UI';
import KanbanColumn from '../components/KanbanColumn';
import { ArrowLeft, Plus, Pencil, Copy, Archive, Trash2, ChevronDown } from 'lucide-react';

export const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tema } = useTheme();
  const { usuario } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [tablero, setTablero] = useState(null);
  const [tareas, setTareas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalColumnaAbierto, setModalColumnaAbierto] = useState(false);
  const [nombreColumnaNew, setNombreColumnaNew] = useState('');
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalMiembrosAbierto, setModalMiembrosAbierto] = useState(false);
  const [elementoAEliminar, setElementoAEliminar] = useState(null);
  const [modalEditarProyectoAbierto, setModalEditarProyectoAbierto] = useState(false);
  const [modalClonarAbierto, setModalClonarAbierto] = useState(false);
  const [nombreClonado, setNombreClonado] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState({ visible: false, tipo: 'error', mensaje: '' });
  const [usuariosInvitables, setUsuariosInvitables] = useState([]);
  const [usuarioAInvitar, setUsuarioAInvitar] = useState('');
  const [cargandoUsuariosInvitables, setCargandoUsuariosInvitables] = useState(false);
  const [invitandoUsuario, setInvitandoUsuario] = useState(false);
  const [removiendoMiembroId, setRemoviendoMiembroId] = useState('');
  const [editProyecto, setEditProyecto] = useState({
    nombre: '',
    descripcion: '',
    estado: 'PLANIFICADO',
    fechaInicio: '',
    fechaFin: '',
    color: '#3bf664de',
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const normalizarId = (valor) => {
    if (!valor) return '';
    if (typeof valor === 'string') return valor;
    if (valor._id) return valor._id.toString();
    if (valor.id) return valor.id.toString();
    return valor.toString ? valor.toString() : '';
  };

  const obtenerMiembrosProyecto = () => {
    return (proyecto?.miembros || [])
      .map((miembro) => {
        const usuarioMiembro = miembro?.usuario ?? miembro;
        const id = normalizarId(usuarioMiembro);
        return {
          id,
          nombre: usuarioMiembro?.nombre || 'Usuario',
          email: usuarioMiembro?.email || 'Sin email',
          rol: miembro?.rol || 'MIEMBRO',
        };
      })
      .filter((m) => Boolean(m.id));
  };

  const esPropietario = (idUsuario) => normalizarId(proyecto?.propietario) === idUsuario;

  const mostrarNotificacion = (mensaje, tipo = 'error') => {
    setNotificacion({ visible: true, tipo, mensaje });
    setTimeout(() => {
      setNotificacion({ visible: false, tipo: 'error', mensaje: '' });
    }, 3500);
  };

  const manejarErrorOperacion = (error, mensajeDefault) => {
    const backendMsg = error?.response?.data?.message;
    const msg = backendMsg || mensajeDefault;

    if (msg.toLowerCase().includes('archivad')) {
      mostrarNotificacion('Este proyecto está ARCHIVADO. Solo lectura: no se permiten cambios.', 'warning');
      return;
    }

    mostrarNotificacion(msg, 'error');
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const [resProyecto, resTareas] = await Promise.all([
        projectService.obtenerPorId(id),
        taskService.obtenerPorProyecto(id),
      ]);

      const data = resProyecto.data?.data || resProyecto.data;
      const proyectoData = data;
      const tableroData = data?.tablero;
      const tareasData = resTareas.data?.data || resTareas.data || [];

      if (!proyectoData) {
        setError('No se pudo cargar el proyecto. Verifica el ID.');
        setCargando(false);
        return;
      }

      if (!tableroData) {
        console.error('Proyecto sin tablero:', proyectoData);
        setError('Este proyecto no tiene un tablero. Contacta al administrador.');
        setCargando(false);
        return;
      }

      // Organizar tareas por columna
      const tareasOrganizadas = {};
      if (tableroData?.columnas) {
        tableroData.columnas.forEach((col) => {
          const columnaId = col.id || col._id;
          tareasOrganizadas[columnaId] = (tareasData || []).filter(
            (t) =>
              t.columna === columnaId ||
              t.columnaId === columnaId ||
              t.columna === String(columnaId) ||
              t.columnaId === String(columnaId)
          );
        });
      }

      setProyecto(proyectoData);
      setTablero(tableroData);
      setTareas(tareasOrganizadas);
    } catch (error) {
      console.error('Error cargando datos:', error);
      const backendMsg = error?.response?.data?.message;
      setError(backendMsg || 'Error al cargar el proyecto. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuariosInvitables = async (proyectoActual = proyecto) => {
    if (usuario?.rol !== 'PROJECT_MANAGER') {
      return;
    }

    try {
      setCargandoUsuariosInvitables(true);
      const response = await authService.obtenerUsuarios();
      const lista = response.data?.usuarios || [];

      const miembrosIds = new Set(
        ((proyectoActual?.miembros || []).map((m) => normalizarId(m?.usuario ?? m))).filter(Boolean)
      );

      const filtrados = lista.filter((u) => {
        const idUsuario = normalizarId(u);
        return idUsuario && !miembrosIds.has(idUsuario);
      });

      setUsuariosInvitables(filtrados);
      setUsuarioAInvitar((prev) => (filtrados.some((u) => normalizarId(u) === prev) ? prev : ''));
    } catch (e) {
      console.error('Error cargando usuarios invitables:', e);
      manejarErrorOperacion(e, 'No se pudo cargar la lista de usuarios para asignar acceso');
    } finally {
      setCargandoUsuariosInvitables(false);
    }
  };

  const handleAsignarAcceso = async () => {
    if (!usuarioAInvitar) {
      mostrarNotificacion('Selecciona un usuario para asignar acceso', 'warning');
      return;
    }

    try {
      setInvitandoUsuario(true);
      const response = await projectService.invitarMiembro(id, usuarioAInvitar, 'MIEMBRO');
      const proyectoActualizado = response.data?.data || response.data;
      if (proyectoActualizado) {
        setProyecto(proyectoActualizado);
      }

      await cargarUsuariosInvitables(proyectoActualizado || proyecto);
      setUsuarioAInvitar('');
      mostrarNotificacion('Acceso asignado correctamente', 'success');
      await cargarDatos();
    } catch (e) {
      console.error('Error asignando acceso al proyecto:', e);
      manejarErrorOperacion(e, 'No se pudo asignar acceso al proyecto');
    } finally {
      setInvitandoUsuario(false);
    }
  };

  const handleQuitarAcceso = async (idMiembro) => {
    if (!idMiembro) return;

    try {
      setRemoviendoMiembroId(idMiembro);
      const response = await projectService.eliminarMiembro(id, idMiembro);
      const proyectoActualizado = response.data?.data || response.data;

      if (proyectoActualizado) {
        setProyecto(proyectoActualizado);
      }

      await cargarUsuariosInvitables(proyectoActualizado || proyecto);
      mostrarNotificacion('Acceso removido correctamente', 'success');
      await cargarDatos();
    } catch (e) {
      console.error('Error removiendo acceso al proyecto:', e);
      manejarErrorOperacion(e, 'No se pudo quitar el acceso del usuario');
    } finally {
      setRemoviendoMiembroId('');
    }
  };

  const handleAgregarTarea = async (idColumna, datosTarea) => {
    try {
      const response = await taskService.crear({
        titulo: datosTarea.titulo,
        descripcion: datosTarea.descripcion || '',
        tipo: datosTarea.tipo || 'TASK',
        prioridad: datosTarea.prioridad || 'MEDIA',
        fechaLimite: datosTarea.fechaLimite || null,
        estimacionHoras: Number(datosTarea.estimacionHoras || 0),
        proyecto: id,
        columna: idColumna,
      });

      setTareas({
        ...tareas,
        [idColumna]: [...(tareas[idColumna] || []), response.data.data],
      });
    } catch (error) {
      console.error('Error creando tarea:', error);
      manejarErrorOperacion(error, 'No se pudo crear la tarea');
    }
  };

  const handleMoverTarea = async (idTarea, idNuevaColumna) => {
    try {
      await taskService.moverAColumna(idTarea, idNuevaColumna);
      cargarDatos();
    } catch (error) {
      console.error('Error moviendo tarea:', error);
      manejarErrorOperacion(error, 'No se pudo mover la tarea');
    }
  };

  const handleActualizarTarea = async (idTarea, datos) => {
    try {
      await taskService.actualizar(idTarea, datos);
      await cargarDatos();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      manejarErrorOperacion(error, 'No se pudo actualizar la tarea');
    }
  };

  const handleAsignarResponsableTarea = async (idTarea, idUsuario) => {
    try {
      await taskService.asignarResponsable(idTarea, idUsuario);
      mostrarNotificacion('Usuario asignado a la tarea correctamente', 'success');
      await cargarDatos();
    } catch (error) {
      console.error('Error asignando responsable a tarea:', error);
      manejarErrorOperacion(error, 'No se pudo asignar el usuario a la tarea');
    }
  };

  const handleQuitarResponsableTarea = async (idTarea, idUsuario) => {
    try {
      await taskService.quitarResponsable(idTarea, idUsuario);
      mostrarNotificacion('Responsable removido de la tarea', 'success');
      await cargarDatos();
    } catch (error) {
      console.error('Error quitando responsable de tarea:', error);
      manejarErrorOperacion(error, 'No se pudo quitar el responsable de la tarea');
    }
  };

  const handleEliminarTarea = async (idTarea) => {
    setElementoAEliminar({ tipo: 'tarea', id: idTarea });
    setModalEliminarAbierto(true);
  };

  const handleEliminarColumna = async (idColumna) => {
    setElementoAEliminar({ tipo: 'columna', id: idColumna });
    setModalEliminarAbierto(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!elementoAEliminar) return;

    try {
      if (elementoAEliminar.tipo === 'columna') {
        await boardService.eliminarColumna(tablero.id || tablero._id, elementoAEliminar.id);
        cargarDatos();
      } else if (elementoAEliminar.tipo === 'tarea') {
        await taskService.eliminar(elementoAEliminar.id);
        cargarDatos();
      } else if (elementoAEliminar.tipo === 'proyecto') {
        await projectService.eliminar(elementoAEliminar.id);
        navigate('/dashboard');
      }
      setModalEliminarAbierto(false);
      setElementoAEliminar(null);
    } catch (error) {
      console.error('Error eliminando:', error);
      manejarErrorOperacion(error, 'No se pudo completar la eliminación');
    }
  };

  const abrirModalEditarProyecto = () => {
    setEditProyecto({
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      estado: proyecto.estado || 'PLANIFICADO',
      fechaInicio: proyecto.fechaInicio ? new Date(proyecto.fechaInicio).toISOString().slice(0, 10) : '',
      fechaFin: proyecto.fechaFin ? new Date(proyecto.fechaFin).toISOString().slice(0, 10) : '',
      color: proyecto.color || '#3B82F6',
    });
    setModalEditarProyectoAbierto(true);
    cargarUsuariosInvitables(proyecto);
  };

  const abrirModalClonar = () => {
    setNombreClonado(proyecto.nombre + ' (Copia)');
    setModalClonarAbierto(true);
  };

  const handleClonarProyecto = async () => {
    try {
      const response = await projectService.clonar(id, nombreClonado.trim());
      const nuevoProyecto = response.data?.data?.proyecto || response.data?.proyecto || response.data;
      const nuevoProyectoId = nuevoProyecto?.id || nuevoProyecto?._id;
      if (nuevoProyecto && nuevoProyectoId) {
        mostrarNotificacion('Proyecto clonado exitosamente', 'success');
        setModalClonarAbierto(false);
        setNombreClonado('');
        // Redirigir al nuevo proyecto
        setTimeout(() => {
          navigate(`/proyecto/${nuevoProyectoId}`);
        }, 300);
      } else {
        mostrarNotificacion('Error al clonar: respuesta inesperada', 'error');
      }
    } catch (e) {
      console.error('Error clonando proyecto:', e);
      manejarErrorOperacion(e, 'No se pudo clonar el proyecto');
    }
  };

  const handleArchivarProyecto = async () => {
    try {
      await projectService.cambiarEstado(id, 'ARCHIVADO');
      mostrarNotificacion('Proyecto archivado exitosamente', 'success');
      navigate('/dashboard');
    } catch (e) {
      console.error('Error archivando proyecto:', e);
      manejarErrorOperacion(e, 'No se pudo archivar el proyecto');
    }
  };

  const handleActualizarProyecto = async (e) => {
    e.preventDefault();
    try {
      const response = await projectService.actualizar(id, {
        ...editProyecto,
        fechaInicio: editProyecto.fechaInicio || null,
        fechaFin: editProyecto.fechaFin || null,
      });

      const proyectoActualizado = response.data?.data || response.data;
      setProyecto(proyectoActualizado);
      setModalEditarProyectoAbierto(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      manejarErrorOperacion(error, 'No se pudo actualizar el proyecto');
    }
  };

  const handleAgregarColumna = async (e) => {
    e.preventDefault();
    if (!nombreColumnaNew.trim()) return;

    try {
      const response = await boardService.crearColumna(id, nombreColumnaNew, 0, '#ddd');
      setModalColumnaAbierto(false);
      setNombreColumnaNew('');
      cargarDatos();
    } catch (error) {
      console.error('Error creando columna:', error);
      manejarErrorOperacion(error, 'No se pudo crear la columna');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await reportService.exportarCSV(id);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando CSV', e);
      manejarErrorOperacion(e, 'No se pudo exportar el reporte CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportService.exportarPDF(id);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando PDF', e);
      manejarErrorOperacion(e, 'No se pudo exportar el reporte PDF');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !proyecto || !tablero) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">{error || 'Proyecto no encontrado'}</p>
            <Button onClick={() => navigate('/dashboard')} variant="primary">
              Volver al Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: tema.bg.primary }}>
      {notificacion.visible && (
        <div className="fixed top-20 right-6 z-[70]">
          <div
            className={`rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${
              notificacion.tipo === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : notificacion.tipo === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <p className="font-semibold text-sm">{notificacion.mensaje}</p>
          </div>
        </div>
      )}

      {/* Tablero Kanban */}
      <div className="pt-[60px]">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
           {/* Navbar Superior */}
           <nav className="fixed top-0 left-0 right-0 h-[60px] z-50" style={{ backgroundColor: '#032F2D' }}>
             <div className="w-full max-w-[1600px] mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
               <div className="flex items-center gap-4">
                 <button
                   onClick={() => navigate('/dashboard')}
                   className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                   title="Volver al dashboard"
                 >
                   <ArrowLeft size={20} />
                   <span className="font-medium">Volver</span>
                 </button>
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                     <span className="text-lg font-bold">T</span>
                   </div>
                   <span className="text-white font-semibold text-lg">TaskFlow</span>
                 </div>
                 <div className="hidden md:flex items-center gap-2 text-white/60 text-sm">
                   <span>{proyecto.nombre}</span>
                   <span className="text-white/40">/</span>
                   <span className="text-white">Tablero Kanban</span>
                 </div>
               </div>

               {/* Menú de acciones del proyecto */}
               <div className="relative">
                 <button
                   onClick={() => setMenuAbierto(!menuAbierto)}
                   className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all duration-200"
                 >
                   <span className="hidden sm:inline">Acciones</span>
                   <ChevronDown size={16} className={menuAbierto ? 'rotate-180' : ''} />
                 </button>

                 {menuAbierto && (
                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setModalColumnaAbierto(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Plus size={16} className="mr-2" />
                    Nueva Columna
                  </button>
                  <button
                    onClick={() => {
                      abrirModalEditarProyecto();
                      setMenuAbierto(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil size={16} className="mr-2" />
                    Editar proyecto
                  </button>
                       <button
                         onClick={() => {
                           abrirModalClonar();
                           setMenuAbierto(false);
                         }}
                         className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       >
                         <Copy size={16} className="mr-2" />
                         Clonar proyecto
                       </button>
                       <button
                         onClick={() => {
                           if (confirm('¿Archivar este proyecto? No aparecerá en la lista principal.')) {
                             handleArchivarProyecto();
                           }
                           setMenuAbierto(false);
                         }}
                         className="w-full flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                       >
                         <Archive size={16} className="mr-2" />
                         Archivar proyecto
                       </button>
                       <button
                         onClick={() => {
                           setElementoAEliminar({ tipo: 'proyecto', id });
                           setModalEliminarAbierto(true);
                           setMenuAbierto(false);
                         }}
                         className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                       >
                         <Trash2 size={16} className="mr-2" />
                         Eliminar proyecto
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </nav>

           {/* Header del Tablero */}
           <header className="pt-[80px] pb-6">
             <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex items-end justify-between">
                 <div>
                   <h1 className="text-3xl font-bold mb-2" style={{ color: '#1F2937' }}>
                     Tablero Kanban
                   </h1>
                   <div className="flex items-center gap-3">
                     <span className="text-sm" style={{ color: '#6B7280' }}>
                       {tablero.columnas?.length || 0} columnas
                     </span>
                     <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCEFE8', color: '#032F2D' }}>
                       {proyecto.estado?.replace('_', ' ')}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#D7E3DD] to-transparent"></div>
             </div>
           </header>

           {/* Columnas con animación */}
           <div className="overflow-x-auto pb-6">
            <div className="flex gap-5 min-w-max p-2">
              {tablero.columnas?.map((columna, index) => {
                const columnaId = columna.id || columna._id;
                return (
                  <div key={columnaId} style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s` }}>
                    <KanbanColumn
                      columna={columna}
                      tareas={tareas[columnaId] || []}
                      miembrosProyecto={obtenerMiembrosProyecto()}
                      onAddTask={handleAgregarTarea}
                      onDeleteColumn={handleEliminarColumna}
                      onTaskMove={handleMoverTarea}
                      onUpdateTask={handleActualizarTarea}
                      onAssignResponsible={handleAsignarResponsableTarea}
                      onRemoveResponsible={handleQuitarResponsableTarea}
                      onDeleteTask={handleEliminarTarea}
                      onRefreshTasks={cargarDatos}
                    />
                  </div>
                );

              })}
            </div>
          </div>
        </div>
      </div>



      {/* Modal agregar columna */}
      <Modal
        isOpen={modalColumnaAbierto}
        onClose={() => setModalColumnaAbierto(false)}
        title="Nueva Columna"
        size="md"
      >
        <form onSubmit={handleAgregarColumna} className="space-y-4">
          <Input
            label="Nombre de la Columna"
            placeholder="Ej: Pruebas"
            value={nombreColumnaNew}
            onChange={(e) => setNombreColumnaNew(e.target.value)}
            required
          />
          <div className="flex space-x-2">
            <Button type="submit" variant="primary" className="flex-1">
              Crear
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalColumnaAbierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmación eliminación */}
      <Modal
        isOpen={modalEliminarAbierto}
        onClose={() => {
          setModalEliminarAbierto(false);
          setElementoAEliminar(null);
        }}
        title="Confirmar eliminación"
      >
        <div className="space-y-6">
          <p className="text-gray-700 text-center">
            {elementoAEliminar?.tipo === 'columna' && '¿Estás seguro de que deseas eliminar esta columna y todas sus tareas?'}
            {elementoAEliminar?.tipo === 'tarea' && '¿Estás seguro de que deseas eliminar esta tarea?'}
            {elementoAEliminar?.tipo === 'proyecto' && '¿Estás seguro de que deseas eliminar este proyecto y todas sus tareas?'}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 text-center">
              Esta acción no se puede deshacer
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setModalEliminarAbierto(false);
                setElementoAEliminar(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarEliminacion}
              variant="danger"
              className="flex-1"
            >
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar proyecto */}
      <Modal
        isOpen={modalEditarProyectoAbierto}
        onClose={() => setModalEditarProyectoAbierto(false)}
        title="Editar proyecto"
        size="lg"
      >
        <form onSubmit={handleActualizarProyecto} className="space-y-4">
          <Input
            label="Nombre"
            value={editProyecto.nombre}
            onChange={(e) => setEditProyecto((prev) => ({ ...prev, nombre: e.target.value }))}
            required
          />

          <div className="mb-4">
            <label className="tf-label">Descripción</label>
            <textarea
              value={editProyecto.descripcion}
              onChange={(e) => setEditProyecto((prev) => ({ ...prev, descripcion: e.target.value }))}
              className="tf-textarea"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tf-label">Estado</label>
              <select
                value={editProyecto.estado}
                onChange={(e) => setEditProyecto((prev) => ({ ...prev, estado: e.target.value }))}
                className="tf-select"
              >
                <option value="PLANIFICADO">PLANIFICADO</option>
                <option value="EN_PROGRESO">EN_PROGRESO</option>
                <option value="PAUSADO">PAUSADO</option>
                <option value="COMPLETADO">COMPLETADO</option>
                <option value="ARCHIVADO">ARCHIVADO</option>
              </select>
            </div>

            <Input
              label="Color"
              type="color"
              value={editProyecto.color}
              onChange={(e) => setEditProyecto((prev) => ({ ...prev, color: e.target.value }))}
              className="h-[42px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha inicio"
              type="date"
              value={editProyecto.fechaInicio}
              onChange={(e) => setEditProyecto((prev) => ({ ...prev, fechaInicio: e.target.value }))}
              className="mb-0"
            />
            <Input
              label="Fecha fin"
              type="date"
              value={editProyecto.fechaFin}
              onChange={(e) => setEditProyecto((prev) => ({ ...prev, fechaFin: e.target.value }))}
              className="mb-0"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" variant="primary" className="flex-1">
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalEditarProyectoAbierto(false)}
            >
              Cancelar
            </Button>
          </div>

          {usuario?.rol === 'PROJECT_MANAGER' && (
            <div className="border-t pt-4 mt-2 space-y-3">
              <h3 className="font-semibold" style={{ color: tema.text.primary }}>
                Asignar acceso al proyecto
              </h3>

              {cargandoUsuariosInvitables ? (
                <div className="py-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="tf-label">Usuarios disponibles (sin ADMIN ni tu usuario)</label>
                    <select
                      value={usuarioAInvitar}
                      onChange={(e) => setUsuarioAInvitar(e.target.value)}
                      className="tf-select"
                    >
                      <option value="">Selecciona un usuario</option>
                      {usuariosInvitables.map((u) => (
                        <option key={normalizarId(u)} value={normalizarId(u)}>
                          {u.nombre} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAsignarAcceso}
                    disabled={invitandoUsuario || !usuarioAInvitar}
                    className="w-full"
                  >
                    {invitandoUsuario ? 'Asignando acceso...' : 'Asignar acceso'}
                  </Button>

                  {usuariosInvitables.length === 0 && (
                    <p className="text-sm" style={{ color: tema.text.secondary }}>
                      No hay usuarios disponibles para asignar en este momento.
                    </p>
                  )}

                  <div className="border border-slate-300 rounded-md p-3 mt-2 bg-slate-50">
                    <p className="text-sm font-semibold mb-2 text-slate-800">
                      Miembros actuales (quitar acceso)
                    </p>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {obtenerMiembrosProyecto().map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {m.nombre}
                            </p>
                            <p className="text-xs font-medium text-slate-600">
                              {m.email}
                            </p>
                          </div>

                          {!esPropietario(m.id) && (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handleQuitarAcceso(m.id)}
                              disabled={removiendoMiembroId === m.id}
                              className="!text-white"
                            >
                              {removiendoMiembroId === m.id ? 'Quitando...' : 'Quitar acceso'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Modal clonar proyecto */}
      <Modal
        isOpen={modalClonarAbierto}
        onClose={() => {
          setModalClonarAbierto(false);
          setNombreClonado('');
        }}
        title="Clonar Proyecto"
        size="md"
      >
        <div className="space-y-4">
          <p style={{ color: tema.text.secondary }}>
            Crea una copia completa de este proyecto con todas sus columnas y tareas.
          </p>
          <Input
            label="Nombre del nuevo proyecto"
            placeholder="Nombre del proyecto clonado"
            value={nombreClonado}
            onChange={(e) => setNombreClonado(e.target.value)}
            required
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalClonarAbierto(false);
                setNombreClonado('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleClonarProyecto}
              disabled={!nombreClonado.trim()}
            >
              Clonar Proyecto
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal miembros */}
      <Modal
        isOpen={modalMiembrosAbierto}
        onClose={() => setModalMiembrosAbierto(false)}
        title="Miembros del proyecto"
        size="md"
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {obtenerMiembrosProyecto().length === 0 && (
            <p className="text-sm" style={{ color: tema.text.secondary }}>
              Este proyecto no tiene miembros.
            </p>
          )}

          {obtenerMiembrosProyecto().map((m) => (
            <div key={m.id} className="border border-slate-200 bg-slate-50 rounded-md p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {m.nombre}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {m.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {esPropietario(m.id) && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    PROPIETARIO
                  </span>
                )}

                {!esPropietario(m.id) && usuario?.rol === 'PROJECT_MANAGER' && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleQuitarAcceso(m.id)}
                    disabled={removiendoMiembroId === m.id}
                    className="!text-white"
                  >
                    {removiendoMiembroId === m.id ? 'Quitando...' : 'Quitar acceso'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;
