import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/apiService';
import { Spinner } from '../components/UI';

export const RedirectToFirstProject = ({ ruta = '' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      try {
        const response = await projectService.obtenerMisProyectos();
        const proyectos = response.data?.data || [];
        if (proyectos.length > 0) {
          const id = proyectos[0].id || proyectos[0]._id;
          const path = ruta ? `/proyecto/${id}/${ruta}` : `/proyecto/${id}`;
          navigate(path);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error redirigiendo:', error);
        navigate('/dashboard');
      }
    };
    redirect();
  }, [navigate, ruta]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
};

export default RedirectToFirstProject;
