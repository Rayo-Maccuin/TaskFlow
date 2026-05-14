# 🚀 TaskFlow - Plataforma de Gestión de Tareas Colaborativa

![TaskFlow Logo](https://img.shields.io/badge/TaskFlow-v1.0.0-blue)
![Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-ISC-blue)

Una plataforma web moderna y completa para la gestión de tareas colaborativa con tablero Kanban, implementando patrones de diseño creacionales.

## ✨ Características Principales

### 👥 Gestión de Usuarios
- ✅ Registro e login con JWT
- ✅ Tres roles: ADMIN, PROJECT_MANAGER, DEVELOPER
- ✅ Perfil de usuario con avatar personalizado
- ✅ Cambio de contraseña seguro (bcrypt)
- ✅ Logout y sesión persistente

### 📊 Gestión de Proyectos
- ✅ Crear, editar y eliminar proyectos
- ✅ Estados: PLANIFICADO, EN_PROGRESO, PAUSADO, COMPLETADO, ARCHIVADO
- ✅ Invitar miembros a proyectos
- ✅ Información detallada de cada proyecto

### 🎯 Tablero Kanban
- ✅ Columnas predefinidas (Por hacer, En progreso, En revisión, Completado)
- ✅ Columnas personalizables
- ✅ Drag & drop de tareas
- ✅ Creación de tareas directa desde columnas

### 📋 Gestión de Tareas
- ✅ Crear tareas con múltiples atributos
- ✅ Prioridades: BAJA, MEDIA, ALTA, URGENTE
- ✅ Tipos: BUG, FEATURE, TASK, IMPROVEMENT
- ✅ Subtareas
- ✅ Comentarios
- ✅ Asignación de responsables
- ✅ Fechas límite
- ✅ Etiquetas

### 🎨 Interfaz Moderna
- ✅ Diseño responsivo con Tailwind CSS
- ✅ Tres temas: Claro, Oscuro, Profesional
- ✅ Dark mode soportado
- ✅ Componentes reutilizables
- ✅ Interfaz intuitiva y moderna

## 🧠 Patrones de Diseño Implementados

### 1. **Singleton** - Conexión a MongoDB
```
Backend/config/database.js
Garantiza una única instancia de conexión a la base de datos
```

### 2. **Factory Method** - Creación de Tareas
```
Backend/patterns/TaskFactory.js
Crea tareas específicas según su tipo (BUG, FEATURE, etc.)
```

### 3. **Prototype** - Clonado de Tareas y Proyectos
```
Backend/patterns/Prototype.js
Permite clonar objetos sin crear instancias desde cero
```

### 4. **Builder** - Construcción de Tareas Complejas
```
Backend/patterns/Builder.js
Construye tareas paso a paso mediante interfaz fluida
```

### 5. **Abstract Factory** - Temas y Estilos
```
Backend/patterns/ThemeFactory.js
Frontend/src/context/ThemeContext.jsx
Crea familias coherentes de colores (Light, Dark, Professional)
```

## 🏗️ Estructura del Proyecto

```
TaskFlow/
├── Backend/
│   ├── config/              # Configuración (BD, variables)
│   ├── controllers/         # Controladores HTTP
│   ├── models/              # Esquemas Mongoose
│   ├── services/            # Lógica de negocio
│   ├── routes/              # Definición de rutas
│   ├── middlewares/         # Autenticación y autorización
│   ├── patterns/            # Patrones de diseño
│   ├── app.js              # Punto de entrada
│   ├── package.json        # Dependencias
│   ├── .env                # Variables de entorno
│   └── README.md           # Documentación backend
│
└── Frontend/
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/          # Páginas (Login, Dashboard, etc.)
    │   ├── services/       # Integración con API
    │   ├── context/        # Contextos de React
    │   ├── patterns/       # Implementaciones de patrones
    │   ├── App.jsx         # Componente raíz
    │   ├── main.jsx        # Punto de entrada
    │   └── index.css       # Estilos globales
    ├── index.html          # HTML base
    ├── vite.config.js      # Configuración Vite
    ├── tailwind.config.js  # Configuración Tailwind
    ├── package.json        # Dependencias
    ├── .env                # Variables de entorno
    └── README.md           # Documentación frontend
```

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Node.js** v16+ y npm
- **MongoDB** local (Puerto 27017)
- **Git** (opcional)

### 1. Clonar o Descargar el Proyecto

```bash
# Si descargas el proyecto, extraelo en tu carpeta deseada
cd /ruta/a/TaskFlow
```

### 2. Configurar Backend

```bash
cd Backend

# Instalar dependencias
npm install

# Crear archivo .env
echo 'PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_2024
NODE_ENV=development
FRONTEND_URL=http://localhost:5173' > .env

# Iniciar servidor
npm run dev
```

El backend estará disponible en **http://localhost:5000**

### 3. Configurar Frontend

En otra terminal:

```bash
cd Frontend

# Instalar dependencias
npm install

# Crear archivo .env
echo 'VITE_API_BASE_URL=http://localhost:5000/api' > .env

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en **http://localhost:5173**

### 4. Asegurar MongoDB está ejecutándose

```bash
# En Windows (si está instalado como servicio)
net start MongoDB

# O ejecutar mongod directamente
mongod
```

## 🔐 Credenciales de Prueba

Si deseas un usuario de prueba, puedes crear uno en la página de registro:

- **Email**: `dev@example.com`
- **Contraseña**: `123456`

O registra tu propia cuenta.

## 📡 API Endpoints Principales

### Autenticación
```
POST   /api/auth/registro               # Registro
POST   /api/auth/login                  # Login
GET    /api/auth/perfil                 # Obtener perfil
PUT    /api/auth/perfil                 # Actualizar perfil
POST   /api/auth/cambiar-password       # Cambiar contraseña
```

### Proyectos
```
POST   /api/proyectos                   # Crear proyecto
GET    /api/proyectos/mis-proyectos     # Mis proyectos
GET    /api/proyectos/:id               # Obtener proyecto
PUT    /api/proyectos/:id               # Actualizar proyecto
DELETE /api/proyectos/:id               # Eliminar proyecto
POST   /api/proyectos/:id/invitar       # Invitar miembro
```

### Tareas
```
POST   /api/tareas                      # Crear tarea
POST   /api/tareas/builder              # Crear con Builder
GET    /api/tareas/:id                  # Obtener tarea
PUT    /api/tareas/:id                  # Actualizar tarea
DELETE /api/tareas/:id                  # Eliminar tarea
POST   /api/tareas/:id/clonar           # Clonar (Prototype)
PATCH  /api/tareas/:id/mover            # Mover entre columnas
```

### Tablero
```
GET    /api/tableros/proyecto/:id       # Obtener tablero
POST   /api/tableros/proyecto/:id/columnas  # Crear columna
DELETE /api/tableros/:id/columnas/:id   # Eliminar columna
```

## 🎯 Flujos de Uso

### Crear un Nuevo Proyecto

1. Inicia sesión correctamente
2. En el Dashboard, haz clic en "Nuevo Proyecto"
3. Ingresa el nombre y descripción
4. Se creará automáticamente con un tablero Kanban con 4 columnas

### Crear una Tarea

1. Abre un proyecto
2. En el tablero Kanban, haz clic en el botón "+" de la columna deseada
3. Ingresa el título de la tarea
4. La tarea aparecerá en la columna

### Mover una Tarea

1. En el tablero, selecciona una tarea
2. Arrástrala a otra columna
3. Se guardará automáticamente la posición

### Invitar Miembros

1. Abre un proyecto
2. (Nota: Esta funcionalidad se puede expandir en futuras versiones)

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express** - Servidor web
- **MongoDB + Mongoose** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hashing de contraseñas
- **CORS** - Control de acceso

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Lucide Icons** - Iconos

## 📊 Diagrama de Arquitectura

```
┌─────────────┐         ┌─────────────┐
│   Frontend  │◄────────►│   Backend   │
│  (React)    │   HTTP   │  (Express)  │
└─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   MongoDB    │
                        │   Local      │
                        └──────────────┘
```

## 🔄 Flujo de Autenticación

```
Usuario
  │
  ├─► Registro/Login
  │       │
  │       ▼
  │   Backend valida credenciales
  │       │
  │       ▼
  │   Genera JWT
  │       │
  │       ▼
  │   Frontend guarda en localStorage
  │       │
  │       ▼
  └─► Acceso a Dashboard y Proyectos
```

## 🧪 Pruebas de Funcionalidad

### Prueba 1: Crear Proyecto
- ✅ Ve al Dashboard
- ✅ Haz clic en "Nuevo Proyecto"
- ✅ Ingresa datos y crea
- ✅ Verás el proyecto en la lista

### Prueba 2: Crear Tarea
- ✅ Abre un proyecto
- ✅ Haz clic en "+" en una columna
- ✅ Ingresa el título
- ✅ Verás la tarea en la columna

### Prueba 3: Cambiar Tema
- ✅ Haz clic en tu avatar en la navbar
- ✅ Selecciona un tema
- ✅ La interfaz cambiará de estilo

### Prueba 4: Actualizar Perfil
- ✅ Ve a "Mi Perfil"
- ✅ Modifica información
- ✅ Haz clic en "Guardar Cambios"

## 📈 Mejoras Futuras

- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Notificaciones
- [ ] Búsqueda avanzada
- [ ] Reportes y estadísticas
- [ ] Exportar a PDF
- [ ] Multi-lenguaje
- [ ] Tests unitarios
- [ ] Autenticación OAuth (Google, GitHub)
- [ ] Calendarios
- [ ] Gantt charts

## 📚 Documentación Adicional

- [Backend README](./Backend/README.md) - Documentación detallada del backend
- [Frontend README](./Frontend/README.md) - Documentación detallada del frontend

## 🐛 Solución de Problemas

### "Cannot connect to MongoDB"
- Verifica que MongoDB está corriendo
- Revisa la ruta en .env: `mongodb://localhost:27017/taskflow`

### "CORS Error"
- Asegúrate que FRONTEND_URL en Backend .env es correcto

### "404 Not Found en API"
- Verifica que el Backend está corriendo en puerto 5000
- Revisa VITE_API_BASE_URL en Frontend .env

### "Token inválido"
- Intenta limpiando localStorage y hacer login nuevamente
- Verifica que JWT_SECRET es igual en Backend

## 🎓 Valor Académico

Este proyecto demuestra:
- ✅ Patrones de diseño creacionales
- ✅ Arquitectura en capas
- ✅ Separación de responsabilidades
- ✅ Full stack development
- ✅ Autenticación y autorización
- ✅ Diseño responsivo
- ✅ Modularidad y reutilización

## 👨‍💼 Autor

Proyecto académico sobre patrones de diseño creacionales.

## 📄 Licencia

ISC

---

**¿Preguntas?** Revisa los README individuales en Backend/ y Frontend/ para más detalles.

**Bienvenido a TaskFlow! 🚀**
#   T a s k F l o w  
 