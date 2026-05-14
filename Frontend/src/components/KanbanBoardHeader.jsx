import React from 'react';
import { ArrowLeft, Plus, LayoutGrid } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const KanbanBoardHeader = ({ proyecto, onBack, onAddColumn, columnasCount }) => {
  const { tema } = useTheme();
  
  return (
    <>
      {/* Navbar Superior */}
      <nav className="fixed top-0 left-0 right-0 h-[60px] z-50" style={{ backgroundColor: '#032F2D' }}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              title="Volver al dashboard"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Volver</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <LayoutGrid size={18} className="text-white" />
              </div>
              <span className="text-white font-semibold text-lg">TaskFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-white/60 text-sm">
              <span>{proyecto?.nombre}</span>
              <span className="text-white/40">/</span>
              <span className="text-white">Tablero Kanban</span>
            </div>
          </div>

          <button
            onClick={onAddColumn}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all duration-200"
          >
            <Plus size={18} />
            <span>Nueva Columna</span>
          </button>
        </div>
      </nav>

      {/* Header del Tablero */}
      <header className="pt-[80px] pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1F2937' }}>
              Tablero Kanban
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#6B7280' }}>
                {columnasCount} columnas
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCEFE8', color: '#032F2D' }}>
                {proyecto?.estado?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#D7E3DD] to-transparent"></div>
      </header>
    </>
  );
};

export default KanbanBoardHeader;