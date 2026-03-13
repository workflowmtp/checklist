'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getERPData, saveERPConfig, simulateERPImport } from '@/lib/actions';

export default function ERPPage() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ url: '', site: 'DLA', database: '', user: '' });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getERPData().then((d) => {
      setData(d);
      if (d.config) {
        try { const c = JSON.parse(d.config.configJson); setForm(c); } catch {}
      }
    });
  }, []);

  const handleSave = () => startTransition(async () => { await saveERPConfig(form); toast.success('Configuration ERP enregistrée'); });
  const handleImport = () => startTransition(async () => {
    const r = await simulateERPImport();
    toast.success(`OF ${r.ofNum} importé — ${r.article}`);
    getERPData().then(setData);
  });

  if (!data) return <div className="text-center py-12 text-[var(--text-tertiary)]">Chargement...</div>;

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">🔗 Intégration ERP — Sage X3</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Pré-intégration et synchronisation</p>

      <div className="flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md mb-5">
        <div className="w-12 h-12 rounded-md flex items-center justify-center text-2xl" style={{ background: data.config?.actif ? 'var(--accent-green-dim)' : 'var(--accent-orange-dim)', color: data.config?.actif ? 'var(--accent-green)' : 'var(--accent-orange)' }}>🔗</div>
        <div className="flex-1"><h4 className="font-bold">Sage X3 {data.config?.actif ? '— Connecté' : '— Non connecté'}</h4><p className="text-[0.82rem] text-[var(--text-secondary)]">Site : {form.site} | URL : {form.url || 'Non configuré'}</p></div>
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${data.config?.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]'}`}>{data.config?.actif ? 'Actif' : 'Inactif'}</span>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3.5">⚙️ Configuration de connexion</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px]">
          {[{ k: 'url', l: 'URL du serveur', ph: 'https://x3.multiprint.cm/api' }, { k: 'site', l: 'Site' }, { k: 'database', l: 'Base de données', ph: 'MULTIPRINT_PROD' }, { k: 'user', l: 'Utilisateur API', ph: 'api_printseq' }].map((f) => (
            <div key={f.k}><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">{f.l}</label>
              <input type="text" value={(form as any)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.ph}
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]" /></div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-4">
          <button onClick={handleSave} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue">💾 Enregistrer</button>
          <button onClick={() => toast.warning('Connexion non disponible — sera activée au déploiement backend')} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">🔌 Tester</button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
        <div className="font-mono font-bold text-base mb-3.5 flex items-center justify-between">
          <span>📤 File de synchronisation <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{data.syncQueue?.length || 0}</span></span>
          <button onClick={handleImport} disabled={isPending} className="px-3 py-1.5 rounded-md text-[0.8rem] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">📥 Simuler import OF</button>
        </div>
        {data.syncQueue?.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun élément</div> :
          data.syncQueue?.map((sq: any) => (
            <div key={sq.id} className="flex items-center gap-2.5 px-3.5 py-2.5 border border-[var(--border-primary)] rounded-md mb-1 text-[0.82rem]">
              <span className="px-2 py-0.5 bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] rounded text-[0.68rem] font-semibold uppercase">{sq.action}</span>
              <div className="flex-1"><div className="font-semibold">{sq.typeEntite} #{sq.entiteId || '—'}</div>
                <div className="text-[0.72rem] text-[var(--text-tertiary)]">{new Date(sq.createdAt).toLocaleString('fr-FR')}</div></div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${sq.statut === 'done' ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : sq.statut === 'error' ? 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]' : 'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]'}`}>{sq.statut}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
