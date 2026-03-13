'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const e = email;
    const p = password;
    if (!e || !p) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: e,
      password: p,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-[500] overflow-y-auto p-6">
      {/* Animated background */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] login-bg-drift pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Login box */}
      <div className="relative z-10 w-full max-w-[420px] p-10 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-lg max-h-[95vh] overflow-y-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-md flex items-center justify-center text-2xl text-white btn-gradient-purple shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
            ⚙
          </div>
          <h1 className="font-mono text-[1.7rem] font-bold tracking-tight">
            PrintSeq
          </h1>
          <p className="text-[var(--text-secondary)] text-[0.85rem] mt-1">
            Séquençage & Suivi de Production — MULTIPRINT
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[var(--accent-red-dim)] text-[var(--accent-red)] px-3.5 py-2.5 rounded-md text-[0.85rem] mb-4 border border-[rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="mb-4">
          <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pw')?.focus()}
            placeholder="Votre adresse email"
            className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
            autoComplete="email"
          />
        </div>
        <div className="mb-5">
          <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Mot de passe
          </label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Votre mot de passe"
            className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <button
          onClick={() => handleLogin()}
          disabled={loading}
          className="w-full py-3.5 rounded-md font-semibold text-white text-base btn-gradient-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        {/* Link to register */}
        <div className="mt-6 pt-5 border-t border-[var(--border-primary)] text-center">
          <p className="text-[var(--text-secondary)] text-[0.85rem]">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-[var(--accent-blue)] hover:underline font-semibold"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
