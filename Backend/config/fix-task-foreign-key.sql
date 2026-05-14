-- ============================================
-- FIX: Eliminar la restricción de clave foránea incorrecta en Tasks.columnaId
-- ============================================

-- Mostrar las restricciones actuales (diagnóstico)
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'Tasks' AND COLUMN_NAME = 'columnaId';

-- Eliminar la restricción de clave foránea incorrecta
ALTER TABLE `Tasks` DROP FOREIGN KEY `tasks_ibfk_11`;

-- Verificar que se eliminó correctamente
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'Tasks' AND COLUMN_NAME = 'columnaId';

-- NOTA: columnaId ahora solo almacena un número que referencia una columna dentro
-- de la estructura JSON del tablero (Board.columnas), no es una clave foránea.
