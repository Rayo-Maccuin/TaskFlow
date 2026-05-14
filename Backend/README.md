# 🚀 TaskFlow - Backend API

Backend completo para TaskFlow, una plataforma de gestión de tareas colaborativa con Kanban board.

## 📋 Requisitos Previos

- **Node.js** v16+ instalado
- **MySQL** v8.0+ instalado y ejecutándose en `localhost:3306`
- **npm** o **yarn** para gestionar paquetes

## 🛠️ Instalación

### 1. Instalar Dependencias

```bash
cd Backend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz de Backend con:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=taskflow
DB_PORT=3306
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_2024
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar MySQL

Asegúrate de que MySQL esté corriendo y ejecuta el script de base de datos:

```bash
# Ejecutar el script SQL para crear las tablas
mysql -u root -p < config/script-mysql.sql
```

O manualmente en MySQL:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskflow;

-- Ejecutar el contenido del archivo config/script-mysql.sql
```

### 4. Ejecutar el Servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📚 Estructura del Proyecto

```
Backend/
├── config/
│   └── database.js           # Patrón Singleton - Conexión a MongoDB
├── controllers/
│   ├── AuthController.js     # Autenticación y usuarios
│   ├── ProjectController.js  # Gestión de proyectos
│   ├── TaskController.js     # Gestión de tareas
│   └── BoardController.js    # Gestión de tablero Kanban
├── models/
│   ├── User.js              # Esquema de Usuario
│   ├── Project.js           # Esquema de Proyecto
│   ├── Task.js              # Esquema de Tarea
│   └── Board.js             # Esquema de Tablero
├── services/
│   ├── UserService.js       # Lógica de usuarios
│   ├── ProjectService.js    # Lógica de proyectos
│   └── TaskService.js       # Lógica de tareas
├── routes/
│   ├── authRoutes.js        # Rutas de autenticación
│   ├── projectRoutes.js     # Rutas de proyectos
│   ├── taskRoutes.js        # Rutas de tareas
│   └── boardRoutes.js       # Rutas de tablero
├── middlewares/
│   └── auth.js              # Autenticación y autorización
├── patterns/
│   ├── TaskFactory.js       # Patrón Factory Method
│   ├── Prototype.js         # Patrón Prototype
│   ├── Builder.js           # Patrón Builder
│   └── ThemeFactory.js      # Patrón Abstract Factory
├── app.js                   # Punto de entrada
├── .env                     # Variables de entorno
└── package.json             # Dependencias del proyecto
```

## 🧠 Patrones de Diseño Implementados

### 1. **Singleton** - `config/database.js`
Garantiza una única instancia de conexión a MongoDB durante toda la aplicación.

```javascript
const db = DatabaseConnection.getInstance();
await db.connect();
```

### 2. **Factory Method** - `patterns/TaskFactory.js`
Crea tareas específicas según su tipo (BUG, FEATURE, TASK, IMPROVEMENT).

```javascript
const tarea = TaskFactory.crearTarea('BUG', titulo, descripcion, ...);
```

### 3. **Prototype** - `patterns/Prototype.js`
Permite clonar tareas y proyectos sin crear instancias desde cero.

```javascript
const clonador = new TaskCloner(tareaOriginal);
const clon = clonador.clonar(nuevoTitulo, nuevoCreador);
```

### 4. **Builder** - `patterns/Builder.js`
Construye tareas complejas paso a paso con una interfaz fluida.

```javascript
const builder = new TaskBuilder(titulo, proyecto, columna, creador);
builder
  .setDescripcion(descripcion)
  .setPrioridad('ALTA')
  .agregarResponsables([usuario1, usuario2])
  .setFechaLimite(fecha)
  .agregarEtiquetas(['urgente', 'bug']);
const tarea = builder.build();
```

### 5. **Abstract Factory** - `patterns/ThemeFactory.js`
Crea familias de objetos (temas) con estilos coherentes.

```javascript
const tema = ThemeFactory.crearTema('dark');
const color = tema.getPrimaryColor();
```

## 🔐 Seguridad

### Autenticación JWT
- Los usuarios reciben un token JWT al hacer login
- El token debe incluirse en el header `Authorization: Bearer <token>`
- Válido por 7 días

### Hash de Contraseñas
- Las contraseñas se hashean con bcryptjs
- Nunca se almacenan en texto plano

### Autorización por Roles
- **ADMIN**: Acceso total
- **PROJECT_MANAGER**: Gestión de proyectos
- **DEVELOPER**: Tareas asignadas

```javascript
router.post('/admin', roleMiddleware('ADMIN'), controlador.funcion);
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/registro` - Registrar usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/perfil` - Obtener perfil
- `PUT /api/auth/perfil` - Actualizar perfil
- `POST /api/auth/cambiar-password` - Cambiar contraseña

### Proyectos
- `POST /api/proyectos` - Crear proyecto
- `GET /api/proyectos/mis-proyectos` - Mis proyectos
- `GET /api/proyectos/:id` - Obtener proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `DELETE /api/proyectos/:id` - Eliminar proyecto
- `POST /api/proyectos/:id/invitar` - Invitar miembro
- `PATCH /api/proyectos/:id/estado` - Cambiar estado

### Tareas
- `POST /api/tareas` - Crear tarea (Factory)
- `POST /api/tareas/builder` - Crear con Builder
- `GET /api/tareas/:id` - Obtener tarea
- `PUT /api/tareas/:id` - Actualizar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea
- `POST /api/tareas/:id/clonar` - Clonar (Prototype)
- `PATCH /api/tareas/:id/mover` - Mover entre columnas
- `POST /api/tareas/:id/comentarios` - Agregar comentario
- `POST /api/tareas/:id/asignar` - Asignar responsable

### Tablero Kanban
- `GET /api/tableros/proyecto/:idProyecto` - Obtener tablero
- `POST /api/tableros/proyecto/:idProyecto/columnas` - Crear columna
- `PUT /api/tableros/:idTablero/columnas/:idColumna` - Actualizar columna
- `DELETE /api/tableros/:idTablero/columnas/:idColumna` - Eliminar columna
- `PATCH /api/tableros/:idTablero/reordenar` - Reordenar columnas

## 🧪 Ejemplo de Uso con cURL

### Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password": "12345678",
    "confirmPassword": "12345678"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "12345678"
  }'
```

### Crear Proyecto
```bash
curl -X POST http://localhost:5000/api/proyectos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -d '{
    "nombre": "Mi Proyecto",
    "descripcion": "Descripción del proyecto"
  }'
```

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Cliente (Frontend)                     │
└─────────────────────┬───────────────────────────────────┘
                      │ Requests HTTP/JSON
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Express.js - Servidor                      │
├─────────────────────────────────────────────────────────┤
│                      Routes Layer                         │
│  authRoutes | projectRoutes | taskRoutes | boardRoutes  │
├─────────────────────────────────────────────────────────┤
│                   Controllers Layer                       │
│ AuthCtrl | ProjectCtrl | TaskCtrl | BoardCtrl           │
├─────────────────────────────────────────────────────────┤
│                    Services Layer                         │
│ UserService | ProjectService | TaskService              │
├─────────────────────────────────────────────────────────┤
│                    Models Layer (Mongoose)               │
│  User | Project | Task | Board                          │
├─────────────────────────────────────────────────────────┤
│                  Patterns Layer                          │
│ Singleton | Factory | Prototype | Builder | Abstract    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │     MongoDB Local       │
         │   (Datos persistentes)  │
         └────────────────────────┘
```

## 🔄 Flujo de Autenticación

1. **Registro**: Usuario proporciona nombre, email y password
2. **Password Hashing**: Se hashea con bcryptjs
3. **Login**: Usuario proporciona email y password
4. **Verificación**: Se compara el password con el hash
5. **JWT Generation**: Se genera token válido por 7 días
6. **Protected Routes**: Se verifica el token en cada request

## 🚀 Características Principales

✅ Autenticación con JWT
✅ Roles y permisos
✅ CRUD completo de proyectos
✅ Gestión de tareas con múltiples atributos
✅ Tablero Kanban con columnas personalizables
✅ Comentarios en tareas
✅ Asignación de responsables
✅ Clonado de tareas y proyectos
✅ Validación de datos
✅ Manejo de errores
✅ CORS habilitado
✅ Variables de entorno

## 📝 Notas Importantes

- MongoDB debe estar corriendo en `localhost:27017`
- El JWT expira en 7 días
- Las contraseñas se validan con un mínimo de 6 caracteres
- El frontend debe estar en `http://localhost:5173`
- Todos los endpoints requieren autenticación excepto registro y login

## 🤝 Contribuciones

Este proyecto forma parte de un trabajo académico sobre patrones de diseño.

## 📄 Licencia

ISC
