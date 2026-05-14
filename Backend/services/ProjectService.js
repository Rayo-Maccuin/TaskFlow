/**
 * SERVICIO DE PROYECTOS
 * Contiene la lógica de negocio relacionada con proyectos
 * Migrado a Sequelize/MySQL
 */

import Project from '../models/Project.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { ProjectCloner } from '../patterns/Prototype.js';
import { Op } from 'sequelize';

export class ProjectService {
  /**
   * Crea un nuevo proyecto
   */
  async crear(nombre, descripcion, propietario, fechaInicio = null, fechaFin = null) {
    try {
      // Crear proyecto
      const nuevoProyecto = await Project.create({
        nombre,
        descripcion,
        fechaInicio: fechaInicio || new Date(),
        fechaFin: fechaFin || null,
        propietarioId: propietario,
        miembros: [
          {
            usuarioId: propietario,
            rol: 'PROPIETARIO',
          },
        ],
      });

      // Crear tablero por defecto
      const columnas = [
        {
          id: 1,
          nombre: 'Por hacer',
          orden: 0,
          color: '#EF4444',
          limiteWip: 0,
        },
        {
          id: 2,
          nombre: 'En progreso',
          orden: 1,
          color: '#F59E0B',
          limiteWip: 0,
        },
        {
          id: 3,
          nombre: 'En revisión',
          orden: 2,
          color: '#3B82F6',
          limiteWip: 0,
        },
        {
          id: 4,
          nombre: 'Completado',
          orden: 3,
          color: '#10B981',
          limiteWip: 0,
        },
      ];

      const nuevoTablero = await Board.create({
        nombre: 'Tablero Principal',
        proyectoId: nuevoProyecto.id,
        columnas,
      });

      return {
        proyecto: nuevoProyecto,
        tablero: nuevoTablero,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un proyecto por ID (con miembros y tablero)
   */
  async obtenerPorId(id) {
    try {
      const proyecto = await Project.findByPk(id, {
        include: [
          {
            model: User,
            as: 'propietario',
            attributes: ['id', 'nombre', 'email', 'avatar'],
          },
        ],
      });

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const tablero = await Board.findOne({
        where: { proyectoId: id },
      });

      return {
        ...proyecto.toJSON(),
        tablero,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los proyectos de un usuario
   */
  async obtenerPorUsuario(usuarioId) {
    try {
      const proyectos = await Project.findAll({
        include: [
          {
            model: User,
            as: 'propietario',
            attributes: ['id', 'nombre', 'email', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const proyectosFiltrados = proyectos.filter((proyecto) => {
        if (proyecto.propietarioId === Number(usuarioId)) {
          return true;
        }

        const miembros = proyecto.miembros || [];
        return miembros.some((miembro) => String(miembro.usuarioId) === String(usuarioId));
      });

      const proyectosConProgreso = await Promise.all(
        proyectosFiltrados.map(async (p) => {
          const tareas = await Task.findAll({
            where: { proyectoId: p.id },
            attributes: ['id', 'completada'],
          });

          const total = tareas.length;
          const completadas = tareas.filter((t) => t.completada).length;
          const progreso = total === 0 ? 0 : Math.round((completadas / total) * 100);

          return {
            ...p.toJSON(),
            progreso,
          };
        })
      );

      return proyectosConProgreso;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un proyecto
   */
  async actualizar(id, datos) {
    try {
      // No permitir cambiar el propietario desde este endpoint
      delete datos.propietarioId;
      delete datos.miembros;

      await Project.update(datos, {
        where: { id },
      });

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Invita un usuario a un proyecto
   */
  async invitarMiembro(idProyecto, idUsuario, rol = 'MIEMBRO') {
    try {
      const proyecto = await Project.findByPk(idProyecto);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const miembros = proyecto.miembros || [];
      const esMiembro = miembros.some((m) => m.usuarioId === idUsuario);

      if (esMiembro) {
        throw new Error('El usuario ya es miembro del proyecto');
      }

      miembros.push({
        usuarioId: idUsuario,
        rol,
        fechaUnion: new Date(),
      });

      await proyecto.update({ miembros });

      return await this.obtenerPorId(idProyecto);
    } catch (error) {
      throw error;
    }
  }

  async invitarPorEmail(idProyecto, email, rol = 'MIEMBRO') {
    try {
      const proyecto = await Project.findByPk(idProyecto);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const usuario = await User.findOne({ where: { email } });
      if (!usuario) {
        throw new Error('Usuario no encontrado con ese email');
      }

      const miembros = proyecto.miembros || [];
      const esMiembro = miembros.some((m) => m.usuarioId === usuario.id);
      if (esMiembro) {
        throw new Error('El usuario ya es miembro del proyecto');
      }

      miembros.push({
        usuarioId: usuario.id,
        rol,
        fechaUnion: new Date(),
      });

      await proyecto.update({ miembros });

      return await this.obtenerPorId(idProyecto);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un miembro del proyecto
   */
  async eliminarMiembro(idProyecto, idUsuario) {
    try {
      const proyecto = await Project.findByPk(idProyecto);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // No permitir eliminar al propietario
      if (proyecto.propietarioId === idUsuario) {
        throw new Error('No se puede eliminar al propietario del proyecto');
      }

      // Eliminar miembro
      const miembros = (proyecto.miembros || []).filter((m) => m.usuarioId !== idUsuario);

      await proyecto.update({ miembros });

      return await this.obtenerPorId(idProyecto);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un proyecto (solo el propietario)
   */
  async eliminar(id) {
    try {
      // Eliminar tablero asociado (en cascada, pero lo explicitamos)
      await Board.destroy({ where: { proyectoId: id } });

      // Eliminar proyecto
      const proyectoEliminado = await Project.destroy({ where: { id } });

      return proyectoEliminado;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clona un proyecto sin tareas
   */
  async clonar(idProyecto, usuarioSolicitante, nombreNuevo = null) {
    const proyectoOriginal = await Project.findByPk(idProyecto);
    if (!proyectoOriginal) {
      throw new Error('Proyecto no encontrado');
    }

    const cloner = new ProjectCloner(proyectoOriginal.toJSON());
    const data = cloner.clonar(nombreNuevo, usuarioSolicitante);

    const proyectoClonado = await Project.create({
      ...data,
      propietarioId: usuarioSolicitante,
      miembros: [
        {
          usuarioId: usuarioSolicitante,
          rol: 'PROPIETARIO',
        },
      ],
    });

    const boardOriginal = await Board.findOne({
      where: { proyectoId: idProyecto },
    });

    const columnasNuevas = (boardOriginal?.columnas || []).map((c, i) => ({
      id: i + 1,
      nombre: c.nombre,
      orden: i,
      color: c.color,
      limiteWip: c.limiteWip || 0,
      tareas: [],
    }));

    const tableroClonado = await Board.create({
      nombre: boardOriginal?.nombre || 'Tablero Principal',
      proyectoId: proyectoClonado.id,
      columnas: columnasNuevas,
    });

    return {
      proyecto: proyectoClonado,
      tablero: tableroClonado,
    };
  }

  /**
   * Cambia el estado de un proyecto
   */
  async cambiarEstado(id, nuevoEstado) {
    try {
      if (
        !['PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO'].includes(
          nuevoEstado
        )
      ) {
        throw new Error('Estado inválido');
      }

      await Project.update(
        { estado: nuevoEstado },
        { where: { id } }
      );

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }
}

export default new ProjectService();
