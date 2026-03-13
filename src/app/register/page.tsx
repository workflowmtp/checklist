'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !nom || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nom, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du compte');
      } else {
        setSuccess('Compte créé avec succès ! Redirection vers la connexion...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
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

      {/* Register box */}
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
            Créer un compte
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[var(--accent-red-dim)] text-[var(--accent-red)] px-3.5 py-2.5 rounded-md text-[0.85rem] mb-4 border border-[rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-[var(--accent-green-dim)] text-[var(--accent-green)] px-3.5 py-2.5 rounded-md text-[0.85rem] mb-4 border border-[rgba(34,197,94,0.2)]">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Nom complet
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
              autoComplete="name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choisissez un mot de passe"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
              autoComplete="new-password"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.95rem] focus-ring transition-all placeholder:text-[var(--text-tertiary)]"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-md font-semibold text-white text-base btn-gradient-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création en cours...' : "S'inscrire"}
          </button>
        </form>

        {/* Link to login */}
        <div className="mt-6 pt-5 border-t border-[var(--border-primary)] text-center">
          <p className="text-[var(--text-secondary)] text-[0.85rem]">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-[var(--accent-blue)] hover:underline font-semibold"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
