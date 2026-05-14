-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS MySQL
-- TaskFlow - Plataforma de Gestión de Tareas
-- ============================================

-- 1. CREAR BASE DE DATOS
CREATE DATABASE IF NOT EXISTS `taskflow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE `taskflow`;

-- 2. CREAR TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  `nombre` VARCHAR(255) NOT NULL,
  
  `email` VARCHAR(255) NOT NULL UNIQUE,
  
  `password` VARCHAR(255) NOT NULL,
  
  `rol` ENUM(
    'ADMIN',
    'PROJECT_MANAGER',
    'DEVELOPER'
  ) DEFAULT 'DEVELOPER',
  
  `activo` BOOLEAN DEFAULT TRUE,
  
  `soloLectura` BOOLEAN DEFAULT FALSE,
  
  `avatar` VARCHAR(500) DEFAULT 'https://via.placeholder.com/150',
  
  `descripcion` TEXT,
  
  `ultimoAcceso` DATETIME,
  
  `preferenciasNotificacion` JSON,
  
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_email` (`email`),
   
   INDEX `idx_rol` (`rol`),
   
   INDEX `idx_activo` (`activo`)
   
 ) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 3. CREAR TABLA DE PROYECTOS
CREATE TABLE IF NOT EXISTS `Projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  `nombre` VARCHAR(255) NOT NULL,
  
  `descripcion` TEXT,
  
  `estado` ENUM(
    'PLANIFICADO',
    'EN_PROGRESO',
    'PAUSADO',
    'COMPLETADO',
    'ARCHIVADO'
  ) DEFAULT 'PLANIFICADO',
  
  `fechaInicio` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  `fechaFin` DATETIME,
  
  `propietarioId` INT NOT NULL,
  
  `miembros` JSON,
  
  `color` VARCHAR(7) DEFAULT '#3B82F6',
  
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`propietarioId`)
  REFERENCES `Users`(`id`)
  ON DELETE CASCADE,

  INDEX `idx_estado` (`estado`),
  
  INDEX `idx_propietarioId` (`propietarioId`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 4. CREAR TABLA DE TABLEROS
CREATE TABLE IF NOT EXISTS `Boards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) DEFAULT 'Tablero Principal',
  `proyectoId` INT NOT NULL UNIQUE,
  `columnas` JSON DEFAULT '[]',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proyectoId) REFERENCES Projects(id) ON DELETE CASCADE,
  INDEX idx_proyectoId (proyectoId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CREAR TABLA DE TAREAS
CREATE TABLE IF NOT EXISTS `Tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `proyectoId` INT NOT NULL,
  `columnaId` INT,
  `creadorId` INT NOT NULL,
  `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') DEFAULT 'MEDIA',
  `tipo` ENUM('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT') DEFAULT 'TASK',
  `fechaLimite` DATETIME,
  `estimacionHoras` DECIMAL(10,2) DEFAULT 0,
  `completada` BOOLEAN DEFAULT FALSE,
  `vencimientoNotificado` BOOLEAN DEFAULT FALSE,
  `etiquetas` JSON DEFAULT '[]',
  `responsables` JSON DEFAULT '[]',
  `subtareas` JSON DEFAULT '[]',
  `comentarios` JSON DEFAULT '[]',
  `adjuntos` JSON DEFAULT '[]',
  `registrosTiempo` JSON DEFAULT '[]',
  `historialCambios` JSON DEFAULT '[]',
  `orden` INT DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`proyectoId`) REFERENCES `Projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`creadorId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  INDEX `idx_proyectoId` (`proyectoId`),
  INDEX `idx_columnaId` (`columnaId`),
  INDEX `idx_prioridad` (`prioridad`),
  INDEX `idx_completada` (`completada`),
  INDEX `idx_fechaLimite` (`fechaLimite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CREAR TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuarioId` INT NOT NULL,
  `tipo` ENUM('ASIGNACION', 'VENCIMIENTO', 'COMENTARIO', 'CAMBIO_ESTADO', 'TAREA_CREADA') NOT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `entidadTipo` ENUM('TASK', 'PROJECT') DEFAULT 'TASK',
  `entidadId` INT NOT NULL,
   `leida` BOOLEAN DEFAULT FALSE,
   `canales` JSON DEFAULT '[]' COMMENT 'Canales por los que se envió: ["DATABASE","EMAIL","SLACK","SMS"]',
   `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_usuarioId (usuarioId),
  INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CREAR TABLA DE REGISTROS DE AUDITORÍA
CREATE TABLE IF NOT EXISTS `AuditLogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,

  `proyectoId` INT NOT NULL,

  `usuarioId` INT NOT NULL,

  `accion` VARCHAR(255) NOT NULL,

  `entidadTipo` ENUM(
    'PROJECT',
    'TASK',
    'BOARD',
    'COMMENT',
    'TIME',
    'SYSTEM'
  ) NOT NULL,

  `entidadId` INT,

  `detalles` JSON,

  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,

  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`proyectoId`)
  REFERENCES `Projects`(`id`)
  ON DELETE CASCADE,

  FOREIGN KEY (`usuarioId`)
  REFERENCES `Users`(`id`)
  ON DELETE CASCADE,

  INDEX `idx_proyectoId` (`proyectoId`),
  INDEX `idx_usuarioId` (`usuarioId`),
  INDEX `idx_entidadTipo` (`entidadTipo`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 8. CREAR TABLA DE FILTROS GUARDADOS
CREATE TABLE IF NOT EXISTS `SavedFilters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,

  `usuarioId` INT NOT NULL,

  `nombre` VARCHAR(255) NOT NULL,

  `criterios` JSON,

  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,

  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`usuarioId`)
  REFERENCES `Users`(`id`)
  ON DELETE CASCADE,

  INDEX `idx_usuarioId` (`usuarioId`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 9. CREAR TABLA DE CONFIGURACIONES DEL SISTEMA
CREATE TABLE IF NOT EXISTS `SystemSettings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,

  `clave` VARCHAR(100) NOT NULL UNIQUE,

  `nombreSistema` VARCHAR(255) DEFAULT 'TaskFlow',

  `limiteArchivoMB` INT DEFAULT 10,

  `politicaPassword` JSON,

  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,

  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_clave` (`clave`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 10. INSERTAR CONFIGURACIÓN INICIAL DEL SISTEMA
INSERT IGNORE INTO `SystemSettings` (`clave`, `nombreSistema`) 
VALUES ('GLOBAL', 'TaskFlow');

-- ============================================
-- ÍNDICES ADICIONALES PARA MEJOR RENDIMIENTO
-- (Los índices principales ya se definieron en el CREATE TABLE)
-- ============================================

-- NOTA: No crear índices duplicados. Los índices existentes son:
-- Tasks: idx_proyectoId, idx_columnaId, idx_prioridad, idx_completada, idx_fechaLimite
-- Projects: idx_estado, idx_propietarioId
-- Users: idx_email, idx_rol
-- Boards: idx_proyectoId
-- Notifications: idx_usuarioId, idx_leida
-- AuditLogs: idx_proyectoId, idx_usuarioId, idx_entidadTipo
-- SavedFilters: idx_usuarioId
-- SystemSettings: idx_clave

-- Si necesitas índices adicionales, asegúrate de que no existan ya.

-- ============================================
-- MIGRACIÓN: Agregar columna canales a Notifications (si no existe)
-- ============================================
ALTER TABLE `Notifications` 
ADD COLUMN IF NOT EXISTS `canales` JSON DEFAULT '[]' COMMENT 'Canales por los que se envió: ["DATABASE","EMAIL","SLACK","SMS"]' 
AFTER `leida`;


