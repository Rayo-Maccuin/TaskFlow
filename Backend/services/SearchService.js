/**
 * SERVICIO DE BÚSQUEDA Y FILTROS
 * Maneja la búsqueda avanzada y filtrado de tareas
 */

import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import SavedFilter from '../models/SavedFilter.js';

class SearchService {
  // Búsqueda básica por texto
  async buscarTareas(termino, usuarioId, proyectoId = null) {
    try {
      const whereClause = {
        [Op.or]: [
          { titulo: { [Op.like]: `%${termino}%` } },
          { descripcion: { [Op.like]: `%${termino}%` } }
        ]
      };

      // Si se especifica un proyecto, verificar permisos
      if (proyectoId) {
        const proyecto = await Project.findByPk(proyectoId);
        if (!proyecto || !proyecto.miembros.includes(usuarioId)) {
          throw new Error('No tienes acceso a este proyecto');
        }
        whereClause.proyectoId = proyectoId;
      } else {
        // Buscar en todos los proyectos donde el usuario es miembro
        const proyectosUsuario = await Project.findAll({
          where: {
            [Op.or]: [
              { propietarioId: usuarioId },
              { miembros: { [Op.contains]: [usuarioId] } }
            ]
          },
          attributes: ['id']
        });
        const proyectoIds = proyectosUsuario.map(p => p.id);
        whereClause.proyectoId = { [Op.in]: proyectoIds };
      }

      const tareas = await Task.findAll({
        where: whereClause,
        include: [
          {
            model: Project,
            as: 'proyecto',
            attributes: ['id', 'nombre']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 100
      });

      return tareas;
    } catch (error) {
      console.error('Error en búsqueda de tareas:', error);
      throw error;
    }
  }

  // Filtrado avanzado de tareas
  async filtrarTareas(filtros, usuarioId) {
    try {
      const whereClause = {};

      // Proyecto
      if (filtros.proyectoId) {
        const proyecto = await Project.findByPk(filtros.proyectoId);
        if (!proyecto || !proyecto.miembros.includes(usuarioId)) {
          throw new Error('No tienes acceso a este proyecto');
        }
        whereClause.proyectoId = filtros.proyectoId;
      } else {
        // Filtrar por proyectos accesibles
        const proyectosUsuario = await Project.findAll({
          where: {
            [Op.or]: [
              { propietarioId: usuarioId },
              { miembros: { [Op.contains]: [usuarioId] } }
            ]
          },
          attributes: ['id']
        });
        const proyectoIds = proyectosUsuario.map(p => p.id);
        whereClause.proyectoId = { [Op.in]: proyectoIds };
      }

      // Responsables
      if (filtros.responsables && filtros.responsables.length > 0) {
        whereClause.responsables = { [Op.overlap]: filtros.responsables };
      }

      // Etiquetas
      if (filtros.etiquetas && filtros.etiquetas.length > 0) {
        whereClause.etiquetas = { [Op.contains]: filtros.etiquetas };
      }

      // Prioridad
      if (filtros.prioridad) {
        whereClause.prioridad = filtros.prioridad;
      }

      // Tipo
      if (filtros.tipo) {
        whereClause.tipo = filtros.tipo;
      }

      // Rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        whereClause.fechaLimite = {};
        if (filtros.fechaDesde) {
          whereClause.fechaLimite[Op.gte] = new Date(filtros.fechaDesde);
        }
        if (filtros.fechaHasta) {
          whereClause.fechaLimite[Op.lte] = new Date(filtros.fechaHasta);
        }
      }

      // Estado (columna)
      if (filtros.columna) {
        whereClause.columna = filtros.columna;
      }

      // Completada
      if (filtros.completada !== undefined) {
        whereClause.completada = filtros.completada;
      }

      // Vencidas
      if (filtros.vencidas === true) {
        whereClause.fechaLimite = { [Op.lt]: new Date() };
        whereClause.completada = false;
      }

      // Ordenamiento
      let order = [['updatedAt', 'DESC']];
      if (filtros.ordenarPor) {
        const ordenCampo = filtros.ordenarPor;
        const ordenDireccion = filtros.ordenDireccion || 'DESC';
        order = [[ordenCampo, ordenDireccion]];
      }

      const tareas = await Task.findAll({
        where: whereClause,
        include: [
          {
            model: Project,
            as: 'proyecto',
            attributes: ['id', 'nombre', 'estado']
          }
        ],
        order: order,
        limit: filtros.limite || 100,
        offset: filtros.offset || 0
      });

      // Contar total para paginación
      const total = await Task.count({ where: whereClause });

      return {
        tareas,
        total,
        pagina: Math.floor((filtros.offset || 0) / (filtros.limite || 100)) + 1,
        totalPaginas: Math.ceil(total / (filtros.limite || 100))
      };
    } catch (error) {
      console.error('Error en filtrado de tareas:', error);
      throw error;
    }
  }

  // Guardar filtro personalizado
  async guardarFiltro(usuarioId, nombre, filtros, proyectoId = null) {
    try {
      // Verificar si ya existe un filtro con ese nombre para el usuario
      const filtroExistente = await SavedFilter.findOne({
        where: {
          usuarioId,
          nombre,
          proyectoId: proyectoId || null
        }
      });

      if (filtroExistente) {
        // Actualizar filtro existente
        filtroExistente.filtros = filtros;
        await filtroExistente.save();
        return filtroExistente;
      } else {
        // Crear nuevo filtro
        const filtro = await SavedFilter.create({
          usuarioId,
          nombre,
          filtros,
          proyectoId
        });
        return filtro;
      }
    } catch (error) {
      console.error('Error guardando filtro:', error);
      throw error;
    }
  }

  // Obtener filtros guardados
  async obtenerFiltrosGuardados(usuarioId, proyectoId = null) {
    try {
      const whereClause = { usuarioId };
      if (proyectoId) {
        whereClause[Op.or] = [
          { proyectoId: proyectoId },
          { proyectoId: null } // Filtros globales
        ];
      }

      const filtros = await SavedFilter.findAll({
        where: whereClause,
        order: [['nombre', 'ASC']]
      });

      return filtros;
    } catch (error) {
      console.error('Error obteniendo filtros guardados:', error);
      throw error;
    }
  }

  // Eliminar filtro guardado
  async eliminarFiltro(id, usuarioId) {
    try {
      const filtro = await SavedFilter.findOne({
        where: { id, usuarioId }
      });

      if (!filtro) {
        throw new Error('Filtro no encontrado');
      }

      await filtro.destroy();
      return { mensaje: 'Filtro eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminando filtro:', error);
      throw error;
    }
  }

  // Aplicar filtro guardado
  async aplicarFiltroGuardado(idFiltro, usuarioId, overrides = {}) {
    try {
      const filtro = await SavedFilter.findOne({
        where: { id: idFiltro, usuarioId }
      });

      if (!filtro) {
        throw new Error('Filtro no encontrado');
      }

      // Combinar filtros guardados con overrides
      const filtrosCombinados = { ...filtro.filtros, ...overrides };

      return await this.filtrarTareas(filtrosCombinados, usuarioId);
    } catch (error) {
      console.error('Error aplicando filtro guardado:', error);
      throw error;
    }
  }

  // Búsqueda avanzada con múltiples criterios
  async busquedaAvanzada(criterios, usuarioId) {
    try {
      const whereClause = {};

      // Proyectos accesibles
      const proyectosUsuario = await Project.findAll({
        where: {
          [Op.or]: [
            { propietarioId: usuarioId },
            { miembros: { [Op.contains]: [usuarioId] } }
          ]
        },
        attributes: ['id']
      });
      const proyectoIds = proyectosUsuario.map(p => p.id);
      whereClause.proyectoId = { [Op.in]: proyectoIds };

      // Texto libre (título y descripción)
      if (criterios.texto) {
        whereClause[Op.or] = [
          { titulo: { [Op.like]: `%${criterios.texto}%` } },
          { descripcion: { [Op.like]: `%${criterios.texto}%` } }
        ];
      }

      // Múltiples prioridades
      if (criterios.prioridades && criterios.prioridades.length > 0) {
        whereClause.prioridad = { [Op.in]: criterios.prioridades };
      }

      // Múltiples tipos
      if (criterios.tipos && criterios.tipos.length > 0) {
        whereClause.tipo = { [Op.in]: criterios.tipos };
      }

      // Estados de completitud
      if (criterios.completadas !== undefined) {
        if (Array.isArray(criterios.completadas)) {
          whereClause.completada = { [Op.in]: criterios.completadas };
        } else {
          whereClause.completada = criterios.completadas;
        }
      }

      // Rango de fechas de creación
      if (criterios.fechaCreacionDesde || criterios.fechaCreacionHasta) {
        whereClause.createdAt = {};
        if (criterios.fechaCreacionDesde) {
          whereClause.createdAt[Op.gte] = new Date(criterios.fechaCreacionDesde);
        }
        if (criterios.fechaCreacionHasta) {
          whereClause.createdAt[Op.lte] = new Date(criterios.fechaCreacionHasta);
        }
      }

      // Rango de fechas límite
      if (criterios.fechaLimiteDesde || criterios.fechaLimiteHasta) {
        whereClause.fechaLimite = {};
        if (criterios.fechaLimiteDesde) {
          whereClause.fechaLimite[Op.gte] = new Date(criterios.fechaLimiteDesde);
        }
        if (criterios.fechaLimiteHasta) {
          whereClause.fechaLimite[Op.lte] = new Date(criterios.fechaLimiteHasta);
        }
      }

      const tareas = await Task.findAll({
        where: whereClause,
        include: [
          {
            model: Project,
            as: 'proyecto',
            attributes: ['id', 'nombre', 'estado']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: criterios.limite || 100,
        offset: criterios.offset || 0
      });

      const total = await Task.count({ where: whereClause });

      return {
        tareas,
        total,
        pagina: Math.floor((criterios.offset || 0) / (criterios.limite || 100)) + 1,
        totalPaginas: Math.ceil(total / (criterios.limite || 100))
      };
    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      throw error;
    }
  }
}

export default new SearchService();