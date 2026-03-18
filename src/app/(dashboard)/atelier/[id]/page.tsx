import { getAtelierData } from '@/lib/actions';
import { getStatutDossierLabel } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AtelierPage({ params }: { params: { id: string } }) {
  const { atelier, clotures } = await getAtelierData(params.id);
  if (!atelier) redirect('/');
  const p = atelier.pole;
  const machines = atelier.machineAteliers.map((ma) => ma.machine);
  const ops = atelier.operateurAteliers.map((oa) => oa.operateur);
  const dosActifs = atelier.dossiers.filter((d) => d.statut === 'EN_COURS');
  const dosAttente = atelier.dossiers.filter((d) => d.statut === 'EN_ATTENTE');

  return (
    <div>
      {/* Header */}
      <div className="pole-detail-header" style={{ borderLeft: `4px solid ${p.couleur}` }}>
        <Link href={`/pole/${p.id}`} className="btn-icon" title="Retour au pôle" style={{ flexShrink: 0, fontSize: '1.1rem' }}>←</Link>
        <div className="pole-detail-icon" style={{ background: `${p.couleur}20`, color: p.couleur }}>🏗️</div>
        <div style={{ flex: 1 }}>
          <div className="pole-detail-title">{atelier.nom}</div>
          <div className="pole-detail-desc">{atelier.description} — {p.nom}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi-card"><div className="kpi-card-label">En cours</div><div className="kpi-card-value" style={{ color: 'var(--accent-green)' }}>{dosActifs.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">En attente</div><div className="kpi-card-value" style={{ color: 'var(--accent-orange)' }}>{dosAttente.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Clôturés</div><div className="kpi-card-value" style={{ color: 'var(--accent-blue)' }}>{clotures}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Machines</div><div className="kpi-card-value">{machines.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Opérateurs</div><div className="kpi-card-value">{ops.length}</div></div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href={`/dossier/nouveau?atelier_id=${atelier.id}&pole_id=${p.id}`} className="btn btn-primary">+ Nouveau dossier</Link>
      </div>

      {/* Dossiers */}
      <div className="section-block">
        <div className="section-block-title">📋 Dossiers en cours <span className="accordion-badge">{atelier.dossiers.length}</span></div>
        {atelier.dossiers.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucun dossier actif dans cet atelier</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Dossier','OF','Client','Machine','Désignation','Qté commandée','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {atelier.dossiers.map((d) => (
              <tr key={d.id} style={{ cursor: 'pointer' }}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}><Link href={`/dossier/${d.id}`} className="hover:text-[var(--accent-blue)]">{d.dossierNumero}</Link></td>
                <td>{d.ofNumero || '—'}</td>
                <td>{d.client || '—'}</td>
                <td>{d.machine?.codeMachine || '—'}</td>
                <td>{d.designation}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{d.quantiteCommandee?.toLocaleString('fr-FR') || '0'} {d.unite || ''}</td>
                <td><span className={`status-badge ${d.statut === 'EN_COURS' ? 'active' : 'paused'}`}>{getStatutDossierLabel(d.statut)}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {/* Machines */}
      <div className="section-block">
        <div className="section-block-title">🖨️ Machines affectées <span className="accordion-badge">{machines.length}</span></div>
        {machines.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucune machine affectée</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Code','Nom','Description','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {machines.map((m) => (
              <tr key={m.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.codeMachine}</td>
                <td style={{ fontWeight: 600 }}>{m.nom}</td>
                <td>{m.description || '—'}</td>
                <td><span className={`status-badge ${m.actif ? 'active' : 'stopped'}`}>{m.actif ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {/* Opérateurs */}
      <div className="section-block">
        <div className="section-block-title">👷 Opérateurs affectés <span className="accordion-badge">{ops.length}</span></div>
        {ops.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucun opérateur affecté</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Nom','Matricule','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {ops.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{o.nom}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{o.matricule || '—'}</td>
                <td><span className={`status-badge ${o.actif ? 'active' : 'stopped'}`}>{o.actif ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
