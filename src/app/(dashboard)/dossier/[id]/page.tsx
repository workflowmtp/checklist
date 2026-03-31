import { getDossierData } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { formatNumber, formatDuration, getStatutDossierLabel, getStatutTacheLabel } from '@/lib/utils';
import Link from 'next/link';
import { DossierClient, TaskActionButtons } from './client';

export default async function DossierPage({ params }: { params: { id: string } }) {
  const dossier = await getDossierData(params.id);
  if (!dossier) redirect('/');

  const taches = dossier.taches;
  const doneTasks = taches.filter((t) => t.statut === 'CONFORME' || t.statut === 'NON_CONFORME').length;
  const pct = taches.length > 0 ? Math.round((doneTasks / taches.length) * 100) : 0;
  const elapsed = dossier.dateDebut ? Date.now() - new Date(dossier.dateDebut).getTime() : 0;
  const opsNames = dossier.dossierOperateurs.map((do_) => do_.operateur.nom).join(', ');

  // Production totals
  let totB = 0, totC = 0, totG = 0, totE = 0;
  dossier.declarations.forEach((d) => { totB += d.bonnes; totC += d.calage; totG += d.gache; totE += d.totalEngage; });

  // Stop totals
  let totStopMs = 0;
  dossier.arrets.forEach((a) => { totStopMs += a.dureeMs || 0; });
  const activeStop = dossier.arrets.find((a) => a.statut === 'ACTIF');

  // Controls summary
  let nbGood = 0, nbBad = 0;
  dossier.controles.forEach((c) => { if (c.resultat === 'bon') nbGood++; else nbBad++; });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg mb-5 flex-wrap" style={{ borderLeft: `4px solid ${dossier.pole.couleur}` }}>
        <Link href={`/atelier/${dossier.atelierId}`} className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-lg flex-shrink-0">←</Link>
        <span className="font-mono font-bold text-[1.2rem]">{dossier.dossierNumero}</span>
        <span className="text-[var(--text-muted)]">|</span>
        <span className="text-[0.85rem] text-[var(--text-secondary)]">{dossier.ofNumero || '—'}</span>
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${
          dossier.statut === 'EN_COURS' ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' :
          dossier.statut === 'CLOTURE' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' :
          'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)]'
        }`}>{getStatutDossierLabel(dossier.statut)}</span>
        <div className="ml-auto flex gap-2">
          <DossierClient dossier={JSON.parse(JSON.stringify(dossier))} />
        </div>
      </div>

      {/* Cloture banner */}
      {dossier.statut === 'CLOTURE' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-[var(--accent-green-dim)] border border-[rgba(34,197,94,0.2)] text-[var(--accent-green)] text-[0.85rem] mb-5">
          🏁 Dossier clôturé le {dossier.dateFin ? new Date(dossier.dateFin).toLocaleString('fr-FR') : '—'} par {dossier.cloturePar?.nom || '—'}
          {dossier.commentaireCloture && ` — ${dossier.commentaireCloture}`}
        </div>
      )}

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[
          { l: 'Pôle', v: `${dossier.pole.icone} ${dossier.pole.nom}` },
          { l: 'Atelier', v: dossier.atelier.nom },
          { l: 'Machine', v: `${dossier.machine.codeMachine} — ${dossier.machine.nom}` },
          { l: 'Conducteur(s)', v: opsNames || '—' },
          { l: 'Client', v: dossier.client || '—' },
          { l: 'Qté commandée', v: `${formatNumber(dossier.quantiteCommandee)} ${dossier.unite}`, mono: true },
          { l: 'Désignation', v: dossier.designation },
          { l: 'Durée totale', v: formatDuration(elapsed), mono: true },
        ].map((m) => (
          <div key={m.l} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md px-3.5 py-3">
            <div className="text-[0.7rem] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">{m.l}</div>
            <div className={`font-semibold text-[0.95rem] ${m.mono ? 'font-mono' : ''}`}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3">📊 Progression des tâches</div>
        <div className="flex justify-between text-[0.8rem] text-[var(--text-secondary)] mb-1">
          <span>{doneTasks} / {taches.length} tâches terminées</span>
          <span className="font-mono font-bold">{pct}%</span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded overflow-hidden">
          <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent-blue),var(--accent-green))' }} />
        </div>
      </div>

      {/* Active Stop Banner */}
      {activeStop && (
        <div className="bg-gradient-to-r from-[rgba(239,68,68,0.15)] to-[rgba(239,68,68,0.05)] border-2 border-[var(--accent-red)] rounded-lg p-5 mb-5 flex items-center gap-4 flex-wrap animate-stop-flash">
          <span className="text-[2rem]">🚨</span>
          <div className="flex-1 min-w-[200px]">
            <div className="font-mono font-bold text-[1.1rem] text-[var(--accent-red)]">ARRÊT EN COURS</div>
            <div className="text-[0.85rem] text-[var(--text-secondary)]">{activeStop.arretCauses.map((ac) => ac.cause.libelle).join(', ') || 'Sans cause'}</div>
          </div>
        </div>
      )}

      {/* Task Timeline */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="font-mono font-bold text-base mb-3.5">🔧 Séquence de tâches</div>
        {taches.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">Aucune tâche configurée pour cette machine</div>
        ) : (
          <div>
            {(() => {
              let currentFamily = '';
              let lastBlockingDone = true;
              return taches.map((t) => {
                const isDone = t.statut === 'CONFORME' || t.statut === 'NON_CONFORME';
                const isActive = t.statut === 'EN_COURS' || t.statut === 'EN_PAUSE';
                const isBlocked = !isDone && !isActive && !lastBlockingDone && t.statut === 'EN_ATTENTE';
                const familyHeader = t.famille && t.famille !== currentFamily;
                if (familyHeader) currentFamily = t.famille!;
                if (t.bloquante && !isDone) lastBlockingDone = false;

                return (
                  <div key={t.id}>
                    {familyHeader && <div className="font-mono font-bold text-[0.85rem] px-3.5 py-2 bg-[var(--bg-tertiary)] rounded-md mb-2 mt-3">📂 {t.famille}</div>}
                    <div className={`flex items-center gap-3.5 px-4 py-3 border border-[var(--border-primary)] rounded-md mb-1.5 transition-all ${
                      isDone ? 'opacity-70' : isActive ? 'border-[var(--accent-blue)] shadow-[0_0_0_2px_var(--accent-blue-dim)]' : isBlocked ? 'opacity-50' : ''
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[0.75rem] flex-shrink-0 ${
                        isDone ? 'bg-[var(--accent-green)] text-white' :
                        isActive ? 'bg-[var(--accent-blue)] text-white task-pulse' :
                        t.statut === 'NON_CONFORME' ? 'bg-[var(--accent-red)] text-white' :
                        'border-2 border-[var(--border-secondary)] text-[var(--text-tertiary)]'
                      }`}>{isDone ? '✓' : t.position}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.72rem] font-mono text-[var(--text-tertiary)]">
                          {t.code}{t.bloquante && <span className="ml-2 px-1.5 py-0.5 bg-[var(--accent-orange-dim)] text-[var(--accent-orange)] rounded text-[0.65rem] font-semibold">BLOQUANTE</span>}
                        </div>
                        <div className="font-semibold text-[0.9rem]">{t.libelle}</div>
                        <div className="flex gap-3.5 text-[0.78rem] text-[var(--text-secondary)] mt-0.5">
                          <span>Prévu : {t.tempsPrevuMin || 0} min</span>
                          {(t.tempsReelMs > 0 || isActive) && <span>Réel : {formatDuration(t.tempsReelMs)}</span>}
                          {t.statut !== 'EN_ATTENTE' && <span>Statut : {getStatutTacheLabel(t.statut)}</span>}
                        </div>
                        {t.commentaire && <div className="text-[0.78rem] text-[var(--accent-orange)] mt-0.5">💬 {t.commentaire}</div>}
                      </div>
                      {/* Task action buttons */}
                      {(dossier.statut === 'EN_COURS' || dossier.statut === 'EN_ATTENTE') && !isDone && !isBlocked && (
                        <TaskActionButtons taskId={t.id} statut={t.statut} dossierId={dossier.id} />
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Production + Arrêts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Declarations */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">📦 Déclaration de production</div>
          {dossier.declarations.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-2.5 mb-3">
                {[{ l: 'Bonnes', v: totB, c: 'var(--accent-green)' }, { l: 'Calage', v: totC, c: 'var(--accent-blue)' }, { l: 'Gâche', v: totG, c: 'var(--accent-red)' }, { l: 'Total', v: totE }].map((s) => (
                  <div key={s.l} className="text-center p-2.5 bg-[var(--bg-tertiary)] rounded-md">
                    <div className="font-mono font-bold text-[1.2rem]" style={{ color: s.c }}>{formatNumber(s.v)}</div>
                    <div className="text-[0.65rem] text-[var(--text-tertiary)] uppercase">{s.l}</div>
                  </div>
                ))}
              </div>
              {dossier.declarations.map((dp) => (
                <div key={dp.id} className="flex justify-between py-2 border-b border-[var(--border-primary)] last:border-0 text-[0.82rem]">
                  <span className="font-mono text-[0.75rem] text-[var(--text-tertiary)]">{new Date(dp.dateDeclaration).toLocaleString('fr-FR')}</span>
                  <span>{formatNumber(dp.bonnes)}B / {formatNumber(dp.calage)}C / {formatNumber(dp.gache)}G</span>
                </div>
              ))}
            </>
          ) : <div className="text-center py-5 text-[var(--text-tertiary)]">Aucune déclaration</div>}
        </div>

        {/* Arrêts */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">🚫 Arrêts / Incidents</div>
          {dossier.arrets.length > 0 ? (
            <>
              <div className="text-[0.82rem] text-[var(--text-secondary)] mb-2.5">{dossier.arrets.length} arrêt(s) — Temps total : <strong className="text-[var(--accent-red)]">{formatDuration(totStopMs)}</strong></div>
              {dossier.arrets.map((ar) => (
                <div key={ar.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-[var(--border-primary)] rounded-md mb-1.5 text-[0.85rem]">
                  <span>{ar.statut === 'ACTIF' ? '🔴' : '⚪'}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{ar.arretCauses.map((ac) => ac.cause.libelle).join(', ')}</div>
                    {ar.commentaireArret && <div className="text-[0.78rem] text-[var(--text-tertiary)]">{ar.commentaireArret}</div>}
                  </div>
                  <span className="font-mono font-bold text-[var(--accent-red)]">{ar.dureeMs ? formatDuration(ar.dureeMs) : 'En cours...'}</span>
                </div>
              ))}
            </>
          ) : <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun arrêt</div>}
        </div>
      </div>

      {/* Contrôles + Passations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">🔍 Contrôles <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{nbGood}✓ {nbBad}✗</span></div>
          {dossier.controles.map((ct) => (
            <div key={ct.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-[var(--border-primary)] rounded-md mb-1.5 text-[0.85rem]">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.9rem] ${ct.resultat === 'bon' ? 'bg-[var(--accent-green-dim)]' : 'bg-[var(--accent-red-dim)]'}`}>{ct.resultat === 'bon' ? '✓' : '✗'}</div>
              <div className="flex-1">
                <div className="font-semibold">{ct.resultat === 'bon' ? 'Conforme' : 'Non conforme'}</div>
                {ct.commentaire && <div className="text-[0.78rem] text-[var(--text-tertiary)]">{ct.commentaire}</div>}
              </div>
              <span className="text-[0.75rem] text-[var(--text-tertiary)] font-mono">{new Date(ct.dateControle).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {dossier.controles.length === 0 && <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun contrôle</div>}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
          <div className="font-mono font-bold text-base mb-3.5">🔄 Passations</div>
          {dossier.passations.map((ps) => (
            <div key={ps.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-[var(--border-primary)] rounded-md mb-1.5 text-[0.85rem]">
              <span>🔄</span>
              <div className="flex-1">
                <div className="font-semibold">{ps.deOperateur?.nom || '—'} → {ps.versOperateur?.nom || '—'}</div>
                {ps.note && <div className="text-[0.78rem] text-[var(--text-tertiary)]">{ps.note}</div>}
                <div className="text-[0.72rem] text-[var(--text-muted)]">Session {ps.sessionSortante} → {ps.sessionEntrante} | {formatNumber(ps.bonnes)} bonnes</div>
              </div>
              <span className="text-[0.75rem] text-[var(--text-tertiary)] font-mono">{new Date(ps.heurePassation).toLocaleString('fr-FR')}</span>
            </div>
          ))}
          {dossier.passations.length === 0 && <div className="text-center py-5 text-[var(--text-tertiary)]">Aucune passation</div>}
        </div>
      </div>
    </div>
  );
}
