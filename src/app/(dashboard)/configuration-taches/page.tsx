'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getTaskConfigData, saveFamille, deleteFamille, saveTacheModele, deleteTacheModele } from '@/lib/actions';

const I = (props: any) => <input {...props} className={`px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.85rem] focus-ring ${props.className || ''}`} />;

export default function ConfigTachesPage() {
  const [machineId, setMachineId] = useState('');
  const [data, setData] = useState<any>({ machines: [], familles: [], taches: [] });
  const [isPending, startTransition] = useTransition();
  const [showFamForm, setShowFamForm] = useState(false);
  const [showTacheForm, setShowTacheForm] = useState(false);
  const [famForm, setFamForm] = useState({ nom: '', ordre: 1 });
  const [tacheForm, setTacheForm] = useState({ code: '', libelle: '', familleId: '', position: 1, tempsPrevuMin: 0, bloquante: false });

  const reload = () => getTaskConfigData(machineId || undefined).then(setData);
  useEffect(() => { reload(); }, [machineId]);

  const handleDeleteFam = (id: string) => {
    if (!confirm('Supprimer cette famille ?')) return;
    startTransition(async () => { await deleteFamille(id); toast.success('Famille supprimée'); reload(); });
  };
  const handleDeleteTache = (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    startTransition(async () => { await deleteTacheModele(id); toast.success('Tâche supprimée'); reload(); });
  };

  const handleSaveFam = () => {
    if (!famForm.nom) { toast.error('Nom obligatoire'); return; }
    startTransition(async () => {
      await saveFamille(machineId, null, famForm);
      toast.success('Famille créée');
      setFamForm({ nom: '', ordre: (data.familles.length || 0) + 1 });
      setShowFamForm(false);
      reload();
    });
  };

  const handleSaveTache = () => {
    if (!tacheForm.code || !tacheForm.libelle) { toast.error('Code et libellé obligatoires'); return; }
    startTransition(async () => {
      await saveTacheModele(machineId, null, { ...tacheForm, familleId: tacheForm.familleId || null });
      toast.success('Tâche modèle créée');
      setTacheForm({ code: '', libelle: '', familleId: '', position: (data.taches.length || 0) + 1, tempsPrevuMin: 0, bloquante: false });
      setShowTacheForm(false);
      reload();
    });
  };

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">🔧 Configuration des tâches</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Définir les familles et tâches modèles par machine</p>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
        <div className="max-w-[400px]">
          <label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Machine</label>
          <select value={machineId} onChange={(e) => setMachineId(e.target.value)}
            className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]">
            <option value="">— Sélectionner une machine —</option>
            {data.machines.map((m: any) => <option key={m.id} value={m.id}>{m.pole?.icone} {m.codeMachine} — {m.nom}</option>)}
          </select>
        </div>
      </div>

      {machineId && (
        <>
          {/* Familles */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="font-mono font-bold text-base">📂 Familles de tâches <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{data.familles.length}</span></div>
              <button onClick={() => { setShowFamForm(!showFamForm); setFamForm({ nom: '', ordre: (data.familles.length || 0) + 1 }); }}
                className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue">+ Nouvelle famille</button>
            </div>
            {showFamForm && (
              <div className="flex items-end gap-3 mb-4 p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-primary)]">
                <div className="flex-1">
                  <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Nom</label>
                  <I value={famForm.nom} onChange={(e: any) => setFamForm({ ...famForm, nom: e.target.value })} placeholder="Ex: Préparation" className="w-full" />
                </div>
                <div className="w-[80px]">
                  <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Ordre</label>
                  <I type="number" value={famForm.ordre} onChange={(e: any) => setFamForm({ ...famForm, ordre: +e.target.value })} min={1} className="w-full" />
                </div>
                <button onClick={handleSaveFam} disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-green">✓ Enregistrer</button>
                <button onClick={() => setShowFamForm(false)} className="px-3 py-2 rounded-md text-[0.85rem] bg-[var(--bg-input)] border border-[var(--border-primary)]">Annuler</button>
              </div>
            )}
            {data.familles.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucune famille</div> :
              data.familles.map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-md mb-1">
                  <span className="font-mono text-[0.8rem] text-[var(--text-tertiary)]">#{f.ordre}</span>
                  <span className="flex-1 font-semibold">{f.nom}</span>
                  <button onClick={() => handleDeleteFam(f.id)} className="text-[0.85rem] hover:opacity-70">🗑️</button>
                </div>
              ))
            }
          </div>

          {/* Tâches modèles */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="font-mono font-bold text-base">📋 Tâches modèles <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{data.taches.length}</span></div>
              <button onClick={() => { setShowTacheForm(!showTacheForm); setTacheForm({ code: '', libelle: '', familleId: '', position: (data.taches.length || 0) + 1, tempsPrevuMin: 0, bloquante: false }); }}
                className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue">+ Nouvelle tâche modèle</button>
            </div>
            {showTacheForm && (
              <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-primary)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Code *</label>
                    <I value={tacheForm.code} onChange={(e: any) => setTacheForm({ ...tacheForm, code: e.target.value })} placeholder="Ex: T01" className="w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Libellé *</label>
                    <I value={tacheForm.libelle} onChange={(e: any) => setTacheForm({ ...tacheForm, libelle: e.target.value })} placeholder="Ex: Vérification blanchet" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Famille</label>
                    <select value={tacheForm.familleId} onChange={(e) => setTacheForm({ ...tacheForm, familleId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.85rem]">
                      <option value="">— Aucune —</option>
                      {data.familles.map((f: any) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Position</label>
                    <I type="number" value={tacheForm.position} onChange={(e: any) => setTacheForm({ ...tacheForm, position: +e.target.value })} min={1} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-[0.75rem] font-semibold text-[var(--text-secondary)] mb-1 uppercase">Temps prévu (min)</label>
                    <I type="number" value={tacheForm.tempsPrevuMin} onChange={(e: any) => setTacheForm({ ...tacheForm, tempsPrevuMin: +e.target.value })} min={0} className="w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[0.85rem] cursor-pointer">
                    <input type="checkbox" checked={tacheForm.bloquante} onChange={(e) => setTacheForm({ ...tacheForm, bloquante: e.target.checked })} />
                    Tâche bloquante
                  </label>
                  <div className="flex-1" />
                  <button onClick={handleSaveTache} disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-green">✓ Enregistrer</button>
                  <button onClick={() => setShowTacheForm(false)} className="px-3 py-2 rounded-md text-[0.85rem] bg-[var(--bg-input)] border border-[var(--border-primary)]">Annuler</button>
                </div>
              </div>
            )}
            {data.taches.length === 0 ? <div className="text-center py-5 text-[var(--text-tertiary)]">Aucune tâche modèle</div> :
              data.taches.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-primary)] rounded-md mb-1 text-[0.85rem]">
                  <span className="font-mono font-bold text-[0.8rem] text-[var(--text-tertiary)] w-7 text-center">{t.position}</span>
                  <span className="font-mono text-[0.78rem] text-[var(--accent-blue)] min-w-[70px]">{t.code}</span>
                  <span className="flex-1 font-medium">{t.libelle}{t.bloquante && <span className="ml-2 px-1.5 py-0.5 bg-[var(--accent-orange-dim)] text-[var(--accent-orange)] rounded text-[0.65rem] font-semibold">BLOQ</span>}</span>
                  <span className="text-[0.75rem] text-[var(--text-tertiary)] min-w-[80px]">{t.famille?.nom || '—'}</span>
                  <span className="text-[0.8rem] text-[var(--text-secondary)] min-w-[60px] text-right">{t.tempsPrevuMin || 0} min</span>
                  <button onClick={() => handleDeleteTache(t.id)} className="text-[0.85rem] hover:opacity-70">🗑️</button>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}
