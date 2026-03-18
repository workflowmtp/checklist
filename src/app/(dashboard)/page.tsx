import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHomeData } from '@/lib/actions';
import { getStatutDossierLabel } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const { poles, activeDossiers, machineCount, counts } = await getHomeData();
  const enCours = counts['EN_COURS'] || 0;
  const enAttente = counts['EN_ATTENTE'] || 0;
  const clotures = counts['CLOTURE'] || 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div className="page-title">Bienvenue, {user?.name?.split(' ')[0]}</div>
        <div className="page-subtitle">Vue d&apos;ensemble de la production MULTIPRINT</div>
      </div>

      {enCours > 0 && (
        <div className="alert-banner info">⚡ {enCours} dossier{enCours > 1 ? 's' : ''} en cours de production</div>
      )}

      <div className="kpi-row">
        <div className="kpi-card"><div className="kpi-card-label">Dossiers actifs</div><div className="kpi-card-value" style={{ color: 'var(--accent-blue)' }}>{enCours + enAttente}</div><div className="kpi-card-sub">{enCours} en cours · {enAttente} en attente</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Clôturés</div><div className="kpi-card-value" style={{ color: 'var(--accent-green)' }}>{clotures}</div><div className="kpi-card-sub">total historique</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Pôles</div><div className="kpi-card-value">{poles.length}</div><div className="kpi-card-sub">pôles de production</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Machines</div><div className="kpi-card-value">{machineCount}</div><div className="kpi-card-sub">machines configurées</div></div>
      </div>

      <div className="section-block">
        <div className="section-block-title">🏭 Pôles de production</div>
        <div className="grid-2">
          {poles.map((p) => (
            <Link key={p.id} href={`/pole/${p.id}`} className="pole-card" style={{ borderTop: `3px solid ${p.couleur}` }}>
              <div className="pole-card-header">
                <div className="pole-card-icon" style={{ background: `${p.couleur}20`, color: p.couleur }}>{p.icone}</div>
                <div>
                  <div className="pole-card-name">{p.nom}</div>
                  <div className="pole-card-desc">{p.description}</div>
                </div>
              </div>
              <div className="pole-card-stats">
                <div className="pole-stat"><div className="pole-stat-value">{p.ateliers.length}</div><div className="pole-stat-label">Ateliers</div></div>
                <div className="pole-stat"><div className="pole-stat-value">{p.machines.length}</div><div className="pole-stat-label">Machines</div></div>
                <div className="pole-stat"><div className="pole-stat-value" style={{ color: 'var(--accent-green)' }}>{p.dossiers.length}</div><div className="pole-stat-label">En cours</div></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-title">📋 Dossiers actifs <span className="accordion-badge">{activeDossiers.length}</span></div>
        {activeDossiers.length === 0 ? <div className="empty-state"><div className="empty-state-text">Aucun dossier actif</div></div> : (
          <div className="overflow-x-auto"><table className="data-table"><thead><tr>
            {['Dossier','OF','Client','Désignation','Pôle','Machine','Statut'].map((h) => <th key={h}>{h}</th>)}
          </tr></thead><tbody>
            {activeDossiers.map((d) => (
              <tr key={d.id} style={{ cursor: 'pointer' }}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}><Link href={`/dossier/${d.id}`} className="hover:text-[var(--accent-blue)]">{d.dossierNumero}</Link></td>
                <td>{d.ofNumero || '—'}</td>
                <td>{d.client || '—'}</td>
                <td>{d.designation}</td>
                <td>{d.pole?.icone} {d.pole?.nom}</td>
                <td>{d.machine?.codeMachine || '—'}</td>
                <td><span className={`status-badge ${d.statut === 'EN_COURS' ? 'active' : 'paused'}`}>{getStatutDossierLabel(d.statut)}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
