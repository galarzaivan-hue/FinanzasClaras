import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  X, 
  FileCode, 
  Database, 
  Smartphone, 
  ChevronRight, 
  Copy, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  CheckCircle2,
  Share2
} from 'lucide-react';

// Interfaces para tipado estricto
interface Transaccion {
  id: string;
  monto: number;
  categoria: 'Comida' | 'Transporte' | 'Servicios' | 'Varios';
  concepto: string;
  creado_en: string;
}

export default function App() {
  // Estado de persistencia local
  const [ingresoTotal, setIngresoTotal] = useState<number>(() => {
    const saved = localStorage.getItem('fc_ingreso_total');
    return saved ? Number(saved) : 1500;
  });

  const [transacciones, setTransacciones] = useState<Transaccion[]>(() => {
    const saved = localStorage.getItem('fc_transacciones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Datos iniciales de demostración para una experiencia de usuario inmediata
    return [
      { id: '1', monto: 12.50, categoria: 'Comida', concepto: 'Café de la mañana', creado_en: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', monto: 45.00, categoria: 'Servicios', concepto: 'Suscripción de streaming', creado_en: new Date(Date.now() - 14400000).toISOString() },
      { id: '3', monto: 15.00, categoria: 'Transporte', concepto: 'Viaje en metro/bus', creado_en: new Date(Date.now() - 86400000).toISOString() }
    ];
  });

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('fc_ingreso_total', ingresoTotal.toString());
  }, [ingresoTotal]);

  useEffect(() => {
    localStorage.setItem('fc_transacciones', JSON.stringify(transacciones));
  }, [transacciones]);

  // Estados del formulario y UI
  const [monto, setMonto] = useState<string>('');
  const [categoria, setCategoria] = useState<'Comida' | 'Transporte' | 'Servicios' | 'Varios'>('Comida');
  const [concepto, setConcepto] = useState<string>('');
  const [isEditingIngreso, setIsEditingIngreso] = useState<boolean>(false);
  const [tempIngreso, setTempIngreso] = useState<string>('');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  // Navegación / pestañas de la simulación
  const [currentTab, setCurrentTab] = useState<'app' | 'developer'>('app');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Categorías rápidas para completar en 1 segundo
  const sugerenciasRapidas: Record<string, string[]> = {
    Comida: ['Almuerzo', 'Café', 'Cena', 'Supermercado', 'Snack'],
    Transporte: ['Uber/Didi', 'Gasolina', 'Metro/Bus', 'Estacionamiento', 'Peaje'],
    Servicios: ['Luz/Agua', 'Internet', 'Celular', 'Netflix/Spotify', 'Gimnasio'],
    Varios: ['Ropa', 'Regalo', 'Farmacia', 'Cine', 'Otros']
  };

  // Disparar notificaciones flotantes de feedback
  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Registrar un gasto rápido
  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = Number(monto);
    if (!monto || isNaN(valMonto) || valMonto <= 0) {
      triggerNotification('⚠️ Ingresa un monto válido mayor a 0');
      return;
    }

    const nuevaTransaccion: Transaccion = {
      id: crypto.randomUUID(),
      monto: valMonto,
      categoria,
      concepto: concepto.trim() || `Gasto en ${categoria}`,
      creado_en: new Date().toISOString()
    };

    setTransacciones((prev) => [nuevaTransaccion, ...prev]);
    setMonto('');
    setConcepto('');
    triggerNotification('⚡ Gasto registrado exitosamente');
  };

  // Eliminar transacción
  const handleDeleteGasto = (id: string) => {
    setTransacciones((prev) => prev.filter((t) => t.id !== id));
    triggerNotification('🗑️ Transacción eliminada');
  };

  // Guardar nuevo presupuesto
  const handleSaveIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    const valIngreso = Number(tempIngreso);
    if (isNaN(valIngreso) || valIngreso < 0) {
      triggerNotification('⚠️ Ingresa un presupuesto válido');
      return;
    }
    setIngresoTotal(valIngreso);
    setIsEditingIngreso(false);
    triggerNotification('💼 Presupuesto actualizado');
  };

  // Copiar código al portapapeles
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Cálculos financieros
  const totalGastos = transacciones.reduce((acc, curr) => acc + curr.monto, 0);
  const saldoDisponible = ingresoTotal - totalGastos;
  const porcentajeGastado = ingresoTotal > 0 ? (totalGastos / ingresoTotal) * 100 : 0;

  // Iconos y colores por categoría
  const infoCategorias = {
    Comida: { icon: '🍔', color: 'orange', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
    Transporte: { icon: '🚗', color: 'blue', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25' },
    Servicios: { icon: '💡', color: 'purple', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
    Varios: { icon: '🛍️', color: 'pink', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25' }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f3f4f6] flex flex-col items-center justify-start py-6 px-4 md:py-12 relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Fondo de Luces Ambientales de Alta Costura */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Notificación flotante */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 z-50 px-4 py-3 bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold text-slate-100"
          >
            <span>{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* COLUMNA IZQUIERDA: CONTEXTO DEL PROYECTO & ARQUITECTURA */}
        <div className="lg:col-span-5 flex flex-col gap-6 text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Arquitectura Senior PWA</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Finanzas<span className="text-emerald-400">Claras</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Un gestor de gastos móviles de carga ultra-rápida. Diseñado exclusivamente para el uso diario en calle: registra cualquier egreso en menos de 5 segundos con feedback en tiempo real.
            </p>
          </div>

          {/* Tarjetas informativas del Ecosistema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Database className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Persistencia Cloud</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Integración optimizada con <strong>Supabase Postgres</strong> para almacenamiento persistente y sincronización segura en tiempo real.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Smartphone className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Instalación PWA</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Cumple con el estándar PWA móvil. Archivo <code>manifest.json</code> configurado para ocultar barras de navegación y crear icono en el escritorio.
              </p>
            </div>
          </div>

          {/* Menú de pestañas en versión Desktop para ver la documentación/código */}
          <div className="bg-slate-900/60 p-1.5 border border-slate-800 rounded-2xl flex gap-1">
            <button
              onClick={() => setCurrentTab('app')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentTab === 'app' 
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Ver App Celular</span>
            </button>
            <button
              onClick={() => setCurrentTab('developer')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentTab === 'developer' 
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Código & Supabase SQL</span>
            </button>
          </div>

          {/* Sección rápida de características */}
          <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl text-xs flex flex-col gap-3">
            <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-emerald-400" />
              <span>Instrucciones del Entorno de Desarrollo</span>
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>La simulación derecha cuenta con <strong>Persistencia Local Automática</strong>. Al recargar la página no perderás tu información.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Haz clic en la pestaña <strong>Código & Supabase SQL</strong> para copiar de inmediato los entregables de Next.js.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Todos los archivos Next.js listados ya fueron pre-creados en la carpeta raíz <code>/nextjs-export/</code> de este espacio.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUMNA DERECHA: INTERFAZ DINÁMICA DE LA APLICACIÓN */}
        <div className="lg:col-span-7 flex justify-center items-center">
          
          <AnimatePresence mode="wait">
            {currentTab === 'app' ? (
              <motion.div
                key="phone-frame"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[420px] bg-slate-950 border-[6px] border-slate-800 rounded-[44px] shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden aspect-[9/19] flex flex-col"
              >
                {/* Altavoz frontal simulado del Celular */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
                </div>

                {/* Status Bar Simulada */}
                <div className="pt-8 px-6 pb-2 flex justify-between items-center text-[10px] font-mono text-slate-400 select-none z-20">
                  <span>12:45 PM</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold scale-[0.85]">
                      PWA
                    </span>
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  </div>
                </div>

                {/* CONTENIDO INTERNO DEL CELULAR */}
                <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1 flex flex-col gap-5 scrollbar-thin">
                  
                  {/* Header de la Aplicación */}
                  <header className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/10">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-extrabold text-white tracking-tight">FinanzasClaras</h2>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-emerald-400 font-mono font-medium">
                      ● LocalStorage
                    </span>
                  </header>

                  {/* 1. TARJETA DE BALANCE DESTACADA */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Saldo Disponible</p>
                        <h3 className={`text-2xl font-mono font-bold tracking-tight mt-0.5 ${saldoDisponible >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${saldoDisponible.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                      </div>

                      {/* Círculo indicador de presupuesto consumido */}
                      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="22" cy="22" r="18" stroke="#1e293b" strokeWidth="3" fill="transparent" />
                          <circle 
                            cx="22" 
                            cy="22" 
                            r="18" 
                            stroke={porcentajeGastado >= 90 ? '#f43f5e' : porcentajeGastado >= 65 ? '#f59e0b' : '#10b981'} 
                            strokeWidth="3" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 18}
                            strokeDashoffset={2 * Math.PI * 18 * (1 - Math.min(porcentajeGastado, 100) / 100)}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className="absolute text-[9px] font-mono font-bold text-slate-300">
                          {Math.round(porcentajeGastado)}%
                        </span>
                      </div>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-slate-800/80 my-3"></div>

                    {/* Ingreso vs Gastado */}
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Ingreso</span>
                          <button 
                            onClick={() => {
                              setIsEditingIngreso(true);
                              setTempIngreso(ingresoTotal.toString());
                            }}
                            className="text-[9px] text-emerald-400 hover:underline hover:text-emerald-300 cursor-pointer"
                          >
                            (Editar)
                          </button>
                        </div>

                        {isEditingIngreso ? (
                          <form onSubmit={handleSaveIngreso} className="flex gap-1 mt-1">
                            <input
                              type="number"
                              value={tempIngreso}
                              onChange={(e) => setTempIngreso(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded focus:outline-none focus:border-emerald-500 font-mono text-white"
                              autoFocus
                            />
                            <button type="submit" className="p-1 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400">
                              <Check className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={() => setIsEditingIngreso(false)} className="p-1 bg-slate-800 text-slate-400 rounded">
                              <X className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm font-mono font-bold text-white mt-0.5">
                            ${ingresoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Gastos</span>
                        <p className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                          ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. FORMULARIO ULTRA-RÁPIDO DE REGISTRO */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-md text-left">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="text-emerald-400">⚡</span> Registrar Gasto Rápido
                    </h4>

                    <form onSubmit={handleAddGasto} className="flex flex-col gap-3.5">
                      {/* Input de Monto */}
                      <div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                          <input
                            type="number"
                            pattern="[0-9]*"
                            inputMode="decimal"
                            step="any"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-8 pr-4 text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-800 transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Botones de Categorías Grandes */}
                      <div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['Comida', 'Transporte', 'Servicios', 'Varios'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategoria(cat);
                                // Sugerir un concepto por defecto si el usuario cambia de categoría
                                setConcepto('');
                              }}
                              className={`py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                categoria === cat
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-[1.03] shadow-md shadow-emerald-500/10'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                              }`}
                            >
                              <span className="text-sm">{infoCategorias[cat].icon}</span>
                              <span className="font-medium text-[9px]">{cat}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Concepto Opcional con sugerencias inteligentes */}
                      <div>
                        <input
                          type="text"
                          value={concepto}
                          onChange={(e) => setConcepto(e.target.value)}
                          placeholder="Concepto (Ej: Café, Uber, Luz)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white placeholder-slate-700 transition-all"
                        />
                        
                        {/* Tags Recomendados de Autocompletado */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sugerenciasRapidas[categoria].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setConcepto(sug)}
                              className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                concepto === sug
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                              }`}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Botón Guardar */}
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider shadow-md shadow-emerald-500/10 transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>GUARDAR GASTO EN 2s</span>
                      </button>
                    </form>
                  </div>

                  {/* 3. HISTORIAL DE GASTOS */}
                  <div className="flex-1 flex flex-col text-left min-h-[160px]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>📋</span> Historial Reciente
                      </h4>
                      <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                        {transacciones.length} items
                      </span>
                    </div>

                    {transacciones.length === 0 ? (
                      <div className="flex-1 bg-slate-900/30 border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-500 text-center gap-1.5">
                        <span className="text-xl">☕</span>
                        <p className="text-[10px] font-bold text-slate-400">Sin egresos hoy</p>
                        <p className="text-[9px] text-slate-500 max-w-[200px]">¡Buen trabajo manteniendo tu dinero intacto!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px] pr-0.5 scrollbar-thin">
                        <AnimatePresence initial={false}>
                          {transacciones.map((t) => {
                            const info = infoCategorias[t.categoria] || { icon: '💰', bg: 'bg-slate-850' };
                            return (
                              <motion.div
                                key={t.id}
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 flex items-center justify-between hover:border-slate-800 transition-all"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.bg}`}>
                                    <span className="text-sm">{info.icon}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white line-clamp-1">
                                      {t.concepto}
                                    </span>
                                    <span className="text-[8px] text-slate-500 uppercase mt-0.5 font-semibold">
                                      {t.categoria} • {new Date(t.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-xs font-bold text-rose-400">
                                    -${t.monto.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteGasto(t.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                </div>

                {/* Barra de navegación inferior simulada para PWA */}
                <div className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-2.5 px-6 flex justify-around items-center text-[10px] text-slate-400 font-bold z-20">
                  <button 
                    onClick={() => setCurrentTab('app')} 
                    className="flex flex-col items-center gap-1 text-emerald-400 transition-all cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Aplicación</span>
                  </button>
                  <button 
                    onClick={() => setCurrentTab('developer')} 
                    className="flex flex-col items-center gap-1 hover:text-white transition-all cursor-pointer"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>Código Export</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              // TAB DESARROLLADOR: VISUALIZACIÓN DE ARCHIVOS EXPORTABLES
              <motion.div
                key="dev-hub"
                initial={{ opacity: 0, scale: 0.98, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col text-left gap-5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Entregables Next.js + Supabase</h3>
                      <p className="text-[10px] text-slate-400">Archivos pre-creados en este repositorio para exportación</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('app')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer text-slate-300"
                  >
                    Regresar a la App
                  </button>
                </div>

                {/* Grid con archivos exportados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File 1: supabase_schema.sql */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        supabase_schema.sql
                      </span>
                      <button
                        onClick={() => handleCopyCode(`-- Crear tabla de perfil de ingresos
CREATE TABLE IF NOT EXISTS perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 1000.00 CHECK (ingreso_total >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Comida', 'Transporte', 'Servicios', 'Varios')),
  concepto VARCHAR(150),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);`, 'sql')}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedText === 'sql' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedText === 'sql' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 h-28">
{`CREATE TABLE perfil_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingreso_total NUMERIC NOT NULL DEFAULT 1000
);

CREATE TABLE transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria VARCHAR(50) NOT NULL,
  concepto VARCHAR(150)
);`}
                    </pre>
                  </div>

                  {/* File 2: supabaseClient.js */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-sky-400 font-semibold bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                        lib/supabaseClient.js
                      </span>
                      <button
                        onClick={() => handleCopyCode(`import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);`, 'client')}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedText === 'client' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedText === 'client' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 h-28">
{`import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`}
                    </pre>
                  </div>

                  {/* File 3: manifest.json */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2.5 relative md:col-span-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-pink-400 font-semibold bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md">
                        public/manifest.json
                      </span>
                      <button
                        onClick={() => handleCopyCode(`{
  "short_name": "FinanzasClaras",
  "name": "FinanzasClaras",
  "display": "standalone",
  "orientation": "portrait"
}`, 'manifest')}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedText === 'manifest' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedText === 'manifest' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 h-28">
{`{
  "short_name": "FinanzasClaras",
  "name": "FinanzasClaras: Gestor de Gastos Ultra-Rápido",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#0b0f19"
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Beneficios de esta Arquitectura</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Al utilizar <strong>Next.js App Router</strong> para la interfaz móvil y <strong>Supabase</strong> para el almacenamiento, tu aplicación será de carga instantánea en teléfonos (gracias a la compilación nativa en Vercel) y tus transacciones se guardarán de forma descentralizada y duradera con seguridad Postgres.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
