'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createDossier, getNewDossierData } from '@/lib/actions';
import { generateDossierNumero } from '@/lib/utils';

const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="mb-4"><label className="block text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">{label}{required && ' *'}</label>{children}</div>
);
const I = (props: any) => <input {...props} className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] focus-ring" />;
const S = (props: any) => <select {...props} className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] focus-ring">{props.children}</select>;

export default function NouveauDossierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({
    dossierNumero: '', dateDossier: new Date().toISOString().slice(0, 10),
    ofNumero: '', referenceCommande: '', client: '',
    poleId: searchParams.get('pole_id') || '', atelierId: searchParams.get('atelier_id') || '',
    machineId: '', designation: '', quantiteCommandee: 0, unite: 'feuilles',
    operateurIds: [] as string[], observations: '',
  });

  useEffect(() => {
    getNewDossierData(form.poleId, form.atelierId).then((d) => {
      setData(d);
      setForm((f) => ({ ...f, dossierNumero: generateDossierNumero(d.existingNums) }));
    });
  }, []);

  if (!data) return <div className="text-center py-12 text-[var(--text-tertiary)]">Chargement...</div>;

  const poles = data.poles;
  const ateliers = data.allAteliers.filter((a: any) => !form.poleId || a.poleId === form.poleId);
  const machines = form.atelierId
    ? data.allMachineAteliers.filter((ma: any) => ma.atelierId === form.atelierId).map((ma: any) => ma.machine)
    : form.poleId ? data.allMachineAteliers.filter((ma: any) => { const at = data.allAteliers.find((a: any) => a.id === ma.atelierId); return at?.poleId === form.poleId; }).map((ma: any) => ma.machine) : [];
  const operateurs = form.atelierId
    ? data.allOpAteliers.filter((oa: any) => oa.atelierId === form.atelierId && oa.operateur).map((oa: any) => oa.operateur)
    : form.poleId ? data.allOpAteliers.filter((oa: any) => { const at = data.allAteliers.find((a: any) => a.id === oa.atelierId); return at?.poleId === form.poleId && oa.operateur; }).map((oa: any) => oa.operateur) : [];

  const handleSave = (startImmediately: boolean) => {
    if (!form.poleId || !form.atelierId || !form.machineId || !form.designation || form.quantiteCommandee <= 0) {
      toast.error('Remplissez tous les champs obligatoires'); return;
    }
    if (form.operateurIds.length === 0) { toast.error('Sélectionnez au moins un opérateur'); return; }
    startTransition(async () => {
      const d = await createDossier({ ...form, startImmediately });
      toast.success(`Dossier ${form.dossierNumero} créé${startImmediately ? ' et démarré' : ''}`);
      router.push(`/dossier/${d.id}`);
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-lg">←</button>
        <h1 className="font-mono text-[1.5rem] font-bold">📋 Nouveau dossier de fabrication</h1>
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 max-w-[800px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Date" required><I type="date" value={form.dateDossier} onChange={(e: any) => setForm({ ...form, dateDossier: e.target.value })} /></F>
          <F label="N° Dossier" required><I value={form.dossierNumero} onChange={(e: any) => setForm({ ...form, dossierNumero: e.target.value })} /></F>
          <F label="N° OF"><I value={form.ofNumero} onChange={(e: any) => setForm({ ...form, ofNumero: e.target.value })} placeholder="OF-26-XXXX" /></F>
          <F label="Réf. Commande"><I value={form.referenceCommande} onChange={(e: any) => setForm({ ...form, referenceCommande: e.target.value })} /></F>
          <F label="Client"><I value={form.client} onChange={(e: any) => setForm({ ...form, client: e.target.value })} /></F>
          <F label="Pôle" required>
            <S value={form.poleId} onChange={(e: any) => setForm({ ...form, poleId: e.target.value, atelierId: '', machineId: '', operateurIds: [] })}>
              <option value="">— Sélectionner —</option>
              {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
            </S>
          </F>
          <F label="Atelier" required>
            <S value={form.atelierId} onChange={(e: any) => setForm({ ...form, atelierId: e.target.value, machineId: '', operateurIds: [] })}>
              <option value="">— Sélectionner —</option>
              {ateliers.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </S>
          </F>
          <F label="Machine" required>
            <S value={form.machineId} onChange={(e: any) => setForm({ ...form, machineId: e.target.value })}>
              <option value="">— Sélectionner —</option>
              {machines.map((m: any) => <option key={m.id} value={m.id}>{m.codeMachine} — {m.nom}</option>)}
            </S>
          </F>
        </div>
        <F label="Désignation" required><I value={form.designation} onChange={(e: any) => setForm({ ...form, designation: e.target.value })} placeholder="Ex: Étiquettes Beaufort..." /></F>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Quantité commandée" required><I type="number" value={form.quantiteCommandee} onChange={(e: any) => setForm({ ...form, quantiteCommandee: +e.target.value })} min={0} /></F>
          <F label="Unité">
            <S value={form.unite} onChange={(e: any) => setForm({ ...form, unite: e.target.value })}>
              {['feuilles','mètres','pièces','kg','bobines'].map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
            </S>
          </F>
        </div>
        <F label="Opérateur(s)" required>
          <div className="max-h-[150px] overflow-y-auto p-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md">
            {operateurs.length === 0 ? <span className="text-[var(--text-tertiary)] text-[0.85rem]">Sélectionnez d&apos;abord un pôle/atelier</span> :
              operateurs.map((op: any) => (
                <label key={op.id} className="flex items-center gap-2 py-1 text-[0.85rem] cursor-pointer">
                  <input type="checkbox" checked={form.operateurIds.includes(op.id)} onChange={(e) => {
                    const ids = [...form.operateurIds];
                    if (e.target.checked) ids.push(op.id); else ids.splice(ids.indexOf(op.id), 1);
                    setForm({ ...form, operateurIds: ids });
                  }} />
                  {op.nom} <span className="text-[var(--text-tertiary)] text-[0.75rem]">{op.matricule}</span>
                </label>
              ))}
          </div>
        </F>
        <F label="Observations"><textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={2}
          className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]" /></F>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => router.back()} className="px-5 py-2.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">Annuler</button>
          <button onClick={() => handleSave(false)} disabled={isPending} className="px-6 py-3 rounded-md font-semibold text-white btn-gradient-blue">💾 Enregistrer</button>
          <button onClick={() => handleSave(true)} disabled={isPending} className="px-6 py-3 rounded-md font-semibold text-white btn-gradient-green">▶️ Enregistrer & Démarrer</button>
        </div>
      </div>
    </div>
  );
}
