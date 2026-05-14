import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { fileService } from '../services/apiService';
import { Button, Card, Progress, Spinner } from './UI';

export const FileUploader = ({ tareaId, archivos = [], onArchivoSubido, onArchivoEliminado }) => {
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const tiposPermitidos = {
    'image/jpeg': 'Imagen JPG',
    'image/png': 'Imagen PNG',
    'image/gif': 'Imagen GIF',
    'application/pdf': 'Documento PDF',
    'application/msword': 'Documento Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
    'text/plain': 'Archivo de texto',
    'text/csv': 'Archivo CSV'
  };

  const tamanoMaximo = 10 * 1024 * 1024; // 10MB

  const validarArchivo = (archivo) => {
    if (!tiposPermitidos[archivo.type]) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${Object.values(tiposPermitidos).join(', ')}`;
    }

    if (archivo.size > tamanoMaximo) {
      return `El archivo es demasiado grande. Tamaño máximo: ${tamanoMaximo / (1024 * 1024)}MB`;
    }

    return null;
  };

  const subirArchivo = async (archivo) => {
    const errorValidacion = validarArchivo(archivo);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setSubiendo(true);
      setError('');
      setProgreso(0);

      const formData = new FormData();
      formData.append('archivo', archivo);

      // Simular progreso
      const intervaloProgreso = setInterval(() => {
        setProgreso(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fileService.subirArchivo(tareaId, formData);

      clearInterval(intervaloProgreso);
      setProgreso(100);

      setTimeout(() => {
        setProgreso(0);
        setSubiendo(false);
        onArchivoSubido && onArchivoSubido(response.data);
      }, 500);

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setError('Error al subir el archivo. Inténtalo de nuevo.');
      setSubiendo(false);
      setProgreso(0);
    }
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);

    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length > 0) {
      subirArchivo(archivos[0]);
    }
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const manejarDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      subirArchivo(archivo);
    }
  };

  const eliminarArchivo = async (archivoId) => {
    try {
      await fileService.eliminarArchivo(tareaId, archivoId);
      onArchivoEliminado && onArchivoEliminado(archivoId);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      setError('Error al eliminar el archivo.');
    }
  };

  const descargarArchivo = async (archivo) => {
    try {
      const response = await fileService.descargarArchivo(tareaId, archivo.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', archivo.nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      setError('Error al descargar el archivo.');
    }
  };

  const obtenerIconoArchivo = (tipo) => {
    if (tipo.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (tipo === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatearTamano = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Archivos Adjuntos
      </h3>

      {/* Zona de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          arrastrando
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${subiendo ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onDrop={manejarDrop}
        onDragOver={manejarDragOver}
        onDragLeave={manejarDragLeave}
        onClick={() => !subiendo && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={manejarSeleccionArchivo}
          accept={Object.keys(tiposPermitidos).join(',')}
        />

        {subiendo ? (
          <div className="space-y-3">
            <Spinner size="lg" />
            <div>
              <div className="text-sm font-medium mb-1">Subiendo archivo...</div>
              <Progress value={progreso} className="w-full" />
            </div>
          </div>
        ) : (
          <div>
            <Upload className={`w-12 h-12 mx-auto mb-4 ${arrastrando ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="text-lg font-medium mb-2">
              {arrastrando ? 'Suelta el archivo aquí' : 'Arrastra y suelta un archivo'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              o haz clic para seleccionar
            </div>
            <div className="text-xs text-gray-500">
              Tipos permitidos: JPG, PNG, GIF, PDF, Word, TXT, CSV<br />
              Tamaño máximo: {tamanoMaximo / (1024 * 1024)}MB
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <X className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Archivos ({archivos.length})</h4>
          <div className="space-y-2">
            {archivos.map((archivo) => (
              <div
                key={archivo.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-500">
                    {obtenerIconoArchivo(archivo.tipo)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{archivo.nombre}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatearTamano(archivo.tamano)} •
                      Subido: {new Date(archivo.fechaSubida).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => descargarArchivo(archivo)}
                    className="p-1"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {archivo.tipo.startsWith('image/') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(archivo.url)}
                      className="p-1"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivo(archivo.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};