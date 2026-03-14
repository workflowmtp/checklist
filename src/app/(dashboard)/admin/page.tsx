'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getAdminData, savePole, deletePole, saveAtelier, deleteAtelier, saveMachine, deleteMachine, saveOperateur, deleteOperateur, saveCause, saveCheckpoint, saveUser, savePermission, toggleRolePermission, deleteEntity } from '@/lib/actions';
import { getRoleLabel, getAllRoles } from '@/lib/permissions';
import { Role } from '@prisma/client';

const TABS = [
  { id: 'poles', icon: '🏭', label: 'Pôles' },
  { id: 'ateliers', icon: '🏗️', label: 'Ateliers' },
  { id: 'machines', icon: '🖨️', label: 'Machines' },
  { id: 'operateurs', icon: '👷', label: 'Opérateurs' },
  { id: 'causes', icon: '⚠️', label: "Causes d'arrêt" },
  { id: 'checkpoints', icon: '🔍', label: 'Points de contrôle' },
  { id: 'users', icon: '👤', label: 'Utilisateurs' },
  { id: 'permissions', icon: '🔐', label: 'Permissions' },
  { id: 'role-permissions', icon: '🛡️', label: 'Rôles & Permissions' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('poles');
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [rolePermsMap, setRolePermsMap] = useState<Record<string, Set<string>>>({});
  const [poles, setPoles] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [tab]);
  const loadData = async () => {
    const d = await getAdminData(tab);
    setData(d as any[]);
    if (['ateliers', 'machines', 'operateurs', 'checkpoints', 'users'].includes(tab)) {
      const p = await getAdminData('poles') as any[];
      setPoles(p);
    }
    if (tab === 'role-permissions') {
      const perms = await getAdminData('permissions') as any[];
      setAllPermissions(perms);
      const rpList = d as any[];
      const map: Record<string, Set<string>> = {};
      rpList.forEach((rp: any) => {
        if (!map[rp.role]) map[rp.role] = new Set();
        map[rp.role].add(rp.permissionId);
      });
      setRolePermsMap(map);
    }
  };

  const filtered = data.filter((item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(s);
  });

  const handleDelete = (collection: string, id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    startTransition(async () => {
      try {
        await deleteEntity(collection, id);
        toast.success('Supprimé');
        loadData();
      } catch (e: any) { toast.error(e.message); }
    });
  };

  const handleSave = (fn: any, args: any[]) => {
    startTransition(async () => {
      try {
        await fn(...args);
        toast.success('Enregistré');
        setModal(null);
        loadData();
      } catch (e: any) { toast.error(e.message); }
    });
  };

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">⚙️ Administration</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Gestion des référentiels et paramétrage</p>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-[220px] flex-shrink-0 hidden md:block">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-md text-[0.85rem] mb-0.5 transition-all ${tab === t.id ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto md:hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-md text-[0.8rem] whitespace-nowrap ${tab === t.id ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-tertiary)]'}`}>{t.icon} {t.label}</button>
            ))}
          </div>

          {tab !== 'role-permissions' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
            <div className="font-mono font-bold text-base mb-3.5">{TABS.find((t) => t.id === tab)?.icon} {TABS.find((t) => t.id === tab)?.label} <span className="text-[0.7rem] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{filtered.length}</span></div>

            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.85rem] min-w-[220px] focus-ring" />
              <button onClick={() => setModal({ id: null })} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue">+ Nouveau</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse"><thead><tr>
                {tab === 'poles' && ['Icône','Nom','Description','Couleur','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'ateliers' && ['Nom','Pôle','Description','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'machines' && ['Code','Nom','Pôle','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'operateurs' && ['Nom','Matricule','Pôle','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'causes' && ['Code','Libellé','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'checkpoints' && ['Code','Libellé','Catégorie','Obligatoire','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'users' && ['Email','Nom','Rôle','Pôle','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'permissions' && ['Code','Libellé','Groupe','Description','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
              </tr></thead><tbody>
                {filtered.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]">
                    {tab === 'poles' && <>
                      <td className="px-3 py-2 text-[1.2rem] border-b border-[var(--border-primary)]">{item.icone}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[var(--text-secondary)]">{item.description || '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className="inline-block w-6 h-6 rounded" style={{ background: item.couleur }} /></td>
                    </>}
                    {tab === 'ateliers' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.pole?.icone} {item.pole?.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[var(--text-secondary)]">{item.description || '—'}</td>
                    </>}
                    {tab === 'machines' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-semibold">{item.codeMachine}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.pole?.icone} {item.pole?.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${item.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    </>}
                    {tab === 'operateurs' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{item.matricule || '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.pole?.icone} {item.pole?.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${item.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    </>}
                    {tab === 'causes' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-semibold">{item.code}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.libelle}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${item.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    </>}
                    {tab === 'checkpoints' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-semibold">{item.code}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.libelle}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.categorie || '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.obligatoire ? <span className="text-[var(--accent-orange)] font-semibold">Oui</span> : 'Non'}</td>
                    </>}
                    {tab === 'users' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{item.email}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[0.75rem]">{getRoleLabel(item.role)}</span></td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.pole ? `${item.pole.icone} ${item.pole.nom}` : 'Global'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${item.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    </>}
                    {tab === 'permissions' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono font-semibold">{item.code}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.libelle}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[0.75rem]">{item.groupe}</span></td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[var(--text-secondary)] text-[0.85rem]">{item.description || '—'}</td>
                    </>}
                    <td className="px-3 py-2 border-b border-[var(--border-primary)]">
                      <div className="flex gap-1">
                        <button onClick={() => setModal(item)} className="w-7 h-7 rounded flex items-center justify-center text-[0.85rem] hover:bg-[var(--bg-tertiary)]" title="Modifier">✏️</button>
                        <button onClick={() => handleDelete(tab, item.id, item.nom || item.libelle || item.code)} className="w-7 h-7 rounded flex items-center justify-center text-[0.85rem] hover:bg-[var(--bg-tertiary)]" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            {filtered.length === 0 && <div className="text-center py-5 text-[var(--text-tertiary)]">Aucun élément</div>}
          </div>
          )}

          {tab === 'role-permissions' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
              <div className="font-mono font-bold text-base mb-4">🛡️ Matrice Rôles × Permissions</div>
              <p className="text-[var(--text-secondary)] text-[0.85rem] mb-4">Cochez ou décochez pour attribuer ou retirer une permission à un rôle.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.8rem]">
                  <thead>
                    <tr>
                      <th className="text-left px-2 py-2 border-b border-[var(--border-primary)] text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] sticky left-0 bg-[var(--bg-card)] min-w-[180px]">Permission</th>
                      {getAllRoles().map((r) => (
                        <th key={r} className="px-2 py-2 border-b border-[var(--border-primary)] text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] text-center min-w-[110px]">{getRoleLabel(r)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped: Record<string, any[]> = {};
                      allPermissions.forEach((p: any) => {
                        if (!grouped[p.groupe]) grouped[p.groupe] = [];
                        grouped[p.groupe].push(p);
                      });
                      const rows: React.ReactNode[] = [];
                      Object.entries(grouped).forEach(([groupe, perms]) => {
                        rows.push(
                          <tr key={`g-${groupe}`}>
                            <td colSpan={getAllRoles().length + 1} className="px-2 pt-4 pb-1 font-mono font-bold text-[0.75rem] uppercase text-[var(--accent-blue)] border-b border-[var(--border-primary)]">{groupe}</td>
                          </tr>
                        );
                        perms.forEach((p: any) => {
                          rows.push(
                            <tr key={p.id} className="hover:bg-[var(--bg-tertiary)]">
                              <td className="px-2 py-1.5 border-b border-[var(--border-primary)] sticky left-0 bg-[var(--bg-card)]">
                                <span className="font-semibold">{p.libelle}</span>
                                <span className="ml-1.5 text-[0.7rem] text-[var(--text-tertiary)] font-mono">{p.code}</span>
                              </td>
                              {getAllRoles().map((r) => {
                                const checked = rolePermsMap[r]?.has(p.id) || false;
                                return (
                                  <td key={r} className="px-2 py-1.5 border-b border-[var(--border-primary)] text-center">
                                    <input type="checkbox" checked={checked} onChange={() => {
                                      startTransition(async () => {
                                        await toggleRolePermission(r, p.id);
                                        loadData();
                                      });
                                    }} className="w-4 h-4 cursor-pointer accent-[var(--accent-blue)]" />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL ============ */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-mono font-bold text-lg">{modal.id ? 'Modifier' : 'Nouveau'} — {TABS.find((t) => t.id === tab)?.label}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-lg">✕</button>
            </div>

            {/* POLES */}
            {tab === 'poles' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(savePole, [modal.id || null, { nom: f.get('nom') as string, icone: f.get('icone') as string, couleur: f.get('couleur') as string, description: f.get('description') as string || undefined }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                    <input name="nom" defaultValue={modal.nom || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Icône *</label>
                    <input name="icone" defaultValue={modal.icone || '🏭'} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Couleur *</label>
                    <input name="couleur" type="color" defaultValue={modal.couleur || '#3b82f6'} required className="w-16 h-10 border border-[var(--border-primary)] rounded-md cursor-pointer" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea name="description" defaultValue={modal.description || ''} rows={2} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* ATELIERS */}
            {tab === 'ateliers' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveAtelier, [modal.id || null, { nom: f.get('nom') as string, poleId: f.get('poleId') as string, description: f.get('description') as string || undefined }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                    <input name="nom" defaultValue={modal.nom || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Pôle *</label>
                    <select name="poleId" defaultValue={modal.poleId || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      <option value="">Sélectionner...</option>
                      {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
                    </select></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea name="description" defaultValue={modal.description || ''} rows={2} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* MACHINES */}
            {tab === 'machines' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveMachine, [modal.id || null, { codeMachine: f.get('codeMachine') as string, nom: f.get('nom') as string, poleId: f.get('poleId') as string, description: f.get('description') as string || undefined, actif: f.get('actif') === 'on' }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Code machine *</label>
                    <input name="codeMachine" defaultValue={modal.codeMachine || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring font-mono" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                    <input name="nom" defaultValue={modal.nom || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Pôle *</label>
                    <select name="poleId" defaultValue={modal.poleId || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      <option value="">Sélectionner...</option>
                      {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
                    </select></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea name="description" defaultValue={modal.description || ''} rows={2} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div className="flex items-center gap-2">
                    <input name="actif" type="checkbox" defaultChecked={modal.actif !== false} className="w-4 h-4 accent-[var(--accent-blue)]" />
                    <label className="text-[0.85rem]">Actif</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* OPERATEURS */}
            {tab === 'operateurs' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveOperateur, [modal.id || null, { nom: f.get('nom') as string, matricule: f.get('matricule') as string || undefined, poleId: f.get('poleId') as string, actif: f.get('actif') === 'on' }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                    <input name="nom" defaultValue={modal.nom || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Matricule</label>
                    <input name="matricule" defaultValue={modal.matricule || ''} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring font-mono" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Pôle *</label>
                    <select name="poleId" defaultValue={modal.poleId || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      <option value="">Sélectionner...</option>
                      {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
                    </select></div>
                  <div className="flex items-center gap-2">
                    <input name="actif" type="checkbox" defaultChecked={modal.actif !== false} className="w-4 h-4 accent-[var(--accent-blue)]" />
                    <label className="text-[0.85rem]">Actif</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* CAUSES D'ARRET */}
            {tab === 'causes' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveCause, [modal.id || null, { code: f.get('code') as string, libelle: f.get('libelle') as string, actif: f.get('actif') === 'on' }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Code *</label>
                    <input name="code" defaultValue={modal.code || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring font-mono" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Libellé *</label>
                    <input name="libelle" defaultValue={modal.libelle || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div className="flex items-center gap-2">
                    <input name="actif" type="checkbox" defaultChecked={modal.actif !== false} className="w-4 h-4 accent-[var(--accent-blue)]" />
                    <label className="text-[0.85rem]">Actif</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* CHECKPOINTS */}
            {tab === 'checkpoints' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveCheckpoint, [modal.id || null, { code: f.get('code') as string, libelle: f.get('libelle') as string, categorie: f.get('categorie') as string || undefined, poleId: (f.get('poleId') as string) || null, obligatoire: f.get('obligatoire') === 'on', actif: f.get('actif') === 'on', description: f.get('description') as string || undefined }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Code *</label>
                    <input name="code" defaultValue={modal.code || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring font-mono" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Libellé *</label>
                    <input name="libelle" defaultValue={modal.libelle || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Catégorie</label>
                    <input name="categorie" defaultValue={modal.categorie || ''} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Pôle</label>
                    <select name="poleId" defaultValue={modal.poleId || ''} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      <option value="">Tous les pôles</option>
                      {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
                    </select></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea name="description" defaultValue={modal.description || ''} rows={2} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><input name="obligatoire" type="checkbox" defaultChecked={modal.obligatoire || false} className="w-4 h-4 accent-[var(--accent-orange)]" /><label className="text-[0.85rem]">Obligatoire</label></div>
                    <div className="flex items-center gap-2"><input name="actif" type="checkbox" defaultChecked={modal.actif !== false} className="w-4 h-4 accent-[var(--accent-blue)]" /><label className="text-[0.85rem]">Actif</label></div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(saveUser, [modal.id || null, { email: f.get('email') as string, nom: f.get('nom') as string, motDePasse: (f.get('motDePasse') as string) || undefined, role: f.get('role') as string, poleId: (f.get('poleId') as string) || null, atelierId: null, actif: f.get('actif') === 'on' }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Email *</label>
                    <input name="email" type="email" defaultValue={modal.email || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                    <input name="nom" defaultValue={modal.nom || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Mot de passe {modal.id ? '(laisser vide pour ne pas changer)' : '*'}</label>
                    <input name="motDePasse" type="password" required={!modal.id} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Rôle *</label>
                    <select name="role" defaultValue={modal.role || 'CONDUCTEUR'} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      {getAllRoles().map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Pôle</label>
                    <select name="poleId" defaultValue={modal.poleId || ''} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring">
                      <option value="">Aucun (Global)</option>
                      {poles.map((p: any) => <option key={p.id} value={p.id}>{p.icone} {p.nom}</option>)}
                    </select></div>
                  <div className="flex items-center gap-2">
                    <input name="actif" type="checkbox" defaultChecked={modal.actif !== false} className="w-4 h-4 accent-[var(--accent-blue)]" />
                    <label className="text-[0.85rem]">Actif</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {/* PERMISSIONS */}
            {tab === 'permissions' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(savePermission, [modal.id || null, { code: f.get('code') as string, libelle: f.get('libelle') as string, groupe: f.get('groupe') as string, description: f.get('description') as string || undefined }]); }}>
                <div className="space-y-3">
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Code *</label>
                    <input name="code" defaultValue={modal.code || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring font-mono" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Libellé *</label>
                    <input name="libelle" defaultValue={modal.libelle || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Groupe *</label>
                    <input name="groupe" defaultValue={modal.groupe || ''} required className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                  <div><label className="block text-[0.78rem] font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea name="description" defaultValue={modal.description || ''} rows={2} className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.9rem] focus-ring" /></div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Annuler</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue disabled:opacity-50">{isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
