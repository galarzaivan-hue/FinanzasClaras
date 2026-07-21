-- =========================================================
-- FINANZAS CLARAS - ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- =========================================================

-- Tabla para almacenar el presupuesto o ingresos totales
-- En un entorno real multiusuario, se vincularía con auth.users
CREATE TABLE IF NOT EXISTS perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 1000.00 CHECK (ingreso_total >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar un registro inicial por defecto para el presupuesto local
INSERT INTO perfil_ingresos (id, ingreso_total)
VALUES ('00000000-0000-0000-0000-000000000000', 1000.00)
ON CONFLICT (id) DO NOTHING;

-- Tabla para registrar los gastos (transacciones)
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Comida', 'Transporte', 'Servicios', 'Varios')),
  concepto VARCHAR(150),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para optimizar la velocidad de lectura en orden descendente
CREATE INDEX IF NOT EXISTS idx_transacciones_creado_en ON transacciones (creado_en DESC);

-- =========================================================
-- CONFIGURACIÓN DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- =========================================================
-- Si deseas simplificar el desarrollo al inicio, puedes habilitar políticas públicas
-- que permitan leer, insertar y borrar sin autenticación estricta:

ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_ingresos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso libre (Anónimas/Anon Key) para pruebas rápidas:
CREATE POLICY "Permitir todo a usuarios anónimos en transacciones" 
ON transacciones FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios anónimos en perfil_ingresos" 
ON perfil_ingresos FOR ALL 
USING (true) 
WITH CHECK (true);
