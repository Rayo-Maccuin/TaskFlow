import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/apiService';
import { Button, Input, PasswordInput, Spinner } from '../components/UI';
import { AlertCircle, CheckCircle, LayoutGrid } from 'lucide-react';

export const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('DEVELOPER');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      setCargando(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setCargando(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setCargando(false);
      return;
    }

    try {
      const response = await authService.registro(nombre, email, password, confirmPassword, rol);
      setExito('¡Registro exitoso! Redirigiendo al login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="rounded-2xl shadow-2xl p-8 w-full max-w-md border" style={{ backgroundColor: '#F9FAFB', borderColor: '#DBF0DD' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: '#235347' }}>
            <LayoutGrid size={28} style={{ color: '#DBF0DD' }} />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]" style={{ color: '#051F20' }}>TaskFlow</h1>
          <p style={{ color: '#173831' }}>Crea tu cuenta</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 rounded-lg p-4" style={{ backgroundColor: '#FFE5E5', borderLeft: '4px solid #EF4444', color: '#991B1B' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {exito && (
            <div className="flex items-center space-x-2 rounded-lg p-4" style={{ backgroundColor: '#DBF0DD', borderLeft: '4px solid #235347', color: '#051F20' }}>
              <CheckCircle size={20} />
              <span>{exito}</span>
            </div>
          )}

          <Input
            label="Nombre Completo"
            type="text"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="mb-4">
            <label className="tf-label">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="tf-input w-full"
              style={{ appearance: 'none', paddingRight: '2.5rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23235347' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.9rem center', backgroundSize: '12px' }}
            >
              <option value="DEVELOPER">Desarrollador</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full flex items-center justify-center space-x-2"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <Spinner size="sm" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Crear Cuenta</span>
            )}
          </Button>
        </form>

        {/* Link a login */}
        <p className="text-center mt-6" style={{ color: '#173831' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: '#235347' }}>
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;