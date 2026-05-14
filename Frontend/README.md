# 🚀 TaskFlow - Frontend

Frontend moderno y responsivo para TaskFlow, una plataforma de gestión de tareas colaborativa.

## 📋 Tecnologías

- **React** 18.2.0 - Librería de UI
- **Vite** 4.4.9 - Build tool y dev server
- **Tailwind CSS** 3.3.3 - Estilos CSS
- **React Router** 6.16.0 - Enrutamiento
- **Axios** 1.5.0 - Cliente HTTP
- **Lucide React** - Iconos

## 🛠️ Instalación

### 1. Instalar Dependencias

```bash
cd Frontend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz de Frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 4. Build para Producción

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
Frontend/
├── src/
│   ├── components/
│   │   ├── UI.jsx           # Componentes reutilizables
│   │   ├── Navbar.jsx       # Navegación
│   │   ├── ProjectCard.jsx  # Tarjeta de proyecto
│   │   ├── KanbanColumn.jsx # Columna del tablero
│   │   └── ProtectedRoute.jsx # Rutas protegidas
│   ├── pages/
│   │   ├── LoginPage.jsx    # Login
│   │   ├── RegisterPage.jsx # Registro
│   │   ├── DashboardPage.jsx # Dashboard principal
│   │   ├── ProjectPage.jsx  # Tablero Kanban
│   │   └── ProfilePage.jsx  # Perfil de usuario
│   ├── services/
│   │   └── apiService.js    # Integración con Backend
│   ├── context/
│   │   ├── AuthContext.jsx   # Contexto de autenticación
│   │   └── ThemeContext.jsx  # Contexto de temas (Abstract Factory)
│   ├── patterns/
│   │   └── (Implementaciones de patrones)
│   ├── App.jsx              # Componente raíz
│   ├── main.jsx             # Punto de entrada
│   └── index.css            # Estilos globales
├── index.html               # HTML base
├── vite.config.js           # Configuración Vite
├── tailwind.config.js       # Configuración Tailwind
├── postcss.config.js        # Configuración PostCSS
├── package.json             # Dependencias
├── .env                     # Variables de entorno
└── README.md                # Este archivo
```

## 🎨 Características

### Autenticación
- ✅ Registro de usuarios
- ✅ Login con JWT
- ✅ Persistencia de sesión
- ✅ Cambio de contraseña

### Dashboard
- ✅ Vista general de proyectos
- ✅ Estadísticas de proyectos
- ✅ Crear nuevos proyectos
- ✅ Gestión de proyectos

### Tablero Kanban
- ✅ Columnas personalizables
- ✅ Drag & drop de tareas
- ✅ Crear tareas
- ✅ Visualización de tareas

### Perfil de Usuario
- ✅ Editar información
- ✅ Cambiar avatar
- ✅ Actualizar descripción
- ✅ Gestión de contraseña

### Temas (Abstract Factory)
- ✅ Tema Claro
- ✅ Tema Oscuro
- ✅ Tema Profesional
- ✅ Persistencia de tema

## 🔐 Autenticación

El frontend usa JWT (JSON Web Tokens) almacenados en localStorage para autenticación.

```javascript
// Los tokens se envían automáticamente en el header Authorization
Authorization: Bearer <token>
```

El interceptor de Axios redirige al login si el token expira (401).

## 🎯 Componentes Principales

### Button
```jsx
<Button variant="primary" size="md">
  Crear Proyecto
</Button>
```

### Input
```jsx
<Input
  label="Email"
  type="email"
  placeholder="tu@email.com"
/>
```

### Card
```jsx
<Card>
  <p>Contenido de la tarjeta</p>
</Card>
```

### Modal
```jsx
<Modal isOpen={true} title="Título">
  {/* Contenido */}
</Modal>
```

### KanbanColumn
```jsx
<KanbanColumn
  columna={columnaData}
  tareas={tareasDelUsuario}
  onAddTask={handleAgregarTarea}
  onTaskMove={handleMoverTarea}
/>
```

## 🌈 Sistema de Temas (Abstract Factory)

El ThemeContext implementa el patrón Abstract Factory para crear familias coherentes de colores:

```javascript
// Dark Theme
{
  bg: { primary: '#111827', secondary: '#1F2937', ... },
  text: { primary: '#F3F4F6', secondary: '#D1D5DB', ... },
  colors: { primary: '#60A5FA', secondary: '#34D399', ... }
}

// Light Theme
{
  bg: { primary: '#FFFFFF', secondary: '#F3F4F6', ... },
  text: { primary: '#1F2937', secondary: '#6B7280', ... },
  colors: { primary: '#3B82F6', secondary: '#10B981', ... }
}

// Professional Theme
{
  bg: { primary: '#F8FAFC', secondary: '#FFFFFF', ... },
  text: { primary: '#0F172A', secondary: '#475569', ... },
  colors: { primary: '#1E40AF', secondary: '#7C3AED', ... }
}
```

### Usar el Tema

```javascript
import { useTheme } from './context/ThemeContext';

const MiComponente = () => {
  const { tema, cambiarTema } = useTheme();
  
  return (
    <div style={{ backgroundColor: tema.bg.primary }}>
      Contenido
    </div>
  );
};
```

## 📡 Servicios API

### AuthService
```javascript
authService.registro(nombre, email, password, confirmPassword)
authService.login(email, password)
authService.obtenerPerfil()
authService.actualizarPerfil(datos)
authService.cambiarPassword(actual, nueva, confirmada)
```

### ProjectService
```javascript
projectService.crear(nombre, descripcion)
projectService.obtenerMisProyectos()
projectService.obtenerPorId(id)
projectService.actualizar(id, datos)
projectService.eliminar(id)
projectService.invitarMiembro(idProyecto, idUsuario, rol)
```

### TaskService
```javascript
taskService.crear(datosTarea)
taskService.crearConBuilder(datosTarea)
taskService.obtenerPorProyecto(idProyecto)
taskService.moverAColumna(id, idNuevaColumna)
taskService.clonar(id)
taskService.agregarComentario(id, contenido)
taskService.asignarResponsable(id, idUsuario)
```

### BoardService
```javascript
boardService.obtener(idProyecto)
boardService.crearColumna(idProyecto, nombre, orden, color)
boardService.actualizarColumna(idTablero, idColumna, datos)
boardService.excluirColumna(idTablero, idColumna)
```

## 🚀 Flujo de Autenticación

1. Usuario intenta acceder a una ruta protegida
2. Se verifica el token en localStorage
3. Si no hay token → redirige a `/login`
4. Usuario completa el formulario de login
5. Backend valida credenciales y retorna JWT
6. Se guarda token y usuario en localStorage
7. Se accede al dashboard

## 🎨 Diseño Responsivo

El proyectose construyó con mobile-first:
- ✅ Dispositivos móviles (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1024px+)

## 🔄 Gestión de Estado

- **AuthContext**: Maneja autenticación y usuario
- **ThemeContext**: Maneja temas y estilos globales
- **Local Storage**: Persistencia de sesión y tema

## ⚙️ Variables de Entorno

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📚 Dependencias Principales

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.16.0",
  "axios": "^1.5.0",
  "tailwindcss": "^3.3.3"
}
```

## 🎯 Próximas Mejoras

- [ ] Notificaciones en tiempo real con WebSockets
- [ ] Búsqueda avanzada de tareas
- [ ] Filtros y ordenamiento
- [ ] Exportar datos a PDF
- [ ] Multi-lenguaje (i18n)
- [ ] Tests unitarios
- [ ] PWA (Progressive Web App)

## 🤝 Contribuciones

Este proyecto es de naturaleza académica. Siéntete libre de mejorarlo.

## 📄 Licencia

ISC
