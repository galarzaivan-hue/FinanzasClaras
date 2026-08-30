import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, ingresa tu correo y contraseña.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Iniciar Sesión con Email/Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('¡Bienvenido de nuevo!');
          onAuthSuccess();
        }
      } else {
        // Registro de Nuevo Usuario
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('¡Cuenta creada exitosamente!');
          onAuthSuccess();
        } else if (data.user && !data.session) {
          // Si Supabase requiere confirmación por email
          setSuccessMessage('¡Registro completado! Si tu proyecto requiere confirmación por correo, revisa tu bandeja de entrada.');
        } else {
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      let message = err?.message || 'Error al procesar la autenticación.';
      if (message.includes('Invalid login credentials')) {
        message = 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.';
      } else if (message.includes('User already registered')) {
        message = 'Este correo ya está registrado. Selecciona "Iniciar Sesión".';
      } else if (message.includes('Email not confirmed')) {
        message = 'Correo no confirmado. Revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase.';
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error con Google Auth:', err);
      setErrorMessage(err?.message || 'No se pudo iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#f3f4f6] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Luces de fondo */}
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
            onClick={() => {
              setIsLogin(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
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
            onClick={() => {
              setIsLogin(false);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
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

        {/* Mensajes de Estado */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMessage}</span>
          </motion.div>
        )}

        {/* Botón de Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-[0.99] mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.9 7.4 23 12 23z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">o con correo</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        {/* Formulario de Email / Password */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>Cargando...</span>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>INICIAR SESIÓN</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
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
