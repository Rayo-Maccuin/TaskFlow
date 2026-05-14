import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI';

export const ProtectedRoute = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
