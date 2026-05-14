import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, X, Calendar, User, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { searchService } from '../services/apiService';
import { Button, Card, Input, Select, Badge, Spinner } from './UI';

export const SearchFilters = ({ proyectoId, onResultadosChange, onFiltrosChange }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    responsables: [],
    etiquetas: [],
    prioridad: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    columna: '',
    completada: '',
    ordenarPor: 'updatedAt',
    ordenDireccion: 'DESC'
  });
  const [filtrosGuardados, setFiltrosGuardados] = useState([]);
  const [modalGuardarAbierto, setModalGuardarAbierto] = useState(false);
  const [nombreFiltro, setNombreFiltro] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    cargarFiltrosGuardados();
  }, [proyectoId]);

  const cargarFiltrosGuardados = async () => {
    try {
      const response = await searchService.obtenerFiltrosGuardados(proyectoId);
      setFiltrosGuardados(response.data);
    } catch (error) {
      console.error('Error cargando filtros guardados:', error);
    }
  };

  const ejecutarBusqueda = async () => {
    try {
      setCargando(true);
      let response;

      if (busqueda.trim()) {
        // Búsqueda por texto
        response = await searchService.buscarTareas(busqueda, proyectoId);
      } else {
        // Filtrado avanzado
        response = await searchService.filtrarTareas({
          ...filtros,
          proyectoId,
          limite: 100
        });
      }

      setResultados(response.data);
      onResultadosChange && onResultadosChange(response.data);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltroGuardado = async (filtroId) => {
    try {
      const response = await searchService.aplicarFiltroGuardado(filtroId);
      setFiltros(response.data.filtros || {});
      setResultados(response.data.tareas);
      onResultadosChange && onResultadosChange(response.data.tareas);
      onFiltrosChange && onFiltrosChange(response.data.filtros || {});
    } catch (error) {
      console.error('Error aplicando filtro guardado:', error);
    }
  };

  const guardarFiltro = async () => {
    if (!nombreFiltro.trim()) return;

    try {
      await searchService.guardarFiltro(nombreFiltro, filtros, proyectoId);
      setModalGuardarAbierto(false);
      setNombreFiltro('');
      cargarFiltrosGuardados();
    } catch (error) {
      console.error('Error guardando filtro:', error);
    }
  };

  const eliminarFiltro = async (filtroId) => {
    try {
      await searchService.eliminarFiltro(filtroId);
      cargarFiltrosGuardados();
    } catch (error) {
      console.error('Error eliminando filtro:', error);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      responsables: [],
      etiquetas: [],
      prioridad: '',
      tipo: '',
      fechaDesde: '',
      fechaHasta: '',
      columna: '',
      completada: '',
      ordenarPor: 'updatedAt',
      ordenDireccion: 'DESC'
    });
    setBusqueda('');
    setResultados([]);
    onResultadosChange && onResultadosChange([]);
    onFiltrosChange && onFiltrosChange({});
  };

  const tieneFiltrosActivos = () => {
    return busqueda.trim() ||
           filtros.responsables.length > 0 ||
           filtros.etiquetas.length > 0 ||
           filtros.prioridad ||
           filtros.tipo ||
           filtros.fechaDesde ||
           filtros.fechaHasta ||
           filtros.columna ||
           filtros.completada;
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar tareas por título o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && ejecutarBusqueda()}
            />
          </div>
          <Button onClick={ejecutarBusqueda} disabled={cargando}>
            {cargando ? <Spinner size="sm" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Filtros avanzados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={filtros.prioridad}
            onChange={(value) => setFiltros(prev => ({ ...prev, prioridad: value }))}
          >
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </Select>

          <Select
            value={filtros.tipo}
            onChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}
          >
            <option value="">Todos los tipos</option>
            <option value="TASK">Tarea</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
            <option value="IMPROVEMENT">Mejora</option>
          </Select>

          <Select
            value={filtros.completada}
            onChange={(value) => setFiltros(prev => ({ ...prev, completada: value }))}
          >
            <option value="">Todos los estados</option>
            <option value="false">Pendientes</option>
            <option value="true">Completadas</option>
          </Select>

          <Select
            value={filtros.ordenarPor}
            onChange={(value) => setFiltros(prev => ({ ...prev, ordenarPor: value }))}
          >
            <option value="updatedAt">Última modificación</option>
            <option value="titulo">Título</option>
            <option value="prioridad">Prioridad</option>
            <option value="fechaLimite">Fecha límite</option>
            <option value="createdAt">Fecha creación</option>
          </Select>
        </div>

        {/* Rango de fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha desde
            </label>
            <Input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha hasta
            </label>
            <Input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={ejecutarBusqueda}
            disabled={cargando}
          >
            <Filter className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>

          {tieneFiltrosActivos() && (
            <Button variant="ghost" onClick={limpiarFiltros}>
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setModalGuardarAbierto(true)}
            disabled={!tieneFiltrosActivos()}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Filtro
          </Button>
        </div>

        {/* Filtros guardados */}
        {filtrosGuardados.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Filtros guardados:</h4>
            <div className="flex flex-wrap gap-2">
              {filtrosGuardados.map((filtro) => (
                <div key={filtro.id} className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => aplicarFiltroGuardado(filtro.id)}
                    className="text-xs"
                  >
                    {filtro.nombre}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarFiltro(filtro.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {resultados.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">
              Resultados ({resultados.length} tareas):
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resultados.map((tarea) => (
                <div key={tarea.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {tarea.completada ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <div>
                      <h5 className="font-medium">{tarea.titulo}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Badge variant={
                          tarea.prioridad === 'URGENTE' ? 'danger' :
                          tarea.prioridad === 'ALTA' ? 'warning' :
                          tarea.prioridad === 'MEDIA' ? 'info' : 'secondary'
                        }>
                          {tarea.prioridad}
                        </Badge>
                        <span>{tarea.tipo}</span>
                        {tarea.fechaLimite && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tarea.fechaLimite).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver detalles
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para guardar filtro */}
      {modalGuardarAbierto && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setModalGuardarAbierto(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">Guardar Filtro</h3>
                <Button variant="ghost" size="sm" onClick={() => setModalGuardarAbierto(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del filtro
                  </label>
                  <Input
                    value={nombreFiltro}
                    onChange={(e) => setNombreFiltro(e.target.value)}
                    placeholder="Ej: Tareas urgentes pendientes"
                    onKeyPress={(e) => e.key === 'Enter' && guardarFiltro()}
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setModalGuardarAbierto(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={guardarFiltro} disabled={!nombreFiltro.trim()} className="flex-1">
                  Guardar
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </Card>
  );
};