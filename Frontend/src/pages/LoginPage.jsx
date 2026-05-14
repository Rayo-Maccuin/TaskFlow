import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/apiService';
import { Button, Input, PasswordInput, Spinner } from '../components/UI';
import { AlertCircle, CheckCircle, LayoutGrid } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await authService.login(email, password);
      const { token, usuario } = response.data;

      login(token, usuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
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
          <p style={{ color: '#173831' }}>Plataforma de Gestion Colaborativa</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 rounded-lg p-4" style={{ backgroundColor: '#FFE5E5', borderLeft: '4px solid #EF4444', color: '#991B1B' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

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

          <Button
            type="submit"
            variant="primary"
            className="w-full flex items-center justify-center space-x-2"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <Spinner size="sm" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </Button>
        </form>

        {/* Link a registro */}
        <p className="text-center mt-6" style={{ color: '#173831' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold hover:underline" style={{ color: '#235347' }}>
            Regístrate aquí
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;