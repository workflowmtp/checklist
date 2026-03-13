'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  taskStart, taskPause, taskResume, taskValidate, taskNC,
  declareProduction, createArret, resumeArret, createControle,
  createPassation, cloturerDossier, startDossier,
  getCausesArret, getCheckpointsForPole, getOperateursForPole,
} from '@/lib/actions';
import { formatNumber, formatDuration } from '@/lib/utils';

export function DossierClient({ dossier }: { dossier: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [formState, setFormState] = useState<any>({});

  const isEnCours = dossier.statut === 'EN_COURS';
  const isAttente = dossier.statut === 'EN_ATTENTE';
  const activeStop = dossier.arrets?.find((a: any) => a.statut === 'ACTIF');

  // Task actions
  const handleTask = (taskId: string, action: string) => {
    if (action === 'nc') {
      setFormState({ taskId, comment: '' });
      setModal('nc');
      return;
    }
    startTransition(async () => {
      if (action === 'start') await taskStart(dossier.id, taskId);
      else if (action === 'pause') await taskPause(dossier.id, taskId);
      else if (action === 'resume') await taskResume(dossier.id, taskId);
      else if (action === 'validate') await taskValidate(dossier.id, taskId);
      toast.success('Action effectuée');
      router.refresh();
    });
  };

  const submitNC = () => {
    if (!formState.comment?.trim()) { toast.error('Commentaire obligatoire'); return; }
    startTransition(async () => {
      await taskNC(dossier.id, formState.taskId, formState.comment);
      toast.warning('Tâche marquée NC');
      setModal(null);
      router.refresh();
    });
  };

  // Production
  const openDecl = () => { setFormState({ bonnes: 0, calage: 0, gache: 0, motif: '', etat: 'conforme' }); setModal('decl'); };
  const submitDecl = () => {
    const { bonnes, calage, gache, motif, etat } = formState;
    if (bonnes <= 0 && calage <= 0 && gache <= 0) { toast.error('Saisissez au moins une quantité'); return; }
    if (gache > 0 && !motif?.trim()) { toast.error('Motif obligatoire si gâche > 0'); return; }
    startTransition(async () => {
      await declareProduction(dossier.id, { bonnes: +bonnes, calage: +calage, gache: +gache, motifGache: motif, etatTirage: etat });
      toast.success('Production déclarée');
      setModal(null);
      router.refresh();
    });
  };

  // Arrêts
  const openStop = async () => {
    const causes = await getCausesArret();
    setModalData({ causes });
    setFormState({ causeIds: [], comment: '' });
    setModal('stop');
  };
  const submitStop = () => {
    if (formState.causeIds.length === 0) { toast.error('Sélectionnez au moins une cause'); return; }
    startTransition(async () => {
      await createArret(dossier.id, formState.causeIds, formState.comment);
      toast.warning('Arrêt enregistré');
      setModal(null);
      router.refresh();
    });
  };

  const openResume = (arretId: string) => { setFormState({ arretId, comment: '' }); setModal('resume'); };
  const submitResume = () => {
    startTransition(async () => {
      await resumeArret(dossier.id, formState.arretId, formState.comment);
      toast.success('Production reprise');
      setModal(null);
      router.refresh();
    });
  };

  // Contrôles
  const openControl = async () => {
    const checkpoints = await getCheckpointsForPole(dossier.poleId);
    setModalData({ checkpoints });
    setFormState({ cpValues: {}, comment: '' });
    setModal('control');
  };
  const submitControl = () => {
    const details = Object.entries(formState.cpValues).filter(([_, v]) => v !== '').map(([cpId, v]) => ({ checkpoint_id: cpId, conforme: v === 'conforme' }));
    const hasNC = details.some((d) => !d.conforme);
    if (hasNC && !formState.comment?.trim()) { toast.error('Commentaire obligatoire si NC'); return; }
    if (details.length === 0 && !formState.comment?.trim()) { toast.error('Renseignez au moins un point'); return; }
    startTransition(async () => {
      await createControle(dossier.id, details, formState.comment);
      toast.success('Contrôle enregistré');
      setModal(null);
      router.refresh();
    });
  };

  // Passation
  const openPassation = async () => {
    const ops = await getOperateursForPole(dossier.poleId);
    setModalData({ ops });
    setFormState({ versOpId: '', note: '' });
    setModal('passation');
  };
  const submitPassation = () => {
    if (!formState.versOpId) { toast.error('Sélectionnez un opérateur entrant'); return; }
    startTransition(async () => {
      await createPassation(dossier.id, { versOperateurId: formState.versOpId, note: formState.note });
      toast.success('Passation effectuée');
      setModal(null);
      router.refresh();
    });
  };

  // Clôture
  const openCloture = () => {
    if (activeStop) { toast.error('Impossible de clôturer : un arrêt est en cours'); return; }
    setFormState({ comment: '' });
    setModal('cloture');
  };
  const submitCloture = () => {
    if (!formState.comment?.trim()) { toast.error('Commentaire obligatoire'); return; }
    startTransition(async () => {
      await cloturerDossier(dossier.id, formState.comment);
      toast.success('Dossier clôturé');
      setModal(null);
      router.refresh();
    });
  };

  const handleStart = () => {
    startTransition(async () => { await startDossier(dossier.id); toast.success('Dossier démarré'); router.refresh(); });
  };

  const closeModal = () => setModal(null);

  // ===== RENDER BUTTONS =====
  return (
    <>
      {/* Action buttons in header */}
      {isAttente && <button onClick={handleStart} disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-green">▶️ Démarrer</button>}
      {isEnCours && (
        <>
          <button onClick={openDecl} className="px-3 py-1.5 rounded-md font-semibold text-white text-[0.8rem] btn-gradient-blue">📦 Déclarer</button>
          {!activeStop && <button onClick={openStop} className="px-3 py-1.5 rounded-md font-semibold text-[0.8rem] bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)]">⏹ Arrêt</button>}
          {activeStop && <button onClick={() => openResume(activeStop.id)} className="px-3 py-1.5 rounded-md font-semibold text-white text-[0.8rem] btn-gradient-green">▶ Reprendre</button>}
          <button onClick={openControl} className="px-3 py-1.5 rounded-md font-semibold text-[0.8rem] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]">🔍 Contrôle</button>
          <button onClick={openPassation} className="px-3 py-1.5 rounded-md font-semibold text-[0.8rem] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]">🔄 Passation</button>
          <button onClick={openCloture} className="px-3 py-1.5 rounded-md font-semibold text-white text-[0.8rem]" style={{ background: 'var(--accent-purple)' }}>🏁 Clôturer</button>
        </>
      )}

      {/* Task action buttons — rendered via global event */}
      {(isEnCours || isAttente) && (
        <script dangerouslySetInnerHTML={{ __html: `
          window.__taskAction = function(taskId, action) {
            document.dispatchEvent(new CustomEvent('taskAction', { detail: { taskId, action } }));
          };
        `}} />
      )}

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-[var(--bg-modal)] border border-[var(--border-primary)] rounded-xl w-full max-w-[500px] max-h-[85vh] overflow-y-auto p-7 shadow-lg" onClick={(e) => e.stopPropagation()}>

            {/* NC Modal */}
            {modal === 'nc' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5 text-[var(--accent-red)]">⚠️ Non-conformité</h2>
              <textarea value={formState.comment || ''} onChange={(e) => setFormState({ ...formState, comment: e.target.value })} rows={3} placeholder="Décrivez la non-conformité..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitNC} disabled={isPending} className="px-5 py-2.5 rounded-md bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)] font-semibold">Confirmer NC</button>
              </div>
            </>)}

            {/* Declaration Modal */}
            {modal === 'decl' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5">📦 Déclaration de production</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[{ k: 'bonnes', l: 'Bonnes' }, { k: 'calage', l: 'Calage' }, { k: 'gache', l: 'Gâche' }].map(({ k, l }) => (
                  <div key={k}><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">{l}</label>
                    <input type="number" value={formState[k] || 0} onChange={(e) => setFormState({ ...formState, [k]: +e.target.value })} min={0}
                      className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]" /></div>
                ))}
                <div><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Total</label>
                  <div className="px-3.5 py-3 bg-[var(--bg-tertiary)] rounded-md font-mono font-bold">{formatNumber((formState.bonnes||0) + (formState.calage||0) + (formState.gache||0))}</div></div>
              </div>
              <div className="mb-3"><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Motif gâche</label>
                <input type="text" value={formState.motif || ''} onChange={(e) => setFormState({ ...formState, motif: e.target.value })}
                  className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]" /></div>
              <div className="mb-4"><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">État tirage</label>
                <select value={formState.etat} onChange={(e) => setFormState({ ...formState, etat: e.target.value })}
                  className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]">
                  <option value="conforme">✓ Conforme</option><option value="avec_reserve">⚠ Avec réserve</option><option value="interrompu">✗ Interrompu</option>
                </select></div>
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitDecl} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue">Enregistrer</button>
              </div>
            </>)}

            {/* Stop Modal */}
            {modal === 'stop' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5 text-[var(--accent-red)]">🚨 Déclarer un arrêt</h2>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto p-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md mb-3">
                {modalData?.causes?.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2 text-[0.82rem] p-1 cursor-pointer hover:bg-[var(--bg-tertiary)] rounded">
                    <input type="checkbox" checked={formState.causeIds?.includes(c.id)} onChange={(e) => {
                      const ids = [...(formState.causeIds || [])];
                      if (e.target.checked) ids.push(c.id); else ids.splice(ids.indexOf(c.id), 1);
                      setFormState({ ...formState, causeIds: ids });
                    }} /> {c.libelle}
                  </label>
                ))}
              </div>
              <textarea value={formState.comment || ''} onChange={(e) => setFormState({ ...formState, comment: e.target.value })} rows={2} placeholder="Détails..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitStop} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)]">⏹ Confirmer</button>
              </div>
            </>)}

            {/* Resume Modal */}
            {modal === 'resume' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5 text-[var(--accent-green)]">▶ Reprendre la production</h2>
              <textarea value={formState.comment || ''} onChange={(e) => setFormState({ ...formState, comment: e.target.value })} rows={2} placeholder="Action corrective..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitResume} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-green">✓ Reprendre</button>
              </div>
            </>)}

            {/* Control Modal */}
            {modal === 'control' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5">🔍 Contrôle de production</h2>
              <div className="max-h-[250px] overflow-y-auto border border-[var(--border-primary)] rounded-md p-2 mb-3">
                {modalData?.checkpoints?.map((cp: any) => (
                  <div key={cp.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--border-primary)] last:border-0 text-[0.85rem]">
                    <span className="flex-1">{cp.libelle}{cp.obligatoire && <span className="text-[var(--accent-red)]"> *</span>}</span>
                    <select value={formState.cpValues?.[cp.id] || ''} onChange={(e) => setFormState({ ...formState, cpValues: { ...formState.cpValues, [cp.id]: e.target.value } })}
                      className="px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded text-[0.8rem]">
                      <option value="">—</option><option value="conforme">✓ Conforme</option><option value="non_conforme">✗ NC</option>
                    </select>
                  </div>
                ))}
              </div>
              <textarea value={formState.comment || ''} onChange={(e) => setFormState({ ...formState, comment: e.target.value })} rows={2} placeholder="Observations..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitControl} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue">Enregistrer</button>
              </div>
            </>)}

            {/* Passation Modal */}
            {modal === 'passation' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5">🔄 Passation d&apos;équipe</h2>
              <div className="mb-3"><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Opérateur entrant *</label>
                <select value={formState.versOpId} onChange={(e) => setFormState({ ...formState, versOpId: e.target.value })}
                  className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]">
                  <option value="">— Sélectionner —</option>
                  {modalData?.ops?.map((op: any) => <option key={op.id} value={op.id}>{op.nom} ({op.matricule || '—'})</option>)}
                </select></div>
              <textarea value={formState.note || ''} onChange={(e) => setFormState({ ...formState, note: e.target.value })} rows={3} placeholder="Note de passation..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitPassation} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white btn-gradient-blue">✓ Valider</button>
              </div>
            </>)}

            {/* Cloture Modal */}
            {modal === 'cloture' && (<>
              <h2 className="font-mono font-bold text-[1.15rem] mb-5" style={{ color: 'var(--accent-purple)' }}>🏁 Clôturer le dossier</h2>
              <div className="bg-[var(--accent-orange-dim)] border border-[rgba(245,158,11,0.2)] text-[var(--accent-orange)] rounded-md px-4 py-3 text-[0.85rem] mb-4">
                ⚠️ La clôture est irréversible.
              </div>
              <textarea value={formState.comment || ''} onChange={(e) => setFormState({ ...formState, comment: e.target.value })} rows={3} placeholder="Bilan du dossier..."
                className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] mb-4" />
              <div className="flex justify-end gap-2.5">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
                <button onClick={submitCloture} disabled={isPending} className="px-5 py-2.5 rounded-md font-semibold text-white" style={{ background: 'var(--accent-purple)' }}>🏁 Confirmer</button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </>
  );
}
