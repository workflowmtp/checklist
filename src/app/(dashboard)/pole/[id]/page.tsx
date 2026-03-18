import { getPoleData } from '@/lib/actions';
import { getStatutDossierLabel } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PolePage({ params }: { params: { id: string } }) {
  const { pole, clotures } = await getPoleData(params.id);
  if (!pole) redirect('/');
  const dosActifs = pole.dossiers.filter((d) => d.statut === 'EN_COURS');
  const dosAttente = pole.dossiers.filter((d) => d.statut === 'EN_ATTENTE');

  return (
    <div>
      {/* Header */}
      <div className="pole-detail-header" style={{ borderLeft: `4px solid ${pole.couleur}` }}>
        <Link href="/" className="btn-icon" title="Retour à l&apos;accueil" style={{ flexShrink: 0, fontSize: '1.1rem' }}>←</Link>
        <div className="pole-detail-icon" style={{ background: `${pole.couleur}20`, color: pole.couleur }}>{pole.icone}</div>
        <div style={{ flex: 1 }}>
          <div className="pole-detail-title">{pole.nom}</div>
          <div className="pole-detail-desc">{pole.description}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi-card"><div className="kpi-card-label">En cours</div><div className="kpi-card-value" style={{ color: 'var(--accent-green)' }}>{dosActifs.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">En attente</div><div className="kpi-card-value" style={{ color: 'var(--accent-orange)' }}>{dosAttente.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Clôturés</div><div className="kpi-card-value" style={{ color: 'var(--accent-blue)' }}>{clotures}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Ateliers</div><div className="kpi-card-value">{pole.ateliers.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Machines</div><div className="kpi-card-value">{pole.machines.length}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Opérateurs</div><div className="kpi-card-value">{pole.operateurs.length}</div></div>
      </div>

      {/* Ateliers */}
      <div className="section-block">
        <div className="section-block-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🏗️ Ateliers <span className="accordion-badge">{pole.ateliers.length}</span></span>
        </div>
        {pole.ateliers.length === 0 ? (
          <div className="empty-state"><div className="empty-state-text">Aucun atelier configuré</div></div>
        ) : (
          <div className="grid-2">
            {pole.ateliers.map((at) => (
              <Link key={at.id} href={`/atelier/${at.id}`} className="atelier-card">
                <div className="atelier-card-name">{at.nom}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{at.description}</div>
                <div className="atelier-card-stats">
                  <div className="atelier-card-stat">🖨️ {at.machineAteliers.length} machines</div>
                  <div className="atelier-card-stat">👷 {at.operateurAteliers.length} opérateurs</div>
                  <div className="atelier-card-stat" style={{ color: 'var(--accent-green)' }}>📋 {at.dossiers.length} en cours</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Dossiers actifs */}
      <div className="section-block">
        <div className="section-block-title">📋 Dossiers actifs du pôle <span className="accordion-badge">{pole.dossiers.length}</span></div>
        {pole.dossiers.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucun dossier actif</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Dossier','OF','Client','Machine','Désignation','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {pole.dossiers.map((d) => (
              <tr key={d.id} style={{ cursor: 'pointer' }}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}><Link href={`/dossier/${d.id}`} className="hover:text-[var(--accent-blue)]">{d.dossierNumero}</Link></td>
                <td>{d.ofNumero || '—'}</td>
                <td>{d.client || '—'}</td>
                <td>{d.machine?.codeMachine || '—'}</td>
                <td>{d.designation}</td>
                <td><span className={`status-badge ${d.statut === 'EN_COURS' ? 'active' : 'paused'}`}>{getStatutDossierLabel(d.statut)}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {/* Machines */}
      <div className="section-block">
        <div className="section-block-title">🖨️ Machines <span className="accordion-badge">{pole.machines.length}</span></div>
        {pole.machines.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucune machine</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Code','Nom','Description','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {pole.machines.map((m) => (
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
        <div className="section-block-title">👷 Opérateurs <span className="accordion-badge">{pole.operateurs.length}</span></div>
        {pole.operateurs.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucun opérateur</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Nom','Matricule','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {pole.operateurs.map((op) => (
              <tr key={op.id}>
                <td style={{ fontWeight: 600 }}>{op.nom}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{op.matricule || '—'}</td>
                <td><span className={`status-badge ${op.actif ? 'active' : 'stopped'}`}>{op.actif ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
