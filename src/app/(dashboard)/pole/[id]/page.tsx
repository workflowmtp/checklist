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
      <div className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg mb-6" style={{ borderLeft: `4px solid ${pole.couleur}` }}>
        <Link href="/" className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-lg">←</Link>
        <div className="w-14 h-14 rounded-md flex items-center justify-center text-[26px]" style={{ background: `${pole.couleur}20`, color: pole.couleur }}>{pole.icone}</div>
        <div className="flex-1"><div className="font-mono font-bold text-[1.3rem]">{pole.nom}</div><div className="text-[0.85rem] text-[var(--text-secondary)]">{pole.description}</div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        {[
          { l: 'En cours', v: dosActifs.length, c: 'var(--accent-green)' },
          { l: 'En attente', v: dosAttente.length, c: 'var(--accent-orange)' },
          { l: 'Clôturés', v: clotures, c: 'var(--accent-blue)' },
          { l: 'Ateliers', v: pole.ateliers.length },
          { l: 'Machines', v: pole.machines.length },
          { l: 'Opérateurs', v: pole.operateurs.length },
        ].map((k) => (
          <div key={k.l} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
            <div className="text-[0.72rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">{k.l}</div>
            <div className="font-mono text-[1.6rem] font-bold" style={{ color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <Link href={`/dossier/nouveau?pole_id=${pole.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue text-[0.9rem]">+ Nouveau dossier</Link>
      </div>

      {/* Ateliers */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3.5">🏗️ Ateliers</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pole.ateliers.map((at) => (
            <Link key={at.id} href={`/atelier/${at.id}`} className="block border border-[var(--border-primary)] rounded-md p-4 card-interactive">
              <div className="font-bold text-[0.95rem] mb-2">{at.nom}</div>
              <div className="text-[0.8rem] text-[var(--text-tertiary)] mb-2">{at.description}</div>
              <div className="flex gap-4 text-[0.8rem] text-[var(--text-secondary)]">
                <span>🖨️ {at.machineAteliers.length} machines</span>
                <span>👷 {at.operateurAteliers.length} opérateurs</span>
                <span className="text-[var(--accent-green)]">📋 {at.dossiers.length} en cours</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dossiers actifs */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
        <div className="font-mono font-bold text-base mb-3.5">📋 Dossiers actifs du pôle <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{pole.dossiers.length}</span></div>
        {pole.dossiers.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun dossier actif</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>
            {['Dossier','OF','Client','Machine','Désignation','Statut'].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
          </tr></thead><tbody>
            {pole.dossiers.map((d) => (
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
    </div>
  );
}
