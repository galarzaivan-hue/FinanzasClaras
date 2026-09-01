import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onContinueAsGuest?: () => void;
}

export default function AuthScreen({ onAuthSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Contador regresivo para bloqueo por Rate Limit
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Cambiar entre Iniciar Sesión y Registrarse limpiando errores
  const handleTabChange = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setErrorMessage(null);
    setLoading(true);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, ingresa tu correo electrónico y contraseña.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Iniciar Sesión con Email y Contraseña
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data?.session || data?.user) {
          onAuthSuccess();
        }
      } else {
        // Registro de Nuevo Usuario (Sin bucles de reintentos)
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        // Si signUp devolvió la sesión activa inmediatamente:
        if (data?.session) {
          onAuthSuccess();
        } else {
          // Si no devuelve la sesión automáticamente, intentar un único inicio de sesión transparente
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInError) {
            throw signInError;
          }

          if (signInData?.session || signInData?.user) {
            onAuthSuccess();
          } else {
            onAuthSuccess();
          }
        }
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      let rawMessage = err?.message || '';
      const status = err?.status || err?.statusCode;
      const code = err?.code || '';
      const lower = (rawMessage + ' ' + code).toLowerCase();

      // Detección explícita de Rate Limit / Demasiados intentos
      const isRateLimit =
        status === 429 ||
        code === 'rate_limit' ||
        code === 'over_email_send_rate_limit' ||
        lower.includes('rate limit') ||
        lower.includes('rate_limit') ||
        lower.includes('too many requests') ||
        lower.includes('over_email_send_rate_limit');

      let message = 'Ocurrió un error al procesar tu solicitud.';

      if (isRateLimit) {
        message = 'Se han realizado demasiados intentos en poco tiempo. Por favor, espera unos minutos e inténtalo nuevamente.';
        setCooldownSeconds(60); // Desactiva el botón por 60 segundos para evitar saturar la API
      } else if (
        lower.includes('user already registered') ||
        lower.includes('already registered') ||
        lower.includes('already exists') ||
        lower.includes('user with this email already exists')
      ) {
        message = 'Este correo ya está registrado. Por favor inicia sesión.';
        setIsLogin(true);
      } else if (
        lower.includes('invalid login credentials') ||
        lower.includes('invalid credentials') ||
        lower.includes('invalid email or password')
      ) {
        message = 'Correo o contraseña incorrectos. Verifica tus datos.';
      } else if (lower.includes('password should be at least') || lower.includes('password is too short')) {
        message = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (lower.includes('signup disabled')) {
        message = 'El registro de usuarios está deshabilitado en este momento.';
      } else if (lower.includes('email not confirmed')) {
        message = 'Credenciales no válidas. Verifica tus datos de acceso.';
      } else if (rawMessage) {
        message = rawMessage;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#f3f4f6] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Luces ambientales de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative z-10 text-left"
      >
        {/* Cabecera / Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 mb-3">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">FinanzasClaras</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
            Tus finanzas personales aisladas, privadas y seguras en la nube.
          </p>
        </div>

        {/* Alternador Login / Registro */}
        <div className="grid grid-cols-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => handleTabChange(true)}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isLogin
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(false)}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isLogin
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Registrarse</span>
          </button>
        </div>

        {/* Mensajes de Error con soporte para Rate Limit */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex flex-col gap-1">
              <span className="leading-relaxed">{errorMessage}</span>
              {cooldownSeconds > 0 && (
                <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 inline" /> Reintento disponible en: {cooldownSeconds}s
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Formulario Tradicional de Email / Contraseña */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : cooldownSeconds > 0 ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Espera ({cooldownSeconds}s)
              </span>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4 stroke-[2.5]" />
                <span>INICIAR SESIÓN</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 stroke-[2.5]" />
                <span>CREAR CUENTA PRIVADA</span>
              </>
            )}
          </button>
        </form>

        {/* Acceso Demostrativo / Offline */}
        {onContinueAsGuest && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <span>Continuar en modo local / demo</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Pie de seguridad */}
      <div className="mt-6 flex items-center gap-2 text-slate-500 text-[11px]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Aislamiento por Row Level Security (RLS) en Supabase</span>
      </div>
    </div>
  );
}
