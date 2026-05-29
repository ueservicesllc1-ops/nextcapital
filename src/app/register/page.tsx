'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/providers/toast-provider';
import { Zap } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role: 'investor' });
      showToast('Cuenta creada con éxito. Verifica tu email para activarla.', 'success');
      router.push('/verify-email');
    } catch (err: any) {
      let msg = 'No se pudo crear la cuenta. Intenta de nuevo.';
      if (err?.code === 'auth/email-already-in-use') {
        msg = 'El correo ya está registrado. Inicia sesión.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'El formato del correo es inválido.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('Sesión iniciada con Google.', 'success');
      router.push('/');
    } catch (err: any) {
      setError('No se pudo crear la cuenta con Google.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#060608', fontFamily: 'var(--font-geist-sans), Inter, sans-serif' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-orange-500/4 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Zap size={16} className="text-amber-400" />
          </div>
          <span className="font-bold text-white">Next<span className="text-amber-400">Capital</span></span>
          <span className="ml-1 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-600 border border-amber-700/40 rounded" style={{ background: 'rgba(245,158,11,0.07)' }}>MINING</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Crear Cuenta</h1>
          <p className="text-sm text-slate-500 mb-8">Únete a nuestra plataforma de minería digital.</p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] mb-6 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-mono">O REGÍSTRATE CON TU EMAIL</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Nombre completo</label>
              <input
                type="text"
                required
                placeholder="Ingresa tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm outline-none transition-all focus:ring-1 focus:ring-amber-500"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Correo electrónico</label>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm outline-none transition-all focus:ring-1 focus:ring-amber-500"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm outline-none transition-all focus:ring-1 focus:ring-amber-500"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-amber-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
