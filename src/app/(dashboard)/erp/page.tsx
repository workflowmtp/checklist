'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getERPData, saveERPConfig, simulateERPImport } from '@/lib/actions';

const MAPPING = [
  { x3: 'MFGTRKNUM', ps: 'dossier.of_numero', dir: 'X3 → PrintSeq', ready: true },
  { x3: 'ITMREF', ps: 'dossier.sage_x3_article', dir: 'X3 → PrintSeq', ready: true },
  { x3: 'LOT', ps: 'dossier.sage_x3_lot', dir: 'X3 → PrintSeq', ready: true },
  { x3: 'EXTQTY', ps: 'dossier.quantite_commandee', dir: 'X3 → PrintSeq', ready: true },
  { x3: 'CPLQTY', ps: 'declarations.total_engage', dir: 'PrintSeq → X3', ready: true },
  { x3: 'REJQTY', ps: 'declarations.gache', dir: 'PrintSeq → X3', ready: true },
  { x3: 'TIMOPE', ps: 'taches.temps_reel_ms', dir: 'PrintSeq → X3', ready: true },
  { x3: 'RSTFLG (Arrêt)', ps: 'arrets.duree_ms', dir: 'PrintSeq → X3', ready: false },
];

const FUTURE_FEATURES = [
  '📥 Import automatique des OF depuis Sage X3',
  '📤 Remontée automatique des temps et quantités',
  '🔄 Synchronisation bidirectionnelle des données maîtres',
  '📋 Journal des échanges avec traçabilité complète',
  '🔌 Mode offline avec synchronisation différée',
  '⚠️ Détection d\'erreurs et relance manuelle',
];

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

  const pendingSync = data.syncQueue?.filter((s: any) => s.statut === 'pending') || [];
  const errorSync = data.syncQueue?.filter((s: any) => s.statut === 'error') || [];

  return (
    <div>
      <div className="page-title">🔗 Intégration ERP — Sage X3</div>
      <div className="page-subtitle">Pré-intégration et synchronisation avec l&apos;ERP</div>

      {/* Status card */}
      <div className="erp-status-card">
        <div className="erp-status-icon" style={{ background: data.config?.actif ? 'var(--accent-green-dim)' : 'var(--accent-orange-dim)', color: data.config?.actif ? 'var(--accent-green)' : 'var(--accent-orange)' }}>🔗</div>
        <div className="erp-status-body">
          <h4>Sage X3{data.config?.actif ? ' — Connecté' : ' — Non connecté'}</h4>
          <p>Site : {form.site || 'DLA'} | URL : {form.url || 'Non configuré'}</p>
        </div>
        <span className={`status-badge ${data.config?.actif ? 'active' : 'paused'}`}>{data.config?.actif ? 'Actif' : 'Inactif'}</span>
      </div>

      {/* Config */}
      <div className="section-block">
        <div className="section-block-title">⚙️ Configuration de connexion</div>
        <div className="form-row" style={{ maxWidth: '600px' }}>
          <div className="form-group"><label>URL du serveur</label><input type="text" className="form-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://x3.multiprint.cm/api" /></div>
          <div className="form-group"><label>Site</label><input type="text" className="form-input" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} /></div>
        </div>
        <div className="form-row" style={{ maxWidth: '600px' }}>
          <div className="form-group"><label>Base de données</label><input type="text" className="form-input" value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} placeholder="MULTIPRINT_PROD" /></div>
          <div className="form-group"><label>Utilisateur API</label><input type="text" className="form-input" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} placeholder="api_printseq" /></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={isPending}>💾 Enregistrer</button>
          <button className="btn btn-secondary" onClick={() => toast.warning('Connexion non disponible — sera activée au déploiement backend')}>🔌 Tester la connexion</button>
        </div>
      </div>

      {/* Mapping */}
      <div className="section-block">
        <div className="section-block-title">🗺️ Mapping des champs ERP ↔ PrintSeq</div>
        <table className="data-table" style={{ fontSize: '0.82rem' }}><thead><tr>
          <th>Champ Sage X3</th><th>Champ PrintSeq</th><th>Direction</th><th>Statut</th>
        </tr></thead><tbody>
          {MAPPING.map((m) => (
            <tr key={m.x3}>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{m.x3}</td>
              <td>{m.ps}</td>
              <td>{m.dir}</td>
              <td><span className={`status-badge ${m.ready ? 'active' : 'paused'}`}>{m.ready ? 'Prêt' : 'Optionnel'}</span></td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {/* Sync queue */}
      <div className="section-block">
        <div className="section-block-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📤 File de synchronisation <span className="record-count">({data.syncQueue?.length || 0} éléments)</span></span>
          <button className="btn btn-sm btn-secondary" onClick={handleImport} disabled={isPending}>📥 Simuler import OF</button>
        </div>
        {(pendingSync.length > 0 || errorSync.length > 0) && (
          <div className="kpi-row" style={{ marginBottom: '14px' }}>
            <div className="kpi-card"><div className="kpi-card-label">En attente</div><div className="kpi-card-value" style={{ color: 'var(--accent-orange)' }}>{pendingSync.length}</div></div>
            <div className="kpi-card"><div className="kpi-card-label">En erreur</div><div className="kpi-card-value" style={{ color: 'var(--accent-red)' }}>{errorSync.length}</div></div>
            <div className="kpi-card"><div className="kpi-card-label">Total traités</div><div className="kpi-card-value">{data.syncQueue?.length || 0}</div></div>
          </div>
        )}
        {data.syncQueue?.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">Aucun élément dans la file de synchronisation</div></div>
        ) : (
          data.syncQueue?.map((sq: any) => (
            <div key={sq.id} className="sync-queue-item">
              <span className="sq-type">{sq.action || sq.typeEntite}</span>
              <div className="sq-body">
                <div style={{ fontWeight: 600 }}>{sq.typeEntite} #{sq.entiteId || '—'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{new Date(sq.createdAt).toLocaleString('fr-FR')}{sq.messageErreur ? ` — ${sq.messageErreur}` : ''}</div>
              </div>
              <span className={`status-badge ${sq.statut === 'done' ? 'active' : sq.statut === 'error' ? 'stopped' : 'paused'}`}>{sq.statut}</span>
            </div>
          ))
        )}
      </div>

      {/* Future features */}
      <div className="section-block">
        <div className="section-block-title">🚀 Fonctionnalités prévues</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
          {FUTURE_FEATURES.map((f) => (
            <div key={f} style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
