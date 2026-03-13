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
      <div className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg mb-6" style={{ borderLeft: `4px solid ${p.couleur}` }}>
        <Link href={`/pole/${p.id}`} className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-lg">←</Link>
        <div className="w-14 h-14 rounded-md flex items-center justify-center text-[26px]" style={{ background: `${p.couleur}20`, color: p.couleur }}>🏗️</div>
        <div className="flex-1"><div className="font-mono font-bold text-[1.3rem]">{atelier.nom}</div><div className="text-[0.85rem] text-[var(--text-secondary)]">{atelier.description} — {p.nom}</div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        {[
          { l: 'En cours', v: dosActifs.length, c: 'var(--accent-green)' },
          { l: 'En attente', v: dosAttente.length, c: 'var(--accent-orange)' },
          { l: 'Clôturés', v: clotures, c: 'var(--accent-blue)' },
          { l: 'Machines', v: machines.length },
          { l: 'Opérateurs', v: ops.length },
        ].map((k) => (
          <div key={k.l} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
            <div className="text-[0.72rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">{k.l}</div>
            <div className="font-mono text-[1.6rem] font-bold" style={{ color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <Link href={`/dossier/nouveau?atelier_id=${atelier.id}&pole_id=${p.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue text-[0.9rem]">+ Nouveau dossier</Link>
      </div>

      {/* Dossiers */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3.5">📋 Dossiers en cours <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{atelier.dossiers.length}</span></div>
        {atelier.dossiers.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun dossier actif</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>
            {['Dossier','OF','Client','Machine','Désignation','Statut'].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
          </tr></thead><tbody>
            {atelier.dossiers.map((d) => (
              <tr key={d.id} className="hover:bg-[var(--bg-tertiary)]">
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]"><Link href={`/dossier/${d.id}`} className="font-mono font-semibold hover:text-[var(--accent-blue)]">{d.dossierNumero}</Link></td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.ofNumero || '—'}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.client || '—'}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.machine?.codeMachine || '—'}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)] max-w-[200px] truncate">{d.designation}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${d.statut === 'EN_COURS' ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]'}`}>{getStatutDossierLabel(d.statut)}</span>
                </td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {/* Machines + Ops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">🖨️ Machines <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{machines.length}</span></div>
          {machines.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border-primary)] last:border-0 text-[0.85rem]">
              <span><span className="font-mono font-semibold">{m.codeMachine}</span> — {m.nom}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${m.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{m.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          ))}
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">👷 Opérateurs <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{ops.length}</span></div>
          {ops.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-[var(--border-primary)] last:border-0 text-[0.85rem]">
              <span className="font-semibold">{o.nom}</span>
              <span className="font-mono text-[var(--text-tertiary)] text-[0.8rem]">{o.matricule || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
