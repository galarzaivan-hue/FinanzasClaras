import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, Database, Shield, Key } from 'lucide-react';

interface SqlInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SqlInstructionsModal({ isOpen, onClose }: SqlInstructionsModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const sqlScript = `-- ================================================================
-- FINANZAS CLARAS - ESQUEMA MULTI-USUARIO CON SUPABASE AUTH & RLS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ================================================================

-- 1. Crear tabla de transacciones con user_id vinculado a auth.users
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

-- Migraciones automáticas por si la tabla ya existía sin estas columnas:
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'gasto';
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';

-- Índices de alta velocidad por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON transacciones (user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_creado_en ON transacciones (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones (estado);

-- 2. Crear tabla de perfil_ingresos (presupuesto individual por usuario)
CREATE TABLE IF NOT EXISTS perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 14000.00 CHECK (ingreso_total >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE perfil_ingresos ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_perfil_ingresos_user_id ON perfil_ingresos (user_id);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_ingresos ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "Usuarios acceden solo a sus transacciones" ON transacciones;
DROP POLICY IF EXISTS "Usuarios gestionan su propio perfil_ingresos" ON perfil_ingresos;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir acceso total público en transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos en perfil_ingresos" ON perfil_ingresos;
DROP POLICY IF EXISTS "Permitir acceso total público en perfil_ingresos" ON perfil_ingresos;

-- 4. POLÍTICAS RLS AISLADAS POR USUARIO (auth.uid() = user_id)
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
`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl max-w-lg w-full text-left flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
            <Database className="h-4 w-4" />
            <h3>Configuración Multi-usuario & RLS</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Explicación de 3 pasos */}
        <div className="flex flex-col gap-2 text-xs text-slate-300">
          <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Aislamiento total de datos:</strong> Cada transacción y presupuesto se vincula a tu <code>user_id</code> de Supabase Auth. Nadie más podrá leer ni modificar tus finanzas.
            </p>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 list-decimal list-inside px-1">
            <p>1. Ve al <strong>SQL Editor</strong> en tu panel de <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Supabase Dashboard</a>.</p>
            <p>2. Pega el siguiente script SQL y presiona <strong>RUN</strong>.</p>
            <p>3. ¡Listo! RLS quedará activo y protegerá automáticamente cada cuenta.</p>
          </div>
        </div>

        {/* Bloque de código SQL */}
        <div className="relative flex-1 min-h-[160px] bg-slate-950 border border-slate-800 rounded-2xl p-3 overflow-y-auto font-mono text-[10px] text-emerald-300 leading-relaxed scrollbar-thin">
          <pre>{sqlScript}</pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
