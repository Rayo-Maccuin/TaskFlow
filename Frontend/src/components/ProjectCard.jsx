import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Users, Calendar, Trash2 } from 'lucide-react';
import { Button } from './UI';

export const ProjectCard = ({ proyecto, progreso, onDelete }) => {
  const { tema } = useTheme();
  const estadoColores = {
    PLANIFICADO: { bg: '#DBF0DD', text: '#173831' },
    EN_PROGRESO: { bg: '#235347', text: '#DBF0DD' },
    PAUSADO: { bg: '#FCD34D', text: '#92400E' },
    COMPLETADO: { bg: '#8CB79B', text: '#051F20' },
    ARCHIVADO: { bg: '#051F20', text: '#8CB79B' },
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const proyectoId = proyecto.id || proyecto._id;
  
  // Usar progreso desde la prop o desde el objeto proyecto
  const porcentajeProgreso = progreso !== undefined ? progreso : (proyecto.progreso || 0);

  return (
    <Link to={`/proyecto/${proyectoId}`}>
      <div
        className="rounded-2xl shadow-md p-0 hover:shadow-2xl transition-all duration-300 cursor-pointer h-full overflow-hidden group border"
        style={{
          backgroundColor: tema.bg.secondary,
          color: tema.text.primary,
          borderColor: '#DBF0DD',
        }}
      >
        <div
          className="h-2 w-full"
          style={{ background: `linear-gradient(90deg, #235347, #8CB79B)` }}
        />

        <div className="p-6">
          <div className="flex justify-between items-start mb-4 gap-3">
            <h3 className="text-xl font-bold leading-tight group-hover:translate-x-1 transition-transform duration-300">
              {proyecto.nombre}
            </h3>
            <span 
              className="text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
              style={{ 
                backgroundColor: estadoColores[proyecto.estado]?.bg || '#DBF0DD',
                color: estadoColores[proyecto.estado]?.text || '#173831'
              }}
            >
              {proyecto.estado}
            </span>
          </div>

          <p className="text-sm mb-5 line-clamp-2 min-h-[40px]" style={{ color: tema.text.secondary }}>
            {proyecto.descripcion || 'Sin descripción'}
          </p>

          <div className="space-y-3 text-sm mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DBF0DD', color: '#235347' }}>
                <Users size={14} />
              </div>
              <span className="font-medium">{proyecto.miembros?.length || 0} miembros</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8CB79B', color: '#051F20' }}>
                <Calendar size={14} />
              </div>
              <span>{formatDate(proyecto.createdAt)}</span>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: tema.text.secondary }}>
                Progreso
              </span>
              <span className="text-xs font-bold" style={{ color: '#235347' }}>
                {porcentajeProgreso}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#DBF0DD' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${porcentajeProgreso}%`,
                  backgroundColor: porcentajeProgreso === 100 ? '#10B981' : '#235347',
                }}
              />
            </div>
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(proyectoId);
              }}
              className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 transition-all duration-200 flex items-center space-x-2 text-sm px-3 py-2 rounded-lg"
            >
              <Trash2 size={15} />
              <span>Eliminar proyecto</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;