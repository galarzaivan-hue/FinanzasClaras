import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Database, 
  ChevronRight, 
  Lock, 
  Download,
  RefreshCw,
  LogOut,
  User,
  Shield,
  HelpCircle
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { Transaccion, CategoriaType } from './types';
import AuthScreen from './components/AuthScreen';
import SqlInstructionsModal from './components/SqlInstructionsModal';

export default function App() {
  // Estados de Autenticación de Supabase
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  // Estados de Conexión a Supabase Cloud
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [checkingSupabase, setCheckingSupabase] = useState<boolean>(false);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  // Estado de presupuesto/ingreso total
  const [ingresoTotal, setIngresoTotal] = useState<number>(14000);

  // Estado de lista de transacciones activas
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

  // Estados para Cierre de Ciclo e Historial Archivado
  const [showConfirmCerrarCiclo, setShowConfirmCerrarCiclo] = useState<boolean>(false);
  const [isClosingCycle, setIsClosingCycle] = useState<boolean>(false);
  const [showHistorialArchivado, setShowHistorialArchivado] = useState<boolean>(false);
  const [transaccionesArchivadas, setTransaccionesArchivadas] = useState<Transaccion[]>([]);
  const [loadingArchivados, setLoadingArchivados] = useState<boolean>(false);

  // Estados para PWA Installation Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // Estados del formulario y UI
  const [monto, setMonto] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaType>('Comida');
  const [concepto, setConcepto] = useState<string>('');
  const [isEditingIngreso, setIsEditingIngreso] = useState<boolean>(false);
  const [tempIngreso, setTempIngreso] = useState<string>('');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Disparar notificaciones flotantes de feedback
  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 3500);
  };

  // 1. Inicialización y Listener de Supabase Auth
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            loadUserData(session.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Error al verificar sesión:', err);
      } finally {
        if (mounted) setAuthChecking(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsGuestMode(false);
        loadUserData(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Listener para capturar el evento 'beforeinstallprompt' de la PWA
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
      setIsAppInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choiceResult: any) => {
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsAppInstalled(true);
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
        }
      });
    }
  };

  // Cargar datos del usuario desde Supabase con aislamiento por user_id
  const loadUserData = async (currentUser: any) => {
    if (!currentUser) return;
    setCheckingSupabase(true);
    setSupabaseErrorMsg(null);

    const userStorageKey = `fc_transacciones_${currentUser.id}`;
    const budgetStorageKey = `fc_ingreso_total_${currentUser.id}`;

    // Cargar caché local del usuario primero si existe
    const cachedBudget = localStorage.getItem(budgetStorageKey);
    if (cachedBudget) {
      setIngresoTotal(Number(cachedBudget));
    }

    const cachedTrans = localStorage.getItem(userStorageKey);
    if (cachedTrans) {
      try {
        const parsed: Transaccion[] = JSON.parse(cachedTrans);
        setTransacciones(parsed.filter((t) => !t.estado || t.estado === 'activo'));
      } catch (e) {
        console.warn('Error leyendo caché local:', e);
      }
    }

    try {
      // 1. Consultar transacciones activas filtradas por user_id
      let activeTrans: Transaccion[] = [];
      const { data: activeData, error: transError } = await supabase
        .from('transacciones')
        .select('*')
        .eq('user_id', currentUser.id)
        .or('estado.eq.activo,estado.is.null')
        .order('creado_en', { ascending: false });

      if (transError) {
        // Fallback si la columna user_id o estado aún no están presentes en la BD del usuario
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('transacciones')
          .select('*')
          .order('creado_en', { ascending: false });

        if (fallbackError) throw fallbackError;
        activeTrans = (fallbackData || []).filter((t: any) => (!t.user_id || t.user_id === currentUser.id) && (!t.estado || t.estado === 'activo'));
      } else {
        activeTrans = activeData || [];
      }

      setTransacciones(activeTrans);
      localStorage.setItem(userStorageKey, JSON.stringify(activeTrans));

      // 2. Consultar perfil de ingresos aislado por user_id
      try {
        const { data: perfilData, error: perfilError } = await supabase
          .from('perfil_ingresos')
          .select('ingreso_total')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (perfilError) {
          console.warn('Advertencia al consultar perfil_ingresos por user_id:', perfilError);
        } else if (perfilData && perfilData.ingreso_total !== undefined) {
          const val = Number(perfilData.ingreso_total);
          setIngresoTotal(val);
          localStorage.setItem(budgetStorageKey, val.toString());
        } else {
          // Inicializar perfil para este nuevo usuario
          await supabase.from('perfil_ingresos').upsert({
            user_id: currentUser.id,
            ingreso_total: 14000
          }, { onConflict: 'user_id' });
          setIngresoTotal(14000);
          localStorage.setItem(budgetStorageKey, '14000');
        }
      } catch (perfilErr) {
        console.warn('No se pudo sincronizar perfil_ingresos:', perfilErr);
      }

      setSupabaseConnected(true);
      setSupabaseErrorMsg(null);
      triggerNotification('☁️ Datos sincronizados con tu cuenta');
    } catch (err: any) {
      console.warn('Error al verificar conexión con Supabase:', err);
      setSupabaseConnected(false);

      const isFetchError = err?.message?.includes('Failed to fetch') || err?.name === 'TypeError';
      if (isFetchError) {
        setSupabaseErrorMsg('⚠️ Error de red: No se pudo conectar con el servidor de Supabase.');
      } else {
        setSupabaseErrorMsg(`⚠️ Aviso de Supabase: ${err?.message || 'Revisa la configuración de tablas y RLS'}`);
      }
    } finally {
      setCheckingSupabase(false);
    }
  };

  // Cargar historial de gastos archivados del usuario
  const loadArchivadoData = async () => {
    setLoadingArchivados(true);
    try {
      if (supabaseConnected && user?.id) {
        const { data, error } = await supabase
          .from('transacciones')
          .select('*')
          .eq('user_id', user.id)
          .eq('estado', 'archivado')
          .order('creado_en', { ascending: false });

        if (error) throw error;
        setTransaccionesArchivadas(data || []);
      } else {
        const userStorageKey = user?.id ? `fc_transacciones_${user.id}` : 'fc_transacciones';
        const savedTrans = localStorage.getItem(userStorageKey);
        if (savedTrans) {
          const parsed: Transaccion[] = JSON.parse(savedTrans);
          setTransaccionesArchivadas(parsed.filter((t) => t.estado === 'archivado'));
        } else {
          setTransaccionesArchivadas([]);
        }
      }
    } catch (err) {
      console.error('Error cargando historial archivado:', err);
    } finally {
      setLoadingArchivados(false);
    }
  };

  // Categorías rápidas para completar en 1 segundo
  const sugerenciasRapidas: Record<CategoriaType, string[]> = {
    Comida: ['Almuerzo', 'Café', 'Cena', 'Supermercado', 'Snack'],
    Transporte: ['Uber/Didi', 'Gasolina', 'Metro/Bus', 'Estacionamiento', 'Peaje'],
    Servicios: ['Luz/Agua', 'Internet', 'Celular', 'Netflix/Spotify', 'Gimnasio'],
    Varios: ['Ropa', 'Regalo', 'Farmacia', 'Cine', 'Otros']
  };

  // Registrar un gasto rápido (con user_id)
  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = Number(monto);
    if (!monto || isNaN(valMonto) || valMonto <= 0) {
      triggerNotification('⚠️ Ingresa un monto válido mayor a 0');
      return;
    }

    const conceptoLimpio = concepto.trim() || `Gasto en ${categoria}`;
    const nuevoGastoConUser: any = {
      monto: valMonto,
      categoria,
      concepto: conceptoLimpio,
      tipo: 'gasto',
      estado: 'activo'
    };

    if (user?.id) {
      nuevoGastoConUser.user_id = user.id;
    }

    if (supabaseConnected) {
      try {
        let { data, error } = await supabase
          .from('transacciones')
          .insert([nuevoGastoConUser])
          .select();

        // Fallback por si la columna 'user_id' o 'estado' no existe en la tabla previa
        if (error && (error.message?.includes('user_id') || error.message?.includes('estado') || error.code === 'PGRST204' || error.code === '42703')) {
          console.warn('Reintentando inserción sin columnas opcionales...');
          const gastoBasico: any = {
            monto: valMonto,
            categoria,
            concepto: conceptoLimpio
          };
          if (user?.id) gastoBasico.user_id = user.id;
          const retryRes = await supabase.from('transacciones').insert([gastoBasico]).select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) throw error;

        if (data && data[0]) {
          const itemInsertado: Transaccion = {
            ...data[0],
            estado: data[0].estado || 'activo'
          };
          setTransacciones((prev) => [itemInsertado, ...prev]);
          
          // Actualizar caché local
          const userStorageKey = user?.id ? `fc_transacciones_${user.id}` : 'fc_transacciones';
          const updated = [itemInsertado, ...transacciones];
          localStorage.setItem(userStorageKey, JSON.stringify(updated));
          
          triggerNotification('⚡ Gasto guardado en tu cuenta!');
        } else {
          loadUserData(user);
        }
      } catch (err: any) {
        console.error('Error insertando en Supabase:', err);
        triggerNotification('⚠️ Guardado en caché local');
        const localTx: Transaccion = {
          id: crypto.randomUUID(),
          user_id: user?.id,
          monto: valMonto,
          categoria,
          concepto: conceptoLimpio,
          estado: 'activo',
          creado_en: new Date().toISOString()
        };
        setTransacciones((prev) => [localTx, ...prev]);
      }
    } else {
      // Local / Offline
      const localTx: Transaccion = {
        id: crypto.randomUUID(),
        user_id: user?.id,
        monto: valMonto,
        categoria,
        concepto: conceptoLimpio,
        estado: 'activo',
        creado_en: new Date().toISOString()
      };
      setTransacciones((prev) => [localTx, ...prev]);
      const userStorageKey = user?.id ? `fc_transacciones_${user.id}` : 'fc_transacciones';
      localStorage.setItem(userStorageKey, JSON.stringify([localTx, ...transacciones]));
      triggerNotification('⚡ Gasto registrado localmente');
    }

    setMonto('');
    setConcepto('');
  };

  // Helper para escapar campos CSV
  const escapeCsvField = (field: string | number) => {
    const stringified = String(field ?? '');
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  // Generar y descargar reporte CSV del ciclo
  const generarYDescargarReporteCSV = (items: Transaccion[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = `FinanzasClaras_Cierre_${year}-${month}.csv`;

    const headers = ['Fecha y Hora', 'Categoría', 'Concepto / Nota', 'Monto en Bs', 'Estado'];
    
    const rows = items.map((t) => {
      const info = infoCategorias[t.categoria] || { icon: '💰' };
      const catConEmoji = `${info.icon} ${t.categoria}`;
      const fechaFormatted = new Date(t.creado_en).toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return [
        escapeCsvField(fechaFormatted),
        escapeCsvField(catConEmoji),
        escapeCsvField(t.concepto || `Gasto en ${t.categoria}`),
        escapeCsvField(Number(t.monto).toFixed(2)),
        escapeCsvField('archivado')
      ].join(',');
    });

    const totalGastos = items.reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
    const summaryRow = [
      escapeCsvField('Suma Total de Gastos'),
      '',
      '',
      escapeCsvField(totalGastos.toFixed(2)),
      ''
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cierre de Ciclo
  const handleCerrarCiclo = async () => {
    setIsClosingCycle(true);
    try {
      const transaccionesCiclo = [...transacciones];

      // 1. Descargar archivo .csv
      try {
        generarYDescargarReporteCSV(transaccionesCiclo);
      } catch (csvErr) {
        console.error('Error al generar el reporte CSV:', csvErr);
      }

      if (supabaseConnected && user?.id) {
        // 2. Actualizar estado a 'archivado' en Supabase solo para este user_id
        const activeIds = transaccionesCiclo.map((t) => t.id);
        if (activeIds.length > 0) {
          try {
            await supabase
              .from('transacciones')
              .update({ estado: 'archivado' })
              .eq('user_id', user.id)
              .in('id', activeIds);
          } catch (e) {
            console.warn('Error al archivar en Supabase:', e);
          }
        }

        // 3. Reiniciar perfil de ingresos a 14,000.00 Bs
        try {
          await supabase
            .from('perfil_ingresos')
            .upsert({ 
              user_id: user.id, 
              ingreso_total: 14000, 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });
        } catch (e) {
          console.warn('Error al actualizar perfil_ingresos:', e);
        }
      }

      // 4. Actualizar almacenamiento local aislado
      const userStorageKey = user?.id ? `fc_transacciones_${user.id}` : 'fc_transacciones';
      const budgetStorageKey = user?.id ? `fc_ingreso_total_${user.id}` : 'fc_ingreso_total';

      const savedTrans = localStorage.getItem(userStorageKey);
      if (savedTrans) {
        try {
          const parsed: Transaccion[] = JSON.parse(savedTrans);
          const updated = parsed.map((t) => ({ ...t, estado: 'archivado' }));
          localStorage.setItem(userStorageKey, JSON.stringify(updated));
        } catch (e) {
          localStorage.setItem(userStorageKey, JSON.stringify([]));
        }
      }

      // 5. Reiniciar vista principal
      setTransacciones([]);
      setIngresoTotal(14000);
      localStorage.setItem(budgetStorageKey, '14000');

      triggerNotification('¡Ciclo cerrado con éxito! Se descargó el reporte del mes.');
      setShowConfirmCerrarCiclo(false);

      if (showHistorialArchivado) {
        loadArchivadoData();
      }
    } catch (err: any) {
      console.error('Error al cerrar ciclo:', err);
      triggerNotification('⚠️ No se pudo cerrar el ciclo completamente.');
    } finally {
      setIsClosingCycle(false);
    }
  };

  // Eliminar transacción
  const handleDeleteGasto = async (id: string) => {
    if (supabaseConnected) {
      try {
        let deleteQuery = supabase.from('transacciones').delete().eq('id', id);
        if (user?.id) {
          deleteQuery = deleteQuery.eq('user_id', user.id);
        }
        const { error } = await deleteQuery;
        if (error) throw error;
        setTransacciones((prev) => prev.filter((t) => t.id !== id));
        triggerNotification('🗑️ Transacción eliminada');
      } catch (err) {
        console.error('Error eliminando de Supabase:', err);
        setTransacciones((prev) => prev.filter((t) => t.id !== id));
        triggerNotification('🗑️ Eliminado localmente');
      }
    } else {
      setTransacciones((prev) => prev.filter((t) => t.id !== id));
      triggerNotification('🗑️ Transacción eliminada');
    }
  };

  // Guardar nuevo presupuesto
  const handleSaveIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    const valIngreso = Number(tempIngreso);
    if (isNaN(valIngreso) || valIngreso < 0) {
      triggerNotification('⚠️ Ingresa un presupuesto válido');
      return;
    }

    const budgetStorageKey = user?.id ? `fc_ingreso_total_${user.id}` : 'fc_ingreso_total';

    if (supabaseConnected && user?.id) {
      try {
        const { error } = await supabase
          .from('perfil_ingresos')
          .upsert({ 
            user_id: user.id, 
            ingreso_total: valIngreso, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'user_id' });

        if (error) throw error;
        setIngresoTotal(valIngreso);
        localStorage.setItem(budgetStorageKey, valIngreso.toString());
        setIsEditingIngreso(false);
        triggerNotification('💼 Presupuesto sincronizado');
      } catch (err) {
        console.error('Error al subir presupuesto:', err);
        setIngresoTotal(valIngreso);
        localStorage.setItem(budgetStorageKey, valIngreso.toString());
        setIsEditingIngreso(false);
        triggerNotification('💼 Presupuesto guardado local');
      }
    } else {
      setIngresoTotal(valIngreso);
      localStorage.setItem(budgetStorageKey, valIngreso.toString());
      setIsEditingIngreso(false);
      triggerNotification('💼 Presupuesto actualizado');
    }
  };

  // Cerrar Sesión
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsGuestMode(false);
      setTransacciones([]);
      setTransaccionesArchivadas([]);
      triggerNotification('👋 Sesión cerrada exitosamente');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      setUser(null);
    }
  };

  // Cálculos financieros
  const totalGastos = transacciones.reduce((acc, curr) => acc + curr.monto, 0);
  const saldoDisponible = ingresoTotal - totalGastos;
  const porcentajeGastado = ingresoTotal > 0 ? (totalGastos / ingresoTotal) * 100 : 0;

  // Iconos y colores por categoría
  const infoCategorias: Record<CategoriaType, { icon: string; color: string; bg: string }> = {
    Comida: { icon: '🍔', color: 'orange', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
    Transporte: { icon: '🚗', color: 'blue', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25' },
    Servicios: { icon: '💡', color: 'purple', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
    Varios: { icon: '🛍️', color: 'pink', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25' }
  };

  // 1. Pantalla de Carga Inicial
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 mb-3 animate-pulse">
          <Wallet className="h-6 w-6" />
        </div>
        <p className="text-xs font-mono text-slate-400">Cargando FinanzasClaras...</p>
      </div>
    );
  }

  // 2. Pantalla de Login / Registro si no hay usuario autenticado y no está en modo invitado
  if (!user && !isGuestMode) {
    return (
      <AuthScreen 
        onAuthSuccess={() => {
          // onAuthStateChange se encarga de disparar loadUserData
        }}
        onContinueAsGuest={() => {
          setIsGuestMode(true);
          const savedTrans = localStorage.getItem('fc_transacciones');
          if (savedTrans) {
            try {
              setTransacciones(JSON.parse(savedTrans));
            } catch (e) {
              setTransacciones([]);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#f3f4f6] flex flex-col items-center justify-start relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Fondo de Luces Ambientales */}
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

      {/* CONTENEDOR PRINCIPAL FLUIDO NATIVO */}
      <main className="w-full max-w-md mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4 relative z-10 pt-[env(safe-area-inset-top,1rem)] pb-[env(safe-area-inset-bottom,1.5rem)]">
        
        {/* Header de la Aplicación con Usuario y Cerrar Sesión */}
        <header className="flex justify-between items-center py-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/10">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">FinanzasClaras</h1>
              <span className="text-[9px] text-slate-400 truncate max-w-[140px]">
                {user?.email || (isGuestMode ? 'Modo Local' : 'Usuario')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón SQL RLS Helper */}
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
              title="Ver configuración SQL / RLS"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>

            {/* Estado de sincronización */}
            <button
              type="button"
              onClick={() => loadUserData(user)}
              disabled={checkingSupabase}
              className={`text-[10px] bg-slate-900 border px-2.5 py-1 rounded-xl font-mono font-medium flex items-center gap-1.5 transition-all hover:bg-slate-800 cursor-pointer ${supabaseConnected ? 'text-emerald-400 border-emerald-500/25' : 'text-amber-400 border-amber-500/25'}`}
              title="Sincronizar datos"
            >
              <RefreshCw className={`h-3 w-3 ${checkingSupabase ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{checkingSupabase ? 'Sincronizando' : supabaseConnected ? 'Nube' : 'Local'}</span>
            </button>

            {/* Botón Cerrar Sesión */}
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsGuestMode(false)}
                className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-xl cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* BANNER / BOTÓN DE INSTALACIÓN DIRECTA PWA */}
        {!isAppInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-lg text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-sm shrink-0">
                📲
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">Instalar FinanzasClaras</span>
                <span className="text-[9px] text-slate-400">Usala como app nativa en Android e iOS</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/15 shrink-0 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Instalar</span>
            </button>
          </motion.div>
        )}

        {/* Alerta de Configuración SQL */}
        {supabaseErrorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-200 text-[10px] rounded-2xl flex flex-col gap-2 leading-relaxed text-left"
          >
            <p className="font-semibold whitespace-pre-line">{supabaseErrorMsg}</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/15 gap-2">
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="text-[9px] text-emerald-400 underline font-semibold"
              >
                Ver script SQL con RLS
              </button>
              <button
                type="button"
                onClick={() => loadUserData(user)}
                disabled={checkingSupabase}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30 shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${checkingSupabase ? 'animate-spin' : ''}`} />
                <span>Reintentar</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 1. TARJETA DE BALANCE DESTACADA */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-3">
            <div className="text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Saldo Disponible</p>
              <h2 className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight mt-0.5 ${saldoDisponible >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Bs {saldoDisponible.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
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
                  Bs {ingresoTotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Gastos</span>
              <p className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                Bs {totalGastos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* 2. FORMULARIO ULTRA-RÁPIDO DE REGISTRO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md text-left">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="text-emerald-400">⚡</span> Registrar Gasto Rápido
          </h3>

          <form onSubmit={handleAddGasto} className="flex flex-col gap-3.5">
            {/* Input de Monto */}
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">Bs</span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="decimal"
                  step="any"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-800 transition-all"
                  required
                />
              </div>
            </div>

            {/* Botones de Categorías */}
            <div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Comida', 'Transporte', 'Servicios', 'Varios'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      setConcepto('');
                    }}
                    className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
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

            {/* Concepto Opcional con sugerencias */}
            <div>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Concepto (Ej: Café, Uber, Luz)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white placeholder-slate-700 transition-all"
              />
              
              {/* Tags de Autocompletado */}
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

        {/* 3. HISTORIAL DE GASTOS DEL CICLO ACTUAL */}
        <div className="flex flex-col text-left min-h-[160px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span> Gastos del Ciclo Actual
            </h3>
            <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 font-mono">
              {transacciones.length} items
            </span>
          </div>

          {transacciones.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-500 text-center gap-1.5 min-h-[120px]">
              <span className="text-xl">☕</span>
              <p className="text-[10px] font-bold text-slate-400">Sin egresos en este ciclo</p>
              <p className="text-[9px] text-slate-500 max-w-[200px]">¡Buen trabajo manteniendo tu presupuesto intacto!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px] pr-0.5 scrollbar-thin">
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
                            -Bs {t.monto.toFixed(2)}
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

              {/* Botón Cerrar Ciclo */}
              <button
                type="button"
                onClick={() => setShowConfirmCerrarCiclo(true)}
                className="mt-2 w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Lock className="h-3.5 w-3.5 text-rose-400" />
                <span>🔒 Cerrar Ciclo</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. HISTORIAL DE GASTOS ARCHIVADOS */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60 text-left">
          <button
            type="button"
            onClick={() => {
              const nextState = !showHistorialArchivado;
              setShowHistorialArchivado(nextState);
              if (nextState) {
                loadArchivadoData();
              }
            }}
            className="w-full py-3 px-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📁</span>
              <span>Ver Historial de gastos</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showHistorialArchivado ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistorialArchivado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📦</span> Historial Archivados
                  </span>
                  <button
                    type="button"
                    onClick={loadArchivadoData}
                    disabled={loadingArchivados}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingArchivados ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                {loadingArchivados ? (
                  <p className="text-xs text-slate-400 py-3 text-center font-mono">Cargando gastos archivados...</p>
                ) : transaccionesArchivadas.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs">
                    <p className="font-semibold text-slate-400">Sin gastos archivados aún</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Al presionar "Cerrar Ciclo", los gastos completados pasarán a este historial de solo lectura.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-thin">
                    {transaccionesArchivadas.map((t) => {
                      const info = infoCategorias[t.categoria as keyof typeof infoCategorias] || { icon: '💰', bg: 'bg-slate-850' };
                      return (
                        <div
                          key={t.id}
                          className="bg-slate-950/80 border border-slate-900 rounded-xl p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${info.bg}`}>
                              <span className="text-xs">{info.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white line-clamp-1">{t.concepto}</span>
                              <span className="text-[8px] text-slate-500 uppercase mt-0.5 font-semibold">
                                {t.categoria} • {new Date(t.creado_en).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-400 shrink-0">
                            -Bs {t.monto.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* MODAL CONFIRMACIÓN PARA CERRAR CICLO */}
      <AnimatePresence>
        {showConfirmCerrarCiclo && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full text-left flex flex-col gap-3 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                <Lock className="h-4 w-4" />
                <h3>¿Cerrar Ciclo Financiero?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ¿Deseas cerrar el ciclo actual y reiniciar tu saldo? Todos los gastos registrados cambiarán su estado a <strong className="text-amber-300">archivado</strong> y el Saldo Disponible se reiniciará a <strong className="text-emerald-400">14,000.00 Bs</strong>.
              </p>
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmCerrarCiclo(false)}
                  disabled={isClosingCycle}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarCiclo}
                  disabled={isClosingCycle}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                >
                  {isClosingCycle ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Sí, Cerrar Ciclo</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INSTRUCCIONES SQL Y RLS */}
      <SqlInstructionsModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
      />

    </div>
  );
}
