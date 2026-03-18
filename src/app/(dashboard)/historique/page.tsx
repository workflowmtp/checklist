'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistoriqueData } from '@/lib/actions';
import { getStatutDossierLabel, formatNumber } from '@/lib/utils';

export default function HistoriquePage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ pole: '', machine: '', statut: '', search: '', dateFrom: '', dateTo: '' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [filters]);
  const loadData = async () => { setLoading(true); const r = await getHistoriqueData(filters); setData(r); setLoading(false); };
  const updateFilter = (key: string, val: string) => setFilters({ ...filters, [key]: val });

  const dossiers: any[] = data?.dossiers || data || [];
  const poles: any[] = data?.poles || [];
  const machines: any[] = data?.machines || [];

  return (
    <div>
      <div className="page-title">📜 Historique des dossiers</div>
      <div className="page-subtitle">Recherche multicritère dans tous les dossiers</div>

      <div className="history-filters">
        <div className="form-group"><label>Pôle</label>
          <select value={filters.pole} onChange={(e) => updateFilter('pole', e.target.value)} className="form-input">
            <option value="">Tous</option>
            {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Machine</label>
          <select value={filters.machine} onChange={(e) => updateFilter('machine', e.target.value)} className="form-input">
            <option value="">Toutes</option>
            {machines.map((m: any) => <option key={m.id} value={m.id}>{m.codeMachine}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Statut</label>
          <select value={filters.statut} onChange={(e) => updateFilter('statut', e.target.value)} className="form-input">
            <option value="">Tous</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="CLOTURE">Clôturé</option>
          </select>
        </div>
        <div className="form-group"><label>N° Dossier / OF</label>
          <input type="text" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Rechercher..." className="form-input" />
        </div>
        <div className="form-group"><label>Du</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} className="form-input" />
        </div>
        <div className="form-group"><label>Au</label>
          <input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} className="form-input" />
        </div>
        <button onClick={() => setFilters({ pole: '', machine: '', statut: '', search: '', dateFrom: '', dateTo: '' })} className="btn btn-sm btn-secondary">Réinitialiser</button>
      </div>

      <div className="section-block">
        <div className="section-block-title">📋 Résultats <span className="record-count">({dossiers.length} dossiers)</span></div>
        {loading ? <div className="empty-state" style={{ padding: 30 }}><div className="empty-state-text">Chargement...</div></div> :
         dossiers.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}><div className="empty-state-icon">🔍</div><div className="empty-state-text">Aucun dossier trouvé avec ces critères</div></div>
        ) : (<>
          <table className="data-table"><thead><tr>
            <th>Date</th><th>Dossier</th><th>OF</th><th>Client</th><th>Pôle</th><th>Machine</th><th>Désignation</th><th>Qté</th><th>Statut</th>
          </tr></thead><tbody>
            {dossiers.map((d: any) => {
              const totE = d.declarations?.reduce((s: number, dp: any) => s + (dp.totalEngage || 0), 0) || 0;
              return (
                <tr key={d.id} className="history-row-clickable" onClick={() => router.push(`/dossier/${d.id}`)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.dateDossier ? new Date(d.dateDossier).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.dossierNumero}</td>
                  <td>{d.ofNumero || '—'}</td>
                  <td>{d.client || '—'}</td>
                  <td>{d.pole?.icone} {d.pole?.nom}</td>
                  <td style={{ fontSize: '0.8rem' }}>{d.machine?.codeMachine || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.designation}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatNumber(totE)}/{formatNumber(d.quantiteCommandee)}</td>
                  <td><span className={`status-badge ${d.statut === 'EN_COURS' ? 'active' : d.statut === 'CLOTURE' ? 'closed' : 'paused'}`}>{getStatutDossierLabel(d.statut)}</span></td>
                </tr>
              );
            })}
          </tbody></table>
        </>)}
      </div>

      {/* Summary stats — matching static v9.1 */}
      {!loading && dossiers.length > 0 && (() => {
        let nbEnCours = 0, nbCloture = 0, totalQteCmd = 0;
        dossiers.forEach((d: any) => {
          if (d.statut === 'EN_COURS') nbEnCours++;
          if (d.statut === 'CLOTURE') nbCloture++;
          totalQteCmd += d.quantiteCommandee || 0;
        });
        return (
          <div className="kpi-row" style={{ marginTop: 16 }}>
            <div className="kpi-card"><div className="kpi-card-label">Total dossiers</div><div className="kpi-card-value">{dossiers.length}</div></div>
            <div className="kpi-card"><div className="kpi-card-label">En cours</div><div className="kpi-card-value" style={{ color: 'var(--accent-green)' }}>{nbEnCours}</div></div>
            <div className="kpi-card"><div className="kpi-card-label">Clôturés</div><div className="kpi-card-value" style={{ color: 'var(--accent-blue)' }}>{nbCloture}</div></div>
            <div className="kpi-card"><div className="kpi-card-label">Qté totale commandée</div><div className="kpi-card-value">{formatNumber(totalQteCmd)}</div></div>
          </div>
        );
      })()}
    </div>
  );
}
