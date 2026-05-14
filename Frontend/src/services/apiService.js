import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT y ajustar Content-Type para FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Si el payload es FormData, eliminamos Content-Type para que el navegador lo establezca automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

  /**
   * SERVICIO DE AUTENTICACIÓN
   */
  export const authService = {
    registro: (nombre, email, password, confirmPassword, rol = 'DEVELOPER') =>
      apiClient.post('/auth/registro', { nombre, email, password, confirmPassword, rol }),

    login: (email, password) =>
      apiClient.post('/auth/login', { email, password }),

    obtenerPerfil: () =>
      apiClient.get('/auth/perfil'),

    actualizarPerfil: (datos) =>
      apiClient.put('/auth/perfil', datos),

    cambiarPassword: (passwordActual, passwordNueva, confirmPassword) =>
      apiClient.post('/auth/cambiar-password', {
        passwordActual,
        passwordNueva,
        confirmPassword,
      }),

    logout: () =>
      apiClient.post('/auth/logout'),

    obtenerUsuarios: () =>
      apiClient.get('/auth/usuarios'),

    buscarUsuarios: (termino) =>
      apiClient.get(`/auth/usuarios/buscar`, { params: { termino } }),

    obtenerUsuario: (id) =>
      apiClient.get(`/auth/usuarios/${id}`),
  };

/**
 * SERVICIO DE PROYECTOS
 */
export const projectService = {
  crear: (proyectoData) =>
    apiClient.post('/proyectos', proyectoData),

  obtenerPorId: (id) =>
    apiClient.get(`/proyectos/${id}`),

  obtenerMisProyectos: () =>
    apiClient.get('/proyectos/mis-proyectos'),

  actualizar: (id, datos) =>
    apiClient.put(`/proyectos/${id}`, datos),

  eliminar: (id) =>
    apiClient.delete(`/proyectos/${id}`),

  invitarMiembro: (idProyecto, idUsuario, rol = 'MIEMBRO') =>
    apiClient.post(`/proyectos/${idProyecto}/invitar`, { idUsuario, rol }),

  eliminarMiembro: (idProyecto, idMiembro) =>
    apiClient.delete(`/proyectos/${idProyecto}/miembro/${idMiembro}`),

  cambiarEstado: (id, estado) =>
    apiClient.patch(`/proyectos/${id}/estado`, { estado }),

  clonar: (id, nombre = null) =>
    apiClient.post(`/proyectos/${id}/clonar`, { nombre }),
};

/**
 * SERVICIO DE TAREAS
 */
export const taskService = {
  crear: (datosTarea) =>
    apiClient.post('/tareas', datosTarea),

  crearConBuilder: (datosTarea) =>
    apiClient.post('/tareas/builder', datosTarea),

  obtenerPorId: (id) =>
    apiClient.get(`/tareas/${id}`),

  obtenerTarea: (id) =>
    apiClient.get(`/tareas/${id}`),

  obtenerPorProyecto: (idProyecto) =>
    apiClient.get(`/tareas/proyecto/${idProyecto}`),

  obtenerPorColumna: (idColumna) =>
    apiClient.get(`/tareas/columna/${idColumna}`),

  actualizar: (id, datos) =>
    apiClient.put(`/tareas/${id}`, datos),

  actualizarTarea: (id, datos) =>
    apiClient.put(`/tareas/${id}`, datos),

  eliminar: (id) =>
    apiClient.delete(`/tareas/${id}`),

  clonar: (id) =>
    apiClient.post(`/tareas/${id}/clonar`),

  actualizarSubtarea: (id, idSubtarea) =>
    apiClient.patch(`/tareas/${id}/subtareas/${idSubtarea}/toggle`),

  agregarSubtarea: (id, subtareas) =>
    apiClient.put(`/tareas/${id}`, { subtareas }),

  moverAColumna: (id, idNuevaColumna, orden = 0) =>
    apiClient.patch(`/tareas/${id}/mover`, { idNuevaColumna, orden }),

  completar: (id) =>
    apiClient.patch(`/tareas/${id}/completar`),

  agregarComentario: (id, contenido) =>
    apiClient.post(`/tareas/${id}/comentarios`, { contenido }),

  editarComentario: (id, idComentario, contenido) =>
    apiClient.put(`/tareas/${id}/comentarios/${idComentario}`, { contenido }),

  eliminarComentario: (id, idComentario) =>
    apiClient.delete(`/tareas/${id}/comentarios/${idComentario}`),

  asignarResponsable: (id, idUsuario) =>
    apiClient.post(`/tareas/${id}/asignar`, { idUsuario }),

  quitarResponsable: (id, idUsuario) =>
    apiClient.delete(`/tareas/${id}/asignar/${idUsuario}`),

  registrarTiempo: (id, horas, comentario = '') =>
    apiClient.post(`/tareas/${id}/tiempo`, { horas, comentario }),

  subirAdjunto: (id, formData) =>
    apiClient.post(`/tareas/${id}/adjuntos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  buscar: (idProyecto, filtros = {}) =>
    apiClient.get(`/tareas/buscar/proyecto/${idProyecto}`, { params: filtros }),

  guardarFiltro: (nombre, criterios) =>
    apiClient.post('/tareas/filtros', { nombre, criterios }),

  obtenerFiltros: () =>
    apiClient.get('/tareas/filtros'),

  undo: (id) =>
    apiClient.post(`/tareas/${id}/undo`),
};

/**
 * SERVICIO DE TABLERO
 */
export const boardService = {
  obtener: (idProyecto) =>
    apiClient.get(`/tableros/proyecto/${idProyecto}`),

  crearColumna: (idProyecto, nombre, orden, color) =>
    apiClient.post(`/tableros/proyecto/${idProyecto}/columnas`, {
      nombre,
      orden,
      color,
    }),

  actualizarColumna: (idTablero, idColumna, datos) =>
    apiClient.put(`/tableros/${idTablero}/columnas/${idColumna}`, datos),

  eliminarColumna: (idTablero, idColumna) =>
    apiClient.delete(`/tableros/${idTablero}/columnas/${idColumna}`),

  reordenarColumnas: (idTablero, columnasOrdenadas) =>
    apiClient.patch(`/tableros/${idTablero}/reordenar`, { columnasOrdenadas }),
};

export const notificationService = {
  obtenerNotificaciones: (pagina = 1, limite = 20) =>
    apiClient.get('/notificaciones', { params: { pagina, limite } }),

  marcarComoLeida: (id) =>
    apiClient.patch(`/notificaciones/${id}/leida`),

  marcarTodasComoLeidas: () =>
    apiClient.patch('/notificaciones/marcar-todas-leidas'),

  obtenerPreferencias: () =>
    apiClient.get('/notificaciones/preferencias'),

  actualizarPreferencias: (preferencias) =>
    apiClient.put('/notificaciones/preferencias', preferencias),
};

export const reportService = {
  exportarCSV: (idProyecto) =>
    apiClient.get(`/reportes/proyecto/${idProyecto}/export/csv`, { responseType: 'blob' }),

  exportarPDF: (idProyecto) =>
    apiClient.get(`/reportes/proyecto/${idProyecto}/export/pdf`, { responseType: 'blob' }),

  exportarExcel: (idProyecto) =>
    apiClient.get(`/reportes/proyecto/${idProyecto}/export/excel`, { responseType: 'blob' }),

  exportarJSON: (idProyecto) =>
    apiClient.get(`/reportes/proyecto/${idProyecto}/exportar?formato=json`, { responseType: 'blob' }),
};

export const searchService = {
  buscarTareas: (query, proyectoId = null) =>
    apiClient.get('/busqueda/tareas', { params: { q: query, proyectoId } }),

  filtrarTareas: (filtros) =>
    apiClient.post('/busqueda/filtrar', filtros),

  guardarFiltro: (nombre, filtros, proyectoId) =>
    apiClient.post('/busqueda/filtros', { nombre, filtros, proyectoId }),

  obtenerFiltrosGuardados: (proyectoId) =>
    apiClient.get('/busqueda/filtros', { params: { proyectoId } }),

  aplicarFiltroGuardado: (filtroId) =>
    apiClient.get(`/busqueda/filtros/${filtroId}/aplicar`),

  eliminarFiltro: (filtroId) =>
    apiClient.delete(`/busqueda/filtros/${filtroId}`),
};

export const fileService = {
  subirArchivo: (tareaId, formData) =>
    apiClient.post(`/tareas/${tareaId}/adjuntos`, formData),

  descargarArchivo: (tareaId, archivoId) =>
    apiClient.get(`/tareas/${tareaId}/archivos/${archivoId}`, {
      responseType: 'blob'
    }),

  eliminarArchivo: (tareaId, archivoId) =>
    apiClient.delete(`/tareas/${tareaId}/archivos/${archivoId}`),

  obtenerArchivos: (tareaId) =>
    apiClient.get(`/tareas/${tareaId}/archivos`),
};

export const adminService = {
  obtenerUsuarios: () =>
    apiClient.get('/admin/usuarios'),

  obtenerUsuario: (id) =>
    apiClient.get(`/admin/usuarios/${id}`),

  crearUsuario: (usuarioData) =>
    apiClient.post('/admin/usuarios', usuarioData),

  actualizarUsuario: (id, usuarioData) =>
    apiClient.put(`/admin/usuarios/${id}`, usuarioData),

  eliminarUsuario: (id) =>
    apiClient.delete(`/admin/usuarios/${id}`),

  obtenerEstadisticas: () =>
    apiClient.get('/admin/estadisticas'),

  // Alias para compatibilidad
  listarUsuarios: () => apiClient.get('/admin/usuarios'),
  editarUsuario: (id, datos) => apiClient.put(`/admin/usuarios/${id}`, datos),
  desactivarUsuario: (id) => apiClient.patch(`/admin/usuarios/${id}/desactivar`),
  reactivarUsuario: (id) => apiClient.patch(`/admin/usuarios/${id}/reactivar`),
};

export const systemService = {
  obtenerConfiguracion: () =>
    apiClient.get('/sistema/configuracion'),

  actualizarConfiguracion: (configuracion) =>
    apiClient.put('/sistema/configuracion', configuracion),

  probarConexionBD: () =>
    apiClient.get('/sistema/probar-bd'),

  probarEmail: () =>
    apiClient.post('/sistema/probar-email'),

  crearBackup: () =>
    apiClient.post('/sistema/backup'),

  limpiarCache: () =>
    apiClient.post('/sistema/limpiar-cache'),

  // Bridge pattern diagnostics
  obtenerAuthStrategy: () =>
    apiClient.get('/configuracion/debug/auth-strategy'),

  cambiarAuthStrategy: (tipo) =>
    apiClient.post('/configuracion/debug/auth-strategy', { tipo }),
};

export const chartService = {
  obtenerDatosGraficos: (proyectoId, periodo = '30d') =>
    apiClient.get(`/graficos/proyecto/${proyectoId}`, { params: { periodo } }),

  obtenerBurndownData: (proyectoId, sprintId = null) =>
    apiClient.get(`/graficos/proyecto/${proyectoId}/burndown`, { params: { sprintId } }),

  obtenerVelocityData: (proyectoId, sprints = 10) =>
    apiClient.get(`/graficos/proyecto/${proyectoId}/velocity`, { params: { sprints } }),

  obtenerProductividadData: (proyectoId, semanas = 12) =>
    apiClient.get(`/graficos/proyecto/${proyectoId}/productividad`, { params: { semanas } }),
};

export default apiClient;
