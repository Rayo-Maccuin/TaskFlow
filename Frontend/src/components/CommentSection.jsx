import React, { useState } from 'react';
import { MessageSquare, Send, Edit3, Trash2, User, Clock } from 'lucide-react';
import { taskService } from '../services/apiService';
import { Button, Card, Textarea, Spinner } from './UI';

export const CommentSection = ({ tareaId, comentarios = [], onComentarioAgregado, onComentarioEditado, onComentarioEliminado }) => {
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editandoComentario, setEditandoComentario] = useState(null);
  const [contenidoEditado, setContenidoEditado] = useState('');
  const [cargando, setCargando] = useState(false);

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      setCargando(true);
      const response = await taskService.agregarComentario(tareaId, nuevoComentario);
      setNuevoComentario('');
      onComentarioAgregado && onComentarioAgregado(response.data);
    } catch (error) {
      console.error('Error agregando comentario:', error);
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (comentario) => {
    setEditandoComentario(comentario.id);
    setContenidoEditado(comentario.contenido);
  };

  const guardarEdicion = async (comentarioId) => {
    if (!contenidoEditado.trim()) return;

    try {
      setCargando(true);
      const response = await taskService.editarComentario(tareaId, comentarioId, contenidoEditado);
      setEditandoComentario(null);
      setContenidoEditado('');
      onComentarioEditado && onComentarioEditado(comentarioId, response.data);
    } catch (error) {
      console.error('Error editando comentario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cancelarEdicion = () => {
    setEditandoComentario(null);
    setContenidoEditado('');
  };

  const eliminarComentario = async (comentarioId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      setCargando(true);
      await taskService.eliminarComentario(tareaId, comentarioId);
      onComentarioEliminado && onComentarioEliminado(comentarioId);
    } catch (error) {
      console.error('Error eliminando comentario:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaComentario = new Date(fecha);
    const diferencia = ahora - fechaComentario;

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;

    return fechaComentario.toLocaleDateString();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-semibold">Comentarios</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({comentarios.length})
        </span>
      </div>

      {/* Agregar comentario */}
      <div className="mb-6">
        <Textarea
          placeholder="Escribe un comentario..."
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <div className="flex justify-end">
          <Button
            onClick={agregarComentario}
            disabled={!nuevoComentario.trim() || cargando}
          >
            {cargando ? <Spinner size="sm" /> : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Comentar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {comentarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay comentarios aún</p>
            <p className="text-sm">Sé el primero en comentar</p>
          </div>
        ) : (
          comentarios.map((comentario) => (
            <div key={comentario.id} className="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{comentario.autor}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatearFecha(comentario.fecha)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => iniciarEdicion(comentario)}
                    className="p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarComentario(comentario.id)}
                    className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {editandoComentario === comentario.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={contenidoEditado}
                    onChange={(e) => setContenidoEditado(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => guardarEdicion(comentario.id)}
                      disabled={!contenidoEditado.trim() || cargando}
                      size="sm"
                    >
                      {cargando ? <Spinner size="sm" /> : 'Guardar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelarEdicion}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comentario.contenido}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};