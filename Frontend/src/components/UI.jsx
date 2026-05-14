import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const { tema } = useTheme();
  
  const baseStyles = `font-semibold rounded-xl transition-all duration-200 ${
    size === 'sm' ? 'px-3 py-1 text-sm' : 
    size === 'lg' ? 'px-6 py-3 text-lg' : 
    'px-4 py-2 text-base'
  }`;

  const variantStyles = {
    primary: `text-white`,
    secondary: `text-white`,
    danger: `text-white`,
    outline: `border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`,
  };

  const variantBg = {
    primary: '#032F2D',
    secondary: '#235347',
    danger: '#EF4444',
    outline: 'transparent',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ backgroundColor: variantBg[variant] }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, type = 'text', placeholder, className = '', ...props }) => {
  const { tema } = useTheme();
  
  return (
    <div className="mb-4">
      {label && <label className="tf-label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        className={`tf-input w-full ${className}`}
        style={{
          backgroundColor: tema?.colores?.fondo || '#FFFFFF',
          color: tema?.colores?.texto || '#000000',
          border: `1px solid ${tema?.colores?.borde || '#E5E7EB'}`,
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
        }}
        {...props}
      />
    </div>
  );
};

export const Textarea = ({ label, placeholder, className = '', ...props }) => {
  const { tema } = useTheme();

  return (
    <div className="mb-4">
      {label && <label className="tf-label">{label}</label>}
      <textarea
        placeholder={placeholder}
        className={`tf-input w-full min-h-[120px] ${className}`}
        style={{
          backgroundColor: tema?.colores?.fondo || '#FFFFFF',
          color: tema?.colores?.texto || '#000000',
          border: `1px solid ${tema?.colores?.borde || '#E5E7EB'}`,
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          resize: 'vertical',
        }}
        {...props}
      />
    </div>
  );
};

export const Select = ({ label, children, className = '', value, onChange, ...props }) => {
  const { tema } = useTheme();
  
  return (
    <div className="mb-4">
      {label && <label className="tf-label mb-1 block">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`tf-select w-full ${className}`}
        style={{
          backgroundColor: tema?.colores?.fondo || '#FFFFFF',
          color: tema?.colores?.texto || '#000000',
          border: `1px solid ${tema?.colores?.borde || '#E5E7EB'}`,
          borderRadius: '0.375rem',
          padding: '0.5rem 0.75rem',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export const PasswordInput = ({ label, placeholder = '••••••••', className = '', ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      {label && <label className="tf-label">{label}</label>}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className={`tf-input w-full pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 px-3 flex items-center transition"
          style={{ color: '#8CB79B' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#235347'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8CB79B'}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export const Card = ({ children, className = '', ...props }) => {
  const { tema } = useTheme();
  return (
    <div
      className={`rounded-lg shadow-md p-6 border ${className}`}
      style={{ 
        backgroundColor: tema.bg.secondary, 
        color: tema.text.primary,
        borderColor: '#DBF0DD'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'secondary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#032F2D] text-white',
    secondary: 'bg-[#E5E7EB] text-[#1F2937]',
    success: 'bg-[#D1FAE5] text-[#065F46]',
    info: 'bg-[#DBEAFE] text-[#1D4ED8]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C]',
    outline: 'border border-slate-300 bg-white text-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant] || variants.secondary} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(5, 31, 32, 0.6)' }}>
      <div 
        className={`rounded-2xl border shadow-2xl w-full ${sizeClasses[size] || sizeClasses.md}`}
        style={{ backgroundColor: '#F9FAFB', borderColor: '#DBF0DD' }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#DBF0DD' }}>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#051F20' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
            style={{ color: '#8CB79B' }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div 
      className={`${sizes[size]} border-4 rounded-full animate-spin ${className}`}
      style={{ borderColor: '#DBF0DD', borderTopColor: '#235347' }}
    ></div>
  );
};

export default {
  Button,
  Input,
  Select,
  PasswordInput,
  Card,
  Badge,
  Modal,
  Spinner,
};
