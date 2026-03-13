'use client';

import { useState, useEffect } from 'react';
import { getDashboardData } from '@/lib/actions';
import { formatNumber, formatDuration } from '@/lib/utils';

export default function DashboardPage() {
  const [filters, setFilters] = useState({ poleId: '', dateFrom: '', dateTo: '' });
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState('global');

  useEffect(() => { getDashboardData(filters).then(setData); }, [filters]);

  if (!data) return <div className="text-center py-12 text-[var(--text-tertiary)]">Chargement du dashboard...</div>;

  const tabs = [
    { id: 'global', label: 'Vue globale' },
    { id: 'poles', label: 'Comparatif pôles' },
    { id: 'arrets', label: 'Analyse arrêts' },
  ];

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">📊 Dashboard KPI multi-pôles</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Performance consolidée de la production MULTIPRINT</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md mb-5 items-end">
        <div className="min-w-[130px]"><label className="block text-[0.68rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Pôle</label>
          <select value={filters.poleId} onChange={(e) => setFilters({ ...filters, poleId: e.target.value })}
            className="w-full px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.8rem]">
            <option value="">Tous</option>
            {data.poles?.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
          </select></div>
        <div><label className="block text-[0.68rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Du</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.8rem]" /></div>
        <div><label className="block text-[0.68rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Au</label>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.8rem]" /></div>
        <button onClick={() => setFilters({ poleId: '', dateFrom: '', dateTo: '' })} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-[0.8rem]">Reset</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-[var(--border-primary)]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[0.85rem] font-medium border-b-2 -mb-px transition-all ${tab === t.id ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { l: 'Dossiers', v: data.nbTotal, c: 'var(--accent-blue)', s: `${data.nbEnCours} en cours` },
          { l: 'Qté bonne', v: formatNumber(data.totBonnes), c: 'var(--accent-green)' },
          { l: 'Gâche', v: formatNumber(data.totGache), c: 'var(--accent-red)', s: `${data.txGache.toFixed(1)}%` },
          { l: 'Arrêts', v: data.nbArrets, c: 'var(--accent-orange)', s: formatDuration(data.totStopMs) },
          { l: 'Disponibilité', v: `${data.txDispo.toFixed(1)}%`, c: 'var(--accent-cyan)', s: `MTTR: ${formatDuration(data.mttr)}` },
          { l: 'Conformité', v: `${data.txConf.toFixed(1)}%`, c: 'var(--accent-purple)' },
          { l: 'Contrôles', v: data.nbCtrlBon + data.nbCtrlMauv, s: `${data.nbCtrlBon}✓ ${data.nbCtrlMauv}✗` },
          { l: 'Passations', v: data.nbPassations },
        ].map((k) => (
          <div key={k.l} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-3.5" style={k.c ? { borderBottom: `3px solid ${k.c}` } : undefined}>
            <div className="text-[0.68rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{k.l}</div>
            <div className="font-mono text-[1.5rem] font-bold leading-tight" style={{ color: k.c }}>{k.v}</div>
            {k.s && <div className="text-[0.72rem] text-[var(--text-tertiary)] mt-0.5">{k.s}</div>}
          </div>
        ))}
      </div>

      {/* Content */}
      {tab === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
            <div className="font-mono font-bold text-base mb-3.5">📊 Production par pôle</div>
            {data.perPole.map((p: any) => {
              const maxE = Math.max(...data.perPole.map((pp: any) => pp.engage), 1);
              return (
                <div key={p.pole.id} className="mb-2">
                  <div className="flex justify-between text-[0.82rem] mb-0.5"><span>{p.pole.icone} {p.pole.nom}</span><span className="font-mono">{formatNumber(p.engage)}</span></div>
                  <div className="h-5 bg-[var(--bg-tertiary)] rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${(p.engage / maxE) * 100}%`, background: p.pole.couleur }} /></div>
                </div>
              );
            })}
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
            <div className="font-mono font-bold text-base mb-3.5">📉 Top causes d&apos;arrêt</div>
            {data.pareto.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun arrêt</div> :
              data.pareto.slice(0, 6).map((p: any) => {
                const maxC = data.pareto[0]?.count || 1;
                return (
                  <div key={p.id} className="flex items-center gap-2.5 mb-1.5 text-[0.82rem]">
                    <span className="w-[160px] truncate flex-shrink-0">{p.label}</span>
                    <div className="flex-1 h-5 bg-[var(--bg-tertiary)] rounded overflow-hidden"><div className="h-full rounded flex items-center pl-2 text-white text-[0.7rem] font-semibold" style={{ width: `${(p.count / maxC) * 100}%`, background: 'var(--accent-red)' }}>{p.count}</div></div>
                    <span className="font-mono font-semibold w-[40px] text-right">{p.count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {tab === 'poles' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">🏭 Comparatif multi-pôles</div>
          <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>
            {['Pôle','Dossiers','Engagé','Bonnes','Gâche','Tx Gâche','Arrêts','Dispo.','Conformité'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.68rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
          </tr></thead><tbody>
            {data.perPole.map((p: any) => (
              <tr key={p.pole.id} className="hover:bg-[var(--bg-tertiary)]">
                <td className="px-3 py-2 text-[0.85rem] border-b border-[var(--border-primary)] font-semibold">{p.pole.icone} {p.pole.nom}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-bold">{p.dossiers}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{formatNumber(p.engage)}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono text-[var(--accent-green)]">{formatNumber(p.bonnes)}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono text-[var(--accent-red)]">{formatNumber(p.gache)}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-bold">{p.txGache.toFixed(1)}%</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{p.arrets}</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono" style={{ color: p.txDispo >= 85 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{p.txDispo.toFixed(1)}%</td>
                <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{p.txConf.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
      )}

      {tab === 'arrets' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { l: 'Total arrêts', v: data.nbArrets, c: 'var(--accent-red)' },
              { l: 'Temps total', v: formatDuration(data.totStopMs), c: 'var(--accent-orange)' },
              { l: 'MTTR', v: formatDuration(data.mttr), c: 'var(--accent-cyan)' },
              { l: 'Disponibilité', v: `${data.txDispo.toFixed(1)}%`, c: 'var(--accent-green)' },
            ].map((k) => (
              <div key={k.l} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-3.5" style={{ borderBottom: `3px solid ${k.c}` }}>
                <div className="text-[0.68rem] text-[var(--text-tertiary)] uppercase mb-1">{k.l}</div>
                <div className="font-mono text-[1.5rem] font-bold" style={{ color: k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
            <div className="font-mono font-bold text-base mb-3.5">📉 Pareto des causes d&apos;arrêt</div>
            {data.pareto.map((p: any, i: number) => {
              const maxC = data.pareto[0]?.count || 1;
              return (
                <div key={p.id} className="flex items-center gap-2.5 mb-1.5 text-[0.82rem]">
                  <span className="w-[160px] truncate flex-shrink-0">{p.label}</span>
                  <div className="flex-1 h-5 bg-[var(--bg-tertiary)] rounded overflow-hidden"><div className="h-full rounded flex items-center pl-2 text-white text-[0.7rem] font-semibold" style={{ width: `${(p.count / maxC) * 100}%`, background: 'var(--accent-red)' }}>{p.count}</div></div>
                  <span className="font-mono font-semibold w-[40px] text-right">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
