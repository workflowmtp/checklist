'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistoriqueData } from '@/lib/actions';
import { getStatutDossierLabel, formatNumber } from '@/lib/utils';

export default function HistoriquePage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ pole: '', machine: '', statut: '', search: '', dateFrom: '', dateTo: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [filters]);
  const loadData = async () => { setLoading(true); const r = await getHistoriqueData(filters); setData(r); setLoading(false); };
  const updateFilter = (key: string, val: string) => setFilters({ ...filters, [key]: val });

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">📜 Historique des dossiers</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Recherche multicritère dans tous les dossiers</p>

      <div className="flex flex-wrap gap-2.5 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md mb-5 items-end">
        {[
          { k: 'statut', l: 'Statut', type: 'select', opts: [['', 'Tous'], ['EN_COURS', 'En cours'], ['EN_ATTENTE', 'En attente'], ['CLOTURE', 'Clôturé']] },
          { k: 'search', l: 'Recherche', type: 'text', ph: 'Dossier, OF, client...' },
          { k: 'dateFrom', l: 'Du', type: 'date' },
          { k: 'dateTo', l: 'Au', type: 'date' },
        ].map((f) => (
          <div key={f.k} className="min-w-[140px]">
            <label className="block text-[0.7rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">{f.l}</label>
            {f.type === 'select' ? (
              <select value={(filters as any)[f.k]} onChange={(e) => updateFilter(f.k, e.target.value)}
                className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.82rem]">
                {f.opts?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <input type={f.type} value={(filters as any)[f.k]} onChange={(e) => updateFilter(f.k, e.target.value)} placeholder={f.ph}
                className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.82rem]" />
            )}
          </div>
        ))}
        <button onClick={() => setFilters({ pole: '', machine: '', statut: '', search: '', dateFrom: '', dateTo: '' })}
          className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-[0.82rem]">Réinitialiser</button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
        <div className="font-mono font-bold text-base mb-3.5">📋 Résultats <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{data.length}</span></div>
        {loading ? <div className="text-center py-8 text-[var(--text-tertiary)]">Chargement...</div> :
         data.length === 0 ? <div className="text-center py-8 text-[var(--text-tertiary)]">Aucun dossier trouvé</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>
            {['Date','Dossier','OF','Client','Pôle','Machine','Désignation','Qté','Statut'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
          </tr></thead><tbody>
            {data.map((d: any) => {
              const totE = d.declarations?.reduce((s: number, dp: any) => s + (dp.totalEngage || 0), 0) || 0;
              return (
                <tr key={d.id} className="hover:bg-[var(--accent-blue-dim)] cursor-pointer" onClick={() => router.push(`/dossier/${d.id}`)}>
                  <td className="px-3 py-2 text-[0.78rem] border-b border-[var(--border-primary)] font-mono whitespace-nowrap">{d.dateDossier ? new Date(d.dateDossier).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)] font-mono font-semibold">{d.dossierNumero}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)]">{d.ofNumero || '—'}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)]">{d.client || '—'}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)]">{d.pole?.icone} {d.pole?.nom}</td>
                  <td className="px-3 py-2 text-[0.8rem] border-b border-[var(--border-primary)]">{d.machine?.codeMachine}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)] max-w-[200px] truncate">{d.designation}</td>
                  <td className="px-3 py-2 text-[0.8rem] border-b border-[var(--border-primary)] font-mono">{formatNumber(totE)}/{formatNumber(d.quantiteCommandee)}</td>
                  <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)]">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-semibold uppercase ${
                      d.statut === 'EN_COURS' ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' :
                      d.statut === 'CLOTURE' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' :
                      'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]'
                    }`}>{getStatutDossierLabel(d.statut)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
