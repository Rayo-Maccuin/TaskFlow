import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import ReportesPage from './pages/ReportesPage';
import HistorialPage from './pages/HistorialPage';
import RedirectToFirstProject from './components/RedirectToFirstProject';

import './index.css';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />

            {/* Rutas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <DashboardPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyecto/:id"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <ProjectPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <ProfilePage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <AdminUsersPage />
                  </div>
                </ProtectedRoute>
              }
            />
            {/* Rutas de redirección */}
            <Route
              path="/proyectos"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/tareas"
              element={
                <ProtectedRoute>
                  <RedirectToFirstProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <ReportesPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/historial"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <HistorialPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyecto/:id/reportes"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <ReportesPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyecto/:id/historial"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <HistorialPage />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Ruta por defecto - redirige a dashboard si está autenticado */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
