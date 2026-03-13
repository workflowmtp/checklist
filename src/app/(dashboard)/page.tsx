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
      <div className="mb-6">
        <h1 className="font-mono text-[1.5rem] font-bold mb-1">Bienvenue, {user?.name?.split(' ')[0]}</h1>
        <p className="text-[var(--text-secondary)] text-[0.9rem]">Vue d&apos;ensemble de la production MULTIPRINT</p>
      </div>
      {enCours > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.2)] text-[var(--accent-blue)] text-[0.85rem] mb-5">⚡ {enCours} dossier{enCours > 1 ? 's' : ''} en cours de production</div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          { label: 'Dossiers actifs', value: enCours + enAttente, color: 'var(--accent-blue)', sub: `${enCours} en cours · ${enAttente} en attente` },
          { label: 'Clôturés', value: clotures, color: 'var(--accent-green)' },
          { label: 'Pôles', value: poles.length },
          { label: 'Machines', value: machineCount },
        ].map((k) => (
          <div key={k.label} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
            <div className="text-[0.72rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">{k.label}</div>
            <div className="font-mono text-[1.6rem] font-bold" style={{ color: k.color }}>{k.value}</div>
            {k.sub && <div className="text-[0.75rem] text-[var(--text-tertiary)] mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3.5">🏭 Pôles de production</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {poles.map((p) => (
            <Link key={p.id} href={`/pole/${p.id}`} className="block border border-[var(--border-primary)] rounded-lg p-6 card-interactive" style={{ borderTop: `3px solid ${p.couleur}` }}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-md flex items-center justify-center text-xl" style={{ background: `${p.couleur}20`, color: p.couleur }}>{p.icone}</div>
                <div><div className="font-mono font-bold text-[1.05rem]">{p.nom}</div><div className="text-[0.8rem] text-[var(--text-tertiary)]">{p.description}</div></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: p.ateliers.length, l: 'Ateliers' }, { v: p.machines.length, l: 'Machines' }, { v: p.dossiers.length, l: 'En cours', c: 'var(--accent-green)' }].map((s) => (
                  <div key={s.l} className="text-center p-2 bg-[var(--bg-tertiary)] rounded-md">
                    <div className="font-mono font-bold text-[1.1rem]" style={{ color: s.c }}>{s.v}</div>
                    <div className="text-[0.65rem] text-[var(--text-tertiary)] uppercase">{s.l}</div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
        <div className="font-mono font-bold text-base mb-3.5">📋 Dossiers actifs <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{activeDossiers.length}</span></div>
        {activeDossiers.length === 0 ? <div className="text-center py-8 text-[var(--text-tertiary)]">Aucun dossier actif</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>
            {['Dossier','OF','Client','Désignation','Pôle','Machine','Statut'].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
          </tr></thead><tbody>
            {activeDossiers.map((d) => (
              <tr key={d.id} className="hover:bg-[var(--bg-tertiary)]">
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]"><Link href={`/dossier/${d.id}`} className="font-mono font-semibold hover:text-[var(--accent-blue)]">{d.dossierNumero}</Link></td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.ofNumero || '—'}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.client || '—'}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)] max-w-[200px] truncate">{d.designation}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.pole?.icone} {d.pole?.nom}</td>
                <td className="px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]">{d.machine?.codeMachine}</td>
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
