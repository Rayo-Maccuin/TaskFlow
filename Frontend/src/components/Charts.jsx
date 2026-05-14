import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Target, Clock, CheckCircle2 } from 'lucide-react';
import { chartService } from '../services/apiService';
import { Button, Card, Select, Badge, Spinner } from './UI';

export const Charts = ({ proyectoId }) => {
  const [datosGraficos, setDatosGraficos] = useState({
    burndown: [],
    velocity: [],
    distribucionEstados: [],
    tiempoPromedio: [],
    productividadSemanal: []
  });
  const [cargando, setCargando] = useState(false);
  const [periodo, setPeriodo] = useState('30d'); // 7d, 30d, 90d, 1y
  const [tipoGrafico, setTipoGrafico] = useState('burndown');

  useEffect(() => {
    cargarDatosGraficos();
  }, [proyectoId, periodo]);

  const cargarDatosGraficos = async () => {
    try {
      setCargando(true);
      const response = await chartService.obtenerDatosGraficos(proyectoId, periodo);
      setDatosGraficos(response.data);
    } catch (error) {
      console.error('Error cargando datos gráficos:', error);
    } finally {
      setCargando(false);
    }
  };

  const calcularProgresoIdeal = (totalDias, totalTareas) => {
    const puntosPorDia = totalTareas / totalDias;
    const puntos = [];

    for (let dia = 0; dia <= totalDias; dia++) {
      puntos.push({
        dia,
        tareasRestantes: Math.max(0, totalTareas - (dia * puntosPorDia))
      });
    }

    return puntos;
  };

  const calcularVelocityPromedio = () => {
    if (datosGraficos.velocity.length === 0) return 0;
    const total = datosGraficos.velocity.reduce((sum, v) => sum + v.tareasCompletadas, 0);
    return (total / datosGraficos.velocity.length).toFixed(1);
  };

  const calcularTiempoPromedioResolucion = () => {
    if (datosGraficos.tiempoPromedio.length === 0) return 0;
    const total = datosGraficos.tiempoPromedio.reduce((sum, t) => sum + t.horas, 0);
    return (total / datosGraficos.tiempoPromedio.length).toFixed(1);
  };

  const renderizarBurndownChart = () => {
    const totalTareas = datosGraficos.burndown.length > 0 ? datosGraficos.burndown[0].tareasRestantes + datosGraficos.burndown[datosGraficos.burndown.length - 1].tareasCompletadas : 0;
    const diasTotales = 30; // Asumiendo sprint de 30 días
    const lineaIdeal = calcularProgresoIdeal(diasTotales, totalTareas);

    const maxTareas = Math.max(...datosGraficos.burndown.map(d => d.tareasRestantes), ...lineaIdeal.map(d => d.tareasRestantes));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Burndown Chart</h3>
          <Badge variant="info">Sprint de {diasTotales} días</Badge>
        </div>

        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <svg className="w-full h-full" viewBox={`0 0 ${diasTotales + 2} ${maxTareas + 2}`}>
            {/* Línea ideal */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              points={lineaIdeal.map(p => `${p.dia + 1},${maxTareas - p.tareasRestantes + 1}`).join(' ')}
            />

            {/* Línea real */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              points={datosGraficos.burndown.map((p, i) => `${i + 1},${maxTareas - p.tareasRestantes + 1}`).join(' ')}
            />

            {/* Puntos de datos */}
            {datosGraficos.burndown.map((p, i) => (
              <circle
                key={i}
                cx={i + 1}
                cy={maxTareas - p.tareasRestantes + 1}
                r="3"
                fill="#3b82f6"
              />
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Progreso Real</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-dashed border-t"></div>
            <span>Línea Ideal</span>
          </div>
        </div>
      </div>
    );
  };

  const renderizarVelocityChart = () => {
    const maxVelocity = Math.max(...datosGraficos.velocity.map(v => v.tareasCompletadas), 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Velocity Chart</h3>
          <Badge variant="success">Promedio: {calcularVelocityPromedio()} tareas/sprint</Badge>
        </div>

        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-end justify-between h-full gap-1">
            {datosGraficos.velocity.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${(v.tareasCompletadas / maxVelocity) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 transform -rotate-45 origin-top-left">
                  Sprint {v.sprint}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderizarDistribucionEstados = () => {
    const total = datosGraficos.distribucionEstados.reduce((sum, e) => sum + e.cantidad, 0);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Distribución por Estados</h3>

        <div className="space-y-3">
          {datosGraficos.distribucionEstados.map((estado, i) => {
            const porcentaje = total > 0 ? (estado.cantidad / total) * 100 : 0;
            const colores = {
              'PENDIENTE': 'bg-gray-500',
              'EN_PROGRESO': 'bg-blue-500',
              'EN_REVISION': 'bg-yellow-500',
              'COMPLETADA': 'bg-green-500'
            };

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium">{estado.estado}</div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${colores[estado.estado] || 'bg-gray-500'}`}
                    style={{ width: `${porcentaje}%` }}
                  ></div>
                </div>
                <div className="w-16 text-sm text-right">
                  {estado.cantidad} ({porcentaje.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderizarProductividadSemanal = () => {
    const maxProductividad = Math.max(...datosGraficos.productividadSemanal.map(p => p.tareasCompletadas), 0);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Productividad Semanal</h3>

        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-end justify-between h-full gap-2">
            {datosGraficos.productividadSemanal.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t mb-2 transition-all duration-300 hover:bg-green-600"
                    style={{ height: `${(p.tareasCompletadas / maxProductividad) * 120}px` }}
                  ></div>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${(p.tareasCreadas / maxProductividad) * 120}px` }}
                  ></div>
                </div>
                <span className="text-xs mt-2">Sem {p.semana}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Tareas Completadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Tareas Creadas</span>
          </div>
        </div>
      </div>
    );
  };

  const renderizarTiempoPromedio = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tiempo Promedio de Resolución</h3>
          <Badge variant="warning">{calcularTiempoPromedioResolucion()}h promedio</Badge>
        </div>

        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-end justify-between h-full gap-1">
            {datosGraficos.tiempoPromedio.map((t, i) => {
              const maxHoras = Math.max(...datosGraficos.tiempoPromedio.map(tp => tp.horas));
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                    style={{ height: `${(t.horas / maxHoras) * 100}%` }}
                  ></div>
                  <span className="text-xs mt-2 transform -rotate-45 origin-top-left">
                    {t.tipo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderizarGrafico = () => {
    switch (tipoGrafico) {
      case 'burndown':
        return renderizarBurndownChart();
      case 'velocity':
        return renderizarVelocityChart();
      case 'distribucion':
        return renderizarDistribucionEstados();
      case 'productividad':
        return renderizarProductividadSemanal();
      case 'tiempo':
        return renderizarTiempoPromedio();
      default:
        return renderizarBurndownChart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Gráficos y Métricas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Visualiza el progreso y rendimiento del proyecto</p>
        </div>

        <div className="flex gap-2">
          <Select value={periodo} onChange={(value) => setPeriodo(value)}>
            <option value="7d">Última semana</option>
            <option value="30d">Último mes</option>
            <option value="90d">Últimos 3 meses</option>
            <option value="1y">Último año</option>
          </Select>

          <Select value={tipoGrafico} onChange={(value) => setTipoGrafico(value)}>
            <option value="burndown">Burndown</option>
            <option value="velocity">Velocity</option>
            <option value="distribucion">Estados</option>
            <option value="productividad">Productividad</option>
            <option value="tiempo">Tiempo</option>
          </Select>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{calcularVelocityPromedio()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Velocity Promedio</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{calcularTiempoPromedioResolucion()}h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">
                {datosGraficos.distribucionEstados.find(e => e.estado === 'COMPLETADA')?.cantidad || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tareas Completadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">
                {datosGraficos.productividadSemanal.length > 0 ?
                  datosGraficos.productividadSemanal[datosGraficos.productividadSemanal.length - 1].tareasCompletadas : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Esta Semana</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card className="p-6">
        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          renderizarGrafico()
        )}
      </Card>
    </div>
  );
};