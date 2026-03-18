'use client';

import { useState, useEffect } from 'react';
import { getDashboardData } from '@/lib/actions';
import { formatNumber, formatDuration } from '@/lib/utils';

/* Donut SVG matching static v9.1 _donutSVG */
function DonutSVG({ segments, size = 120, centerLabel }: { segments: { value: number; color: string }[]; size?: number; centerLabel?: string }) {
  const r = 36, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
  let total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) total = 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="donut-svg">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const dashGap = circumference - dashLen;
        const o = offset;
        offset += dashLen;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${dashLen.toFixed(2)} ${dashGap.toFixed(2)}`} strokeDashoffset={(-o).toFixed(2)} transform="rotate(-90 50 50)" />;
      })}
      <text x="50" y="49" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="14" fontWeight="700">{total}</text>
      {centerLabel && <text x="50" y="61" textAnchor="middle" fill="var(--text-tertiary)" fontFamily="var(--font-body)" fontSize="6" fontWeight="400">{centerLabel}</text>}
    </svg>
  );
}

/* Bar chart matching static v9.1 _barChart */
function BarChart({ items, maxVal }: { items: { label: string; value: number; display: string; color: string }[]; maxVal: number }) {
  const mx = maxVal > 0 ? maxVal : 1;
  return (
    <div className="bar-chart">
      {items.map((it, i) => {
        const pct = Math.max(2, (it.value / mx) * 100);
        return (
          <div key={i} className="bar-col">
            <div className="bar-val">{it.display}</div>
            <div className="bar-fill" style={{ height: `${pct}%`, background: it.color }} />
            <div className="bar-label" title={it.label}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({ poleId: '', dateFrom: '', dateTo: '' });
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState('global');

  useEffect(() => { getDashboardData(filters).then(setData); }, [filters]);

  if (!data) return <div className="empty-state" style={{ marginTop: 80 }}><div className="empty-state-text">Chargement du dashboard...</div></div>;

  const tabs = [
    { id: 'global', label: 'Vue globale' },
    { id: 'poles', label: 'Comparatif pôles' },
    { id: 'machines', label: 'Par machine' },
    { id: 'conducteurs', label: 'Par conducteur' },
    { id: 'arrets_analysis', label: 'Analyse arrêts' },
  ];

  return (
    <div>
      <div className="page-title">📊 Dashboard KPI multi-pôles</div>
      <div className="page-subtitle">Performance consolidée de la production MULTIPRINT</div>

      {/* Filters */}
      <div className="dash-filters">
        <div className="form-group"><label>Pôle</label>
          <select value={filters.poleId} onChange={(e) => setFilters({ ...filters, poleId: e.target.value })} className="form-input">
            <option value="">Tous les pôles</option>
            {data.poles?.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
          </select></div>
        <div className="form-group"><label>Du</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="form-input" /></div>
        <div className="form-group"><label>Au</label>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="form-input" /></div>
        <button onClick={() => setFilters({ poleId: '', dateFrom: '', dateTo: '' })} className="btn btn-sm btn-secondary">Reset</button>
      </div>

      {/* Tabs */}
      <div className="tabs dash-tabs">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn${tab === t.id ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* === GLOBAL VIEW === */}
      {tab === 'global' && (<>
        <div className="dash-kpi-grid">
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-blue)' }}><div className="dash-kpi-label">Dossiers</div><div className="dash-kpi-value">{data.nbTotal}</div><div className="dash-kpi-sub">{data.nbEnCours} en cours · {data.nbAttente} attente · {data.nbCloture} clôturés</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-green)' }}><div className="dash-kpi-label">Qté bonne</div><div className="dash-kpi-value" style={{ color: 'var(--accent-green)' }}>{formatNumber(data.totBonnes)}</div><div className="dash-kpi-sub">/ {formatNumber(data.qteCmd || 0)} commandés</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-red)' }}><div className="dash-kpi-label">Gâche</div><div className="dash-kpi-value" style={{ color: 'var(--accent-red)' }}>{formatNumber(data.totGache)}</div><div className="dash-kpi-sub">{data.txGache.toFixed(1)}% taux de gâche</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-orange)' }}><div className="dash-kpi-label">Arrêts</div><div className="dash-kpi-value" style={{ color: 'var(--accent-orange)' }}>{data.nbArrets}</div><div className="dash-kpi-sub">{formatDuration(data.totStopMs)} total</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-cyan)' }}><div className="dash-kpi-label">Disponibilité</div><div className="dash-kpi-value" style={{ color: 'var(--accent-cyan)' }}>{data.txDispo.toFixed(1)}%</div><div className="dash-kpi-sub">MTTR : {formatDuration(data.mttr)}</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-purple)' }}><div className="dash-kpi-label">Conformité tâches</div><div className="dash-kpi-value" style={{ color: 'var(--accent-purple)' }}>{data.txConf.toFixed(1)}%</div><div className="dash-kpi-sub">{data.nbTacheConf || 0} conf / {data.nbTacheNC || 0} NC</div></div>
          <div className="dash-kpi"><div className="dash-kpi-label">Contrôles</div><div className="dash-kpi-value">{data.nbCtrlBon + data.nbCtrlMauv}</div><div className="dash-kpi-sub">{data.nbCtrlBon} bons / {data.nbCtrlMauv} mauvais</div></div>
          <div className="dash-kpi"><div className="dash-kpi-label">Passations</div><div className="dash-kpi-value">{data.nbPassations}</div><div className="dash-kpi-sub">transferts d&apos;équipe</div></div>
        </div>

        <div className="grid-2">
          {/* Bar chart — Production par pôle */}
          <div className="section-block">
            <div className="section-block-title">📊 Production par pôle</div>
            {data.perPole && data.perPole.length > 0 && (() => {
              const maxProd = Math.max(...data.perPole.map((p: any) => p.engage), 1);
              const barItems = data.perPole.map((p: any) => ({
                label: p.pole.nom.replace('Héliogravure ', 'Hélio ').replace('Bouchon ', 'B.'),
                value: p.engage, display: formatNumber(p.engage), color: p.pole.couleur
              }));
              return <BarChart items={barItems} maxVal={maxProd} />;
            })()}
          </div>

          {/* Donut — Répartition des dossiers */}
          <div className="section-block">
            <div className="section-block-title">📋 Répartition des dossiers</div>
            <div className="donut-container">
              <DonutSVG segments={[
                { value: data.nbEnCours, color: 'var(--accent-green)' },
                { value: data.nbAttente, color: 'var(--accent-orange)' },
                { value: data.nbCloture, color: 'var(--accent-blue)' },
              ]} size={120} centerLabel="dossiers" />
              <div className="donut-legend">
                <div className="donut-legend-item"><div className="donut-legend-color" style={{ background: 'var(--accent-green)' }} />En cours ({data.nbEnCours})</div>
                <div className="donut-legend-item"><div className="donut-legend-color" style={{ background: 'var(--accent-orange)' }} />En attente ({data.nbAttente})</div>
                <div className="donut-legend-item"><div className="donut-legend-color" style={{ background: 'var(--accent-blue)' }} />Clôturés ({data.nbCloture})</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pareto arrêts */}
        {data.pareto && data.pareto.length > 0 && (
          <div className="section-block">
            <div className="section-block-title">📉 Pareto des causes d&apos;arrêt</div>
            {data.pareto.slice(0, 8).map((p: any) => {
              const maxC = data.pareto[0]?.count || 1;
              const pctW = (p.count / maxC) * 100;
              return (
                <div key={p.id} className="pareto-row">
                  <span className="pareto-label">{p.label}</span>
                  <div className="pareto-bar-bg"><div className="pareto-bar-fill" style={{ width: `${pctW}%`, background: 'var(--accent-red)' }}>{p.count}</div></div>
                  <span className="pareto-count">{p.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </>)}

      {/* === COMPARATIF PÔLES === */}
      {tab === 'poles' && (<>
        <div className="section-block">
          <div className="section-block-title">🏭 Comparatif multi-pôles</div>
          <div style={{ overflowX: 'auto' }}><table className="data-table comp-table"><thead><tr>
            <th>Pôle</th><th>Dossiers</th><th>Engagé</th><th>Bonnes</th><th>Gâche</th><th>Tx Gâche</th><th>Arrêts</th><th>Tps arrêt</th><th>Dispo.</th><th>Conformité</th>
          </tr></thead><tbody>
            {data.perPole.map((p: any) => (
              <tr key={p.pole.id}>
                <td style={{ fontWeight: 600 }}>{p.pole.icone} {p.pole.nom}</td>
                <td className="highlight">{p.dossiers}</td>
                <td>{formatNumber(p.engage)}</td>
                <td style={{ color: 'var(--accent-green)' }}>{formatNumber(p.bonnes)}</td>
                <td style={{ color: 'var(--accent-red)' }}>{formatNumber(p.gache)}</td>
                <td className="highlight">{p.txGache.toFixed(1)}%</td>
                <td>{p.arrets}</td>
                <td>{formatDuration(p.stopMs || 0)}</td>
                <td style={{ color: p.txDispo >= 85 ? 'var(--accent-green)' : p.txDispo >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{p.txDispo.toFixed(1)}%</td>
                <td>{p.txConf.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody></table></div>
        </div>

        {/* Bar charts comparison */}
        <div className="grid-2">
          <div className="section-block">
            <div className="section-block-title">Production engagée</div>
            {(() => {
              const maxEng = Math.max(...data.perPole.map((p: any) => p.engage), 1);
              const items = data.perPole.map((p: any) => ({ label: p.pole.nom.split(' ')[0], value: p.engage, display: formatNumber(p.engage), color: p.pole.couleur }));
              return <BarChart items={items} maxVal={maxEng} />;
            })()}
          </div>
          <div className="section-block">
            <div className="section-block-title">Taux de disponibilité (%)</div>
            {(() => {
              const items = data.perPole.map((p: any) => ({
                label: p.pole.nom.split(' ')[0], value: p.txDispo, display: `${p.txDispo.toFixed(0)}%`,
                color: p.txDispo >= 85 ? 'var(--accent-green)' : p.txDispo >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)'
              }));
              return <BarChart items={items} maxVal={100} />;
            })()}
          </div>
        </div>
      </>)}

      {/* === PAR MACHINE === */}
      {tab === 'machines' && (<>
        <div className="section-block">
          <div className="section-block-title">🖨️ Performance par machine</div>
          {(!data.perMachine || data.perMachine.length === 0) ? (
            <div className="empty-state" style={{ padding: 20 }}><div className="empty-state-text">Aucune donnée machine</div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}><table className="data-table comp-table"><thead><tr>
              <th>Machine</th><th>Pôle</th><th>Dossiers</th><th>Engagé</th><th>Gâche</th><th>Tx Gâche</th><th>Arrêts</th><th>Tps arrêt</th><th>Dispo.</th>
            </tr></thead><tbody>
              {data.perMachine.map((m: any) => (
                <tr key={m.machine.id}>
                  <td style={{ fontWeight: 600 }}>{m.machine.codeMachine} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{m.machine.nom}</span></td>
                  <td>{m.pole?.icone} {m.pole?.nom || '—'}</td>
                  <td className="highlight">{m.dossiers}</td>
                  <td>{formatNumber(m.engage)}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{formatNumber(m.gache)}</td>
                  <td>{m.txGache.toFixed(1)}%</td>
                  <td>{m.arrets}</td>
                  <td>{formatDuration(m.stopMs || 0)}</td>
                  <td style={{ color: m.txDispo >= 85 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{m.txDispo.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>

        {/* Top machines bar chart */}
        {data.perMachine && data.perMachine.length > 0 && (
          <div className="section-block">
            <div className="section-block-title">Charge par machine (engagé)</div>
            {(() => {
              const sorted = [...data.perMachine].sort((a: any, b: any) => b.engage - a.engage);
              const maxM = sorted[0]?.engage || 1;
              const mItems = sorted.slice(0, 8).map((m: any) => ({
                label: m.machine.codeMachine, value: m.engage, display: formatNumber(m.engage),
                color: m.pole?.couleur || 'var(--accent-blue)'
              }));
              return <BarChart items={mItems} maxVal={maxM} />;
            })()}
          </div>
        )}
      </>)}

      {/* === PAR CONDUCTEUR === */}
      {tab === 'conducteurs' && (<>
        <div className="section-block">
          <div className="section-block-title">👷 Performance par conducteur</div>
          {(!data.perOp || data.perOp.length === 0) ? (
            <div className="empty-state" style={{ padding: 20 }}><div className="empty-state-text">Aucune donnée opérateur</div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}><table className="data-table comp-table"><thead><tr>
              <th>Conducteur</th><th>Matricule</th><th>Dossiers</th><th>Bonnes</th><th>Gâche</th><th>Tx Gâche</th><th>Arrêts</th>
            </tr></thead><tbody>
              {data.perOp.map((o: any) => (
                <tr key={o.op.id}>
                  <td style={{ fontWeight: 600 }}>{o.op.nom}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{o.op.matricule || '—'}</td>
                  <td className="highlight">{o.dossiers}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{formatNumber(o.bonnes)}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{formatNumber(o.gache)}</td>
                  <td>{o.txGache.toFixed(1)}%</td>
                  <td>{o.arrets}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>

        {/* Conducteur bar chart */}
        {data.perOp && data.perOp.length > 0 && (
          <div className="section-block">
            <div className="section-block-title">Production déclarée par conducteur</div>
            {(() => {
              const sorted = [...data.perOp].sort((a: any, b: any) => b.bonnes - a.bonnes);
              const maxO = Math.max(...sorted.map((o: any) => o.bonnes), 1);
              const oItems = sorted.slice(0, 10).map((o: any) => ({
                label: o.op.nom.split(' ').pop() || o.op.nom, value: o.bonnes, display: formatNumber(o.bonnes), color: 'var(--accent-blue)'
              }));
              return <BarChart items={oItems} maxVal={maxO} />;
            })()}
          </div>
        )}
      </>)}

      {/* === ANALYSE ARRÊTS === */}
      {tab === 'arrets_analysis' && (<>
        <div className="dash-kpi-grid">
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-red)' }}><div className="dash-kpi-label">Total arrêts</div><div className="dash-kpi-value" style={{ color: 'var(--accent-red)' }}>{data.nbArrets}</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-orange)' }}><div className="dash-kpi-label">Temps total</div><div className="dash-kpi-value" style={{ color: 'var(--accent-orange)' }}>{formatDuration(data.totStopMs)}</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-cyan)' }}><div className="dash-kpi-label">MTTR</div><div className="dash-kpi-value">{formatDuration(data.mttr)}</div><div className="dash-kpi-sub">temps moyen de réparation</div></div>
          <div className="dash-kpi" style={{ borderBottom: '3px solid var(--accent-green)' }}><div className="dash-kpi-label">Disponibilité</div><div className="dash-kpi-value" style={{ color: 'var(--accent-green)' }}>{data.txDispo.toFixed(1)}%</div></div>
        </div>

        {/* Pareto full */}
        <div className="section-block">
          <div className="section-block-title">📉 Pareto des causes d&apos;arrêt</div>
          {(!data.pareto || data.pareto.length === 0) ? (
            <div className="empty-state" style={{ padding: 20 }}><div className="empty-state-text">Aucun arrêt enregistré</div></div>
          ) : (() => {
            const totalCauses = data.pareto.reduce((s: number, p: any) => s + p.count, 0);
            let cumul = 0;
            return data.pareto.map((p: any) => {
              const maxC = data.pareto[0].count;
              cumul += p.count;
              const pctW = (p.count / maxC) * 100;
              const pctCumul = totalCauses > 0 ? ((cumul / totalCauses) * 100).toFixed(0) : '0';
              return (
                <div key={p.id} className="pareto-row">
                  <span className="pareto-label">{p.label}</span>
                  <div className="pareto-bar-bg"><div className="pareto-bar-fill" style={{ width: `${pctW}%`, background: 'var(--accent-red)' }}>{p.count}</div></div>
                  <span className="pareto-count">{pctCumul}%</span>
                </div>
              );
            });
          })()}
        </div>

        {/* Arrêts par pôle bar chart */}
        {data.perPole && data.perPole.length > 0 && (
          <div className="section-block">
            <div className="section-block-title">Arrêts par pôle</div>
            {(() => {
              const maxStops = Math.max(...data.perPole.map((p: any) => p.arrets), 1);
              const sItems = data.perPole.map((p: any) => ({
                label: p.pole.nom.split(' ')[0], value: p.arrets,
                display: `${p.arrets} (${formatDuration(p.stopMs || 0)})`,
                color: 'var(--accent-red)'
              }));
              return <BarChart items={sItems} maxVal={maxStops} />;
            })()}
          </div>
        )}
      </>)}
    </div>
  );
}
