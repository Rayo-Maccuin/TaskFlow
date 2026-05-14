import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [cargando, setCargando] = useState(true);

  // Recuperar usuario del localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado && token) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, [token]);

  const login = (token, usuarioData) => {
    setToken(token);
    setUsuario(usuarioData);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  const actualizarUsuario = (datosActualizados) => {
    const usuarioActualizado = { ...usuario, ...datosActualizados };
    setUsuario(usuarioActualizado);
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
  };

  const value = {
    usuario,
    token,
    cargando,
    login,
    logout,
    actualizarUsuario,
    estaAutenticado: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
