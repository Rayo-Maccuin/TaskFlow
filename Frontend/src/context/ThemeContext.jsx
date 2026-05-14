import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * PATRÓN ABSTRACT FACTORY - Temas
 * Define familias de temas con colores coherentes
 */
const THEMES = {
  light: {
    name: 'light',
    bg: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6',
      tertiary: '#E5E7EB',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    colors: {
      primary: '#235347',
      secondary: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  dark: {
    name: 'dark',
    bg: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
    },
    colors: {
      primary: '#8CB79B',
      secondary: '#34D399',
      danger: '#F87171',
      warning: '#FBBF24',
    },
  },
  taskflow: {
    name: 'taskflow',
    bg: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#DBF0DD',
    },
    text: {
      primary: '#051F20',
      secondary: '#173831',
      tertiary: '#235347',
    },
    colors: {
      primary: '#235347',
      secondary: '#8CB79B',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  professional: {
    name: 'professional',
    bg: {
      primary: '#F8FAFC',
      secondary: '#FFFFFF',
      tertiary: '#E2E8F0',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
    },
    colors: {
      primary: '#1E40AF',
      secondary: '#7C3AED',
      danger: '#DC2626',
      warning: '#D97706',
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [tema, setTema] = useState(() => {
    const temaPredefinido = localStorage.getItem('tema') || 'taskflow';
    return THEMES[temaPredefinido];
  });

  const [nombreTema, setNombreTema] = useState(() => {
    return localStorage.getItem('tema') || 'taskflow';
  });

  const cambiarTema = (nuevoTema) => {
    if (THEMES[nuevoTema]) {
      setTema(THEMES[nuevoTema]);
      setNombreTema(nuevoTema);
      localStorage.setItem('tema', nuevoTema);
    }
  };

  const obtenerTemasDisponibles = () => {
    return Object.keys(THEMES);
  };

  const value = {
    tema,
    nombreTema,
    cambiarTema,
    obtenerTemasDisponibles,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

export default ThemeContext;
