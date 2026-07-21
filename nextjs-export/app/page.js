'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  // Estados para datos financieros
  const [ingresoTotal, setIngresoTotal] = useState(1200);
  const [gastos, setGastos] = useState([]);
  const [isEditingIngreso, setIsEditingIngreso] = useState(false);
  const [tempIngreso, setTempIngreso] = useState('');

  // Estados para el formulario
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Comida');
  const [concepto, setConcepto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      // 1. Obtener transacciones
      const { data: transaccionesData, error: transaccionesError } = await supabase
        .from('transacciones')
        .select('*')
        .order('creado_en', { ascending: false });

      if (transaccionesError) throw transaccionesError;
      setGastos(transaccionesData || []);

      // 2. Obtener perfil de ingresos (un solo registro id de ceros por simplicidad)
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfil_ingresos')
        .select('ingreso_total')
        .single();

      if (!perfilError && perfilData) {
        setIngresoTotal(Number(perfilData.ingreso_total));
      } else if (perfilError && perfilError.code === 'PGRST116') {
        // Si no existe, creamos el registro inicial
        const defaultId = '00000000-0000-0000-0000-000000000000';
        await supabase.from('perfil_ingresos').insert({ id: defaultId, ingreso_total: 1200 });
        setIngresoTotal(1200);
      }
    } catch (error) {
      console.error('Error cargando datos de Supabase:', error.message);
      setErrorMessage('Error al conectar con Supabase. Asegúrate de configurar las variables de entorno.');
    } finally {
      setIsLoading(false);
    }
  }

  // Guardar nuevo gasto
  async function handleAddGasto(e) {
    e.preventDefault();
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const nuevoGasto = {
        monto: Number(monto),
        categoria,
        concepto: concepto.trim() || null,
      };

      const { data, error } = await supabase
        .from('transacciones')
        .insert([nuevoGasto])
        .select();

      if (error) throw error;

      // Actualizar estado local al instante
      if (data && data[0]) {
        setGastos((prev) => [data[0], ...prev]);
      } else {
        // Fallback si no retorna datos
        fetchData();
      }

      // Resetear formulario con feedback rápido
      setMonto('');
      setConcepto('');
    } catch (error) {
      console.error('Error insertando gasto:', error.message);
      setErrorMessage('No se pudo guardar el gasto en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Eliminar un gasto
  async function handleDeleteGasto(id) {
    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Filtrar localmente
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Error eliminando gasto:', error.message);
      setErrorMessage('No se pudo eliminar la transacción.');
    }
  }

  // Actualizar el presupuesto / ingresos
  async function handleUpdateIngreso(e) {
    e.preventDefault();
    const nuevoMonto = Number(tempIngreso);
    if (isNaN(nuevoMonto) || nuevoMonto < 0) {
      setErrorMessage('Ingresa un presupuesto inicial válido.');
      return;
    }

    try {
      const defaultId = '00000000-0000-0000-0000-000000000000';
      const { error } = await supabase
        .from('perfil_ingresos')
        .upsert({ id: defaultId, ingreso_total: nuevoMonto, updated_at: new Date() });

      if (error) throw error;

      setIngresoTotal(nuevoMonto);
      setIsEditingIngreso(false);
    } catch (error) {
      console.error('Error actualizando presupuesto:', error.message);
      setErrorMessage('Error al actualizar el presupuesto en la base de datos.');
    }
  }

  // Cálculos rápidos
  const totalGastos = gastos.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const saldoDisponible = ingresoTotal - totalGastos;
  const porcentajeGastado = ingresoTotal > 0 ? (totalGastos / ingresoTotal) * 100 : 0;

  // Iconos de categoría
  const categoryIcons = {
    Comida: '🍔',
    Transporte: '🚗',
    Servicios: '💡',
    Varios: '🛍️',
  };

  const categoryBgColors = {
    Comida: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    Transporte: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Servicios: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    Varios: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] font-sans antialiased flex flex-col items-center justify-start p-4 pb-12">
      {/* Contenedor optimizado para pantalla de celular */}
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-xl font-bold tracking-tight text-white">FinanzasClaras</h1>
          </div>
          <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded-full text-emerald-400">
            ● Supabase Cloud
          </span>
        </header>

        {/* Mensaje de error si existe */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex justify-between items-start">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="ml-2 text-red-400 font-bold">×</button>
          </div>
        )}

        {/* 1. TARJETA DE BALANCE DESTACADA */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Saldo Disponible</p>
              <h2 className={`text-3xl font-mono font-bold mt-1 tracking-tight ${saldoDisponible >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${saldoDisponible.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            {/* Círculo indicador de presupuesto consumido */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  stroke={porcentajeGastado >= 90 ? '#f43f5e' : porcentajeGastado >= 65 ? '#f59e0b' : '#10b981'} 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(porcentajeGastado, 100) / 100)}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-mono text-slate-300">
                {Math.round(porcentajeGastado)}%
              </span>
            </div>
          </div>

          {/* Línea divisoria */}
          <div className="border-t border-slate-800 my-4"></div>

          {/* Ingreso vs Gastos Totales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Ingreso Total</span>
                <button 
                  onClick={() => {
                    setIsEditingIngreso(true);
                    setTempIngreso(ingresoTotal.toString());
                  }} 
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  (Editar)
                </button>
              </div>

              {isEditingIngreso ? (
                <form onSubmit={handleUpdateIngreso} className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={tempIngreso}
                    onChange={(e) => setTempIngreso(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-emerald-500 font-mono text-white"
                    autoFocus
                  />
                  <button type="submit" className="px-1.5 py-0.5 bg-emerald-500 text-xs rounded text-slate-950 font-bold hover:bg-emerald-400">✓</button>
                  <button type="button" onClick={() => setIsEditingIngreso(false)} className="px-1.5 py-0.5 bg-slate-800 text-xs rounded text-slate-400">×</button>
                </form>
              ) : (
                <p className="text-lg font-mono font-bold text-white mt-0.5">
                  ${ingresoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Gastado Total</p>
              <p className="text-lg font-mono font-bold text-rose-400 mt-0.5">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        {/* 2. FORMULARIO ULTRA-RÁPIDO DE REGISTRO */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>⚡</span> Registrar Gasto Rápido
          </h3>

          <form onSubmit={handleAddGasto} className="flex flex-col gap-4">
            {/* Input de Monto */}
            <div>
              <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Monto ($)*</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xl">$</span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="decimal"
                  step="any"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-9 pr-4 text-xl font-mono font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-700 transition-all"
                  required
                />
              </div>
            </div>

            {/* Categorías Básicas - Botones Táctiles Grandes */}
            <div>
              <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">Categoría*</label>
              <div className="grid grid-cols-4 gap-2">
                {['Comida', 'Transporte', 'Servicios', 'Varios'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`py-2 px-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition-all ${
                      categoria === cat
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-105 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">{categoryIcons[cat]}</span>
                    <span className="text-[10px] font-medium">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Concepto Opcional */}
            <div>
              <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Concepto (Opcional)</label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Almuerzo, Uber, Luz"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-700 transition-all"
              />
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>⚡ Guardar Gasto</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* 3. HISTORIAL DE TRANSACCIONES */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col min-h-[250px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> Historial Reciente
            </h3>
            <span className="text-[10px] bg-slate-850 px-2 py-1 rounded-full text-slate-400 font-mono">
              {gastos.length} Transacciones
            </span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
              <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs">Conectando a base de datos...</p>
            </div>
          ) : gastos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center gap-2">
              <span className="text-3xl">☕</span>
              <p className="text-xs font-medium">No hay gastos registrados hoy.</p>
              <p className="text-[10px] text-slate-600 px-6">¡Qué gran día! Los gastos que guardes aparecerán ordenados en esta sección.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px] pr-1">
              {gastos.map((gasto) => (
                <div
                  key={gasto.id}
                  className="bg-slate-950 border border-slate-850 rounded-2xl p-3 flex items-center justify-between hover:border-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Círculo Categoría */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryBgColors[gasto.categoria] || 'bg-slate-800'}`}>
                      <span className="text-base">{categoryIcons[gasto.categoria] || '💰'}</span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">
                        {gasto.concepto || gasto.categoria}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(gasto.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} • {new Date(gasto.creado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Monto y Botón de Eliminar */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-rose-400">
                      -${Number(gasto.monto).toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => handleDeleteGasto(gasto.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all active:scale-95 cursor-pointer"
                      title="Eliminar transacción"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-500 flex flex-col gap-1 mt-2">
          <p>FinanzasClaras PWA • Diseñado exclusivamente para celular</p>
          <p className="text-[10px] text-slate-600">Base de Datos gestionada en Supabase</p>
        </footer>
      </div>
    </main>
  );
}
