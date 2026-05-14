import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutGrid, 
  FolderKanban, 
  CheckSquare, 
  BarChart3, 
  History, 
  User, 
  Settings,
  LogOut,
  Bell,
  Shield,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import Avvvatars from 'avvvatars-react';
import { notificationService } from '../services/apiService';

export const Navbar = () => {
  const { usuario, logout } = useAuth();
  const { nombreTema } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifAbiertas, setNotifAbiertas] = useState(false);
  const [menuUserAbierto, setMenuUserAbierto] = useState(false);
  const [mobileMenuAbierto, setMobileMenuAbierto] = useState(false);
  
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Calcular notificaciones no leídas
  const noLeidas = Array.isArray(notificaciones)
    ? notificaciones.filter((n) => !n.leida).length
    : 0;

  // Función para cerrar todos los menús
  const cerrarMenus = () => {
    setMenuAbierto(false);
    setMenuUserAbierto(false);
    setNotifAbiertas(false);
    setMobileMenuAbierto(false);
  };

  const handleLogout = () => {
    logout();
    cerrarMenus();
    navigate('/login');
  };

  const esAdmin = usuario?.rol === 'ADMIN';
  const esProjectManager = usuario?.rol === 'PROJECT_MANAGER' || esAdmin;

  // Extraer el ID del proyecto actual desde la URL (si está en /proyecto/:id/...)
  const extraerProyectoId = () => {
    const match = location.pathname.match(/^\/proyecto\/([^\/]+)/);
    return match ? match[1] : null;
  };
  const proyectoId = extraerProyectoId();

  const navLinks = [
    { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard', roles: null },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos', roles: null },
    { to: '/tareas', icon: CheckSquare, label: 'Tareas', roles: null },
    { 
      to: proyectoId ? `/proyecto/${proyectoId}/reportes` : '/reportes', 
      icon: BarChart3, 
      label: 'Reportes', 
      roles: null 
    },
    { 
      to: proyectoId ? `/proyecto/${proyectoId}/historial` : '/historial', 
      icon: History, 
      label: 'Historial', 
      roles: null 
    },
    ...(esProjectManager ? [{ to: '/admin/usuarios', icon: Shield, label: 'Admin', roles: ['ADMIN', 'PROJECT_MANAGER'] }] : []),
  ];

  return (
    <nav className="shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#062F2E' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2" onClick={cerrarMenus}>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block" style={{ color: '#FFFFFF' }}>TaskFlow</span>
          </Link>

          {/* Navegación Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={cerrarMenus}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname.startsWith(link.to)
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                title={link.label}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Sección derecha - Notificaciones y Usuario */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifAbiertas(!notifAbiertas);
                  setMenuUserAbierto(false);
                }}
                className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Notificaciones"
              >
                <Bell size={20} />
                {noLeidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full min-w-[18px]">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {notifAbiertas && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    {noLeidas > 0 && (
                      <button
                        onClick={async () => {
                          await Promise.all(
                            notificaciones
                              .filter(n => !n.leida)
                              .map(n => notificationService.marcarComoLeida(n._id))
                          );
                          setNotificaciones(prev => 
                            Array.isArray(prev) 
                              ? prev.map(n => ({ ...n, leida: true }))
                              : prev
                          );
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  {!Array.isArray(notificaciones) || notificaciones.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay notificaciones
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notificaciones.slice(0, 20).map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.leida ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => marcarLeida(notif._id)}
                        >
                          <p className="text-sm text-gray-800 line-clamp-2">{notif.mensaje || notif.message || 'Notificación'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.fecha || notif.createdAt || Date.now()).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setMenuUserAbierto(!menuUserAbierto);
                  setNotifAbiertas(false);
                }}
                className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <Avvvatars value={usuario?.email || usuario?.nombre || 'user'} size={32} />
                <span className="hidden md:inline font-medium text-sm max-w-[100px] truncate">
                  {usuario?.nombre?.split(' ')[0] || 'Usuario'}
                </span>
                <ChevronDown size={16} className={`transform transition-transform ${menuUserAbierto ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menú */}
              {menuUserAbierto && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{usuario?.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{usuario?.email}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{usuario?.rol?.toLowerCase()}</p>
                    </div>
                    
                    <Link
                      to="/perfil"
                      onClick={cerrarMenus}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User size={16} className="mr-2" />
                      Mi Perfil
                    </Link>
                    
                    {esAdmin && (
                      <Link
                        to="/admin/usuarios"
                        onClick={cerrarMenus}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Shield size={16} className="mr-2" />
                        Administración
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menú hamburguesa móvil */}
            <button
              onClick={() => setMobileMenuAbierto(!mobileMenuAbierto)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            >
              {mobileMenuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuAbierto && (
          <div className="md:hidden border-t border-white/10 py-2">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={cerrarMenus}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                    location.pathname.startsWith(link.to)
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
