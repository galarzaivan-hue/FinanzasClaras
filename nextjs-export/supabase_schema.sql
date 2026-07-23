-- =========================================================
-- FINANZAS CLARAS - ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- =========================================================

-- Tabla para almacenar el presupuesto o ingresos totales
-- En un entorno real multiusuario, se vincularía con auth.users
CREATE TABLE IF NOT EXISTS perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 14000.00 CHECK (ingreso_total >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar un registro inicial por defecto para el presupuesto local
INSERT INTO perfil_ingresos (id, ingreso_total)
VALUES ('00000000-0000-0000-0000-000000000000', 14000.00)
ON CONFLICT (id) DO NOTHING;

-- Tabla para registrar los gastos (transacciones)
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Comida', 'Transporte', 'Servicios', 'Varios')),
  concepto VARCHAR(150),
  tipo VARCHAR(20) DEFAULT 'gasto' NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sentencia de actualización en caso de que la tabla ya exista pero no tenga las columnas 'tipo' o 'estado':
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'gasto';
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';

-- Índices para optimizar la velocidad de lectura en orden descendente
CREATE INDEX IF NOT EXISTS idx_transacciones_creado_en ON transacciones (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones (estado);

-- =========================================================
-- CONFIGURACIÓN DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- =========================================================
-- Para desarrollo rápido o si encuentras errores de inserción, puedes:
-- OPCIÓN A) Desactivar RLS por completo (Recomendado para pruebas de desarrollo local):
--    ALTER TABLE transacciones DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE perfil_ingresos DISABLE ROW LEVEL SECURITY;
--
-- OPCIÓN B) Mantener RLS activo pero crear políticas públicas de acceso total:

ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_ingresos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen para evitar conflictos
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir acceso total público en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en perfil_ingresos" ON perfil_ingresos;
DROP POLICY IF EXISTS "Permitir acceso total público en perfil_ingresos" ON perfil_ingresos;

-- Crear políticas de acceso total para la clave anónima (pública)
CREATE POLICY "Permitir acceso total público en transacciones" 
ON transacciones 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir acceso total público en perfil_ingresos" 
ON perfil_ingresos 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
