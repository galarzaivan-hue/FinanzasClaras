-- ================================================================
-- FINANZAS CLARAS - ESQUEMA MULTI-USUARIO CON SUPABASE AUTH & RLS
-- ================================================================

-- 1. Tabla para registrar los gastos (transacciones) por usuario
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Comida', 'Transporte', 'Servicios', 'Varios')),
  concepto VARCHAR(150),
  tipo VARCHAR(20) DEFAULT 'gasto' NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sentencias de actualización por si la tabla ya existía previamente:
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'gasto';
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';

-- Índices para optimizar velocidad de consultas aisladas por usuario
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON transacciones (user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_creado_en ON transacciones (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones (estado);

-- 2. Tabla para almacenar el presupuesto o ingresos por usuario
CREATE TABLE IF NOT EXISTS perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 14000.00 CHECK (ingreso_total >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE perfil_ingresos ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_perfil_ingresos_user_id ON perfil_ingresos (user_id);

-- ================================================================
-- CONFIGURACIÓN DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_ingresos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Usuarios acceden solo a sus transacciones" ON transacciones;
DROP POLICY IF EXISTS "Usuarios gestionan su propio perfil_ingresos" ON perfil_ingresos;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir acceso total público en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en perfil_ingresos" ON perfil_ingresos;
DROP POLICY IF EXISTS "Permitir acceso total público en perfil_ingresos" ON perfil_ingresos;

-- Crear políticas estrictas por usuario autenticado (auth.uid() = user_id)
CREATE POLICY "Usuarios acceden solo a sus transacciones" 
ON transacciones 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios gestionan su propio perfil_ingresos" 
ON perfil_ingresos 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
