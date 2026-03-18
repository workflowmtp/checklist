'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getAdminData, savePole, deletePole, saveAtelier, deleteAtelier, saveMachine, deleteMachine, saveOperateur, deleteOperateur, saveCause, saveCheckpoint, saveUser, savePermission, toggleRolePermission, deleteEntity, linkMachineAtelier, unlinkMachineAtelier, linkOperateurAtelier, unlinkOperateurAtelier, getAteliersForPole, getAdminStats, getAdminLogs, getExportData } from '@/lib/actions';
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
  { id: 'params', icon: '🔧', label: 'Paramètres' },
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
  const [linkModal, setLinkModal] = useState<any>(null);
  const [linkAteliers, setLinkAteliers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

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
    if (tab === 'params') {
      const s = await getAdminStats();
      setStats(s);
    }
  };

  // Machine-Atelier / Operateur-Atelier linking
  const openLinkModal = async (type: 'machine' | 'operateur', item: any) => {
    const ateliers = await getAteliersForPole(item.poleId);
    setLinkAteliers(ateliers);
    setLinkModal({ type, item });
  };
  const handleLink = (atelierId: string) => {
    if (!atelierId || !linkModal) return;
    startTransition(async () => {
      if (linkModal.type === 'machine') await linkMachineAtelier(linkModal.item.id, atelierId);
      else await linkOperateurAtelier(linkModal.item.id, atelierId);
      toast.success('Atelier lié');
      loadData();
      openLinkModal(linkModal.type, linkModal.item);
    });
  };
  const handleUnlink = (atelierId: string) => {
    startTransition(async () => {
      if (linkModal.type === 'machine') await unlinkMachineAtelier(linkModal.item.id, atelierId);
      else await unlinkOperateurAtelier(linkModal.item.id, atelierId);
      toast.success('Lien supprimé');
      loadData();
      openLinkModal(linkModal.type, linkModal.item);
    });
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

          {tab !== 'role-permissions' && tab !== 'params' && (
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
                {tab === 'machines' && ['Code','Nom','Pôle','Ateliers','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
                {tab === 'operateurs' && ['Nom','Matricule','Pôle','Ateliers','Actif','Actions'].map((h) => <th key={h} className="text-left px-3 py-2 text-[0.7rem] font-bold uppercase text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">{h}</th>)}
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
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[0.82rem]">{item.machineAteliers?.length > 0 ? item.machineAteliers.map((l: any) => l.atelier?.nom).join(', ') : <span className="text-[var(--text-tertiary)]">—</span>}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase ${item.actif ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]' : 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    </>}
                    {tab === 'operateurs' && <>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-semibold">{item.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] font-mono">{item.matricule || '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)]">{item.pole?.icone} {item.pole?.nom}</td>
                      <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[0.82rem]">{item.operateurAteliers?.length > 0 ? item.operateurAteliers.map((l: any) => l.atelier?.nom).join(', ') : <span className="text-[var(--text-tertiary)]">—</span>}</td>
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
                        {(tab === 'machines' || tab === 'operateurs') && (
                          <button onClick={() => openLinkModal(tab === 'machines' ? 'machine' : 'operateur', item)} className="w-7 h-7 rounded flex items-center justify-center text-[0.85rem] hover:bg-[var(--bg-tertiary)]" title="Gérer ateliers">🔗</button>
                        )}
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

          {tab === 'params' && (
            <div className="space-y-5">
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5">
                <div className="font-mono font-bold text-base mb-3.5">🔧 Paramètres Généraux</div>
                <div className="text-[0.85rem] font-semibold text-[var(--text-secondary)] mb-3">État de la base de données</div>
                {stats ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-5">
                    {[
                      { l: 'Pôles', v: stats.poles }, { l: 'Ateliers', v: stats.ateliers },
                      { l: 'Machines', v: stats.machines }, { l: 'Opérateurs', v: stats.operateurs },
                      { l: 'Utilisateurs', v: stats.users }, { l: 'Dossiers', v: stats.dossiers },
                      { l: "Causes d'arrêt", v: stats.causes_arret }, { l: 'Checkpoints', v: stats.checkpoints },
                      { l: "Logs d'actions", v: stats.logs_actions },
                    ].map((s) => (
                      <div key={s.l} className="bg-[var(--bg-tertiary)] rounded-md p-3 text-center">
                        <div className="text-[0.68rem] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{s.l}</div>
                        <div className="font-mono font-bold text-[1.3rem]">{s.v}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[var(--text-tertiary)]">Chargement...</div>}
                <div className="text-[0.85rem] font-semibold text-[var(--text-secondary)] mb-3">Actions système</div>
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => { startTransition(async () => { const d = await getExportData('backup'); const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'printseq_config_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); URL.revokeObjectURL(url); toast.success('Configuration exportée'); }); }} disabled={isPending}
                    className="px-4 py-2.5 rounded-md text-[0.85rem] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--accent-blue-dim)]">📥 Exporter configuration</button>
                  <button onClick={() => { startTransition(async () => { const logs = await getAdminLogs(); if (!logs.length) { toast.warning('Aucun log'); return; } const csv = ['Date;Utilisateur;Action;Entité;ID;Détails'].concat(logs.map((l: any) => `${l.dateAction};${l.utilisateur?.nom || 'Système'};${l.typeAction};${l.entite || ''};${l.entiteId || ''};${l.detailsJson || ''}`)).join('\n'); const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'printseq_logs_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(url); toast.success('Logs exportés (CSV)'); }); }} disabled={isPending}
                    className="px-4 py-2.5 rounded-md text-[0.85rem] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--accent-blue-dim)]">📋 Exporter logs</button>
                  <button onClick={() => { if (confirm('⚠️ Cette action va réinitialiser les données de démonstration via /api/seed. Continuer ?')) { window.location.href = '/api/seed'; } }}
                    className="ml-auto px-4 py-2.5 rounded-md text-[0.85rem] font-semibold bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)] hover:bg-[var(--accent-red)] hover:text-white transition-colors">🔄 Réinitialiser données démo</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ LINK MODAL (Machine-Atelier / Operateur-Atelier) ============ */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLinkModal(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 w-full max-w-[450px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold text-lg">Ateliers de {linkModal.item.nom || linkModal.item.codeMachine}</h3>
              <button onClick={() => setLinkModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-lg">✕</button>
            </div>
            {/* Current links */}
            <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px]">
              {(() => {
                const links = linkModal.type === 'machine' ? (linkModal.item.machineAteliers || []) : (linkModal.item.operateurAteliers || []);
                return links.length === 0
                  ? <span className="text-[var(--text-tertiary)] text-[0.85rem]">Aucun atelier lié</span>
                  : links.map((l: any) => (
                    <span key={l.atelier?.id || l.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] rounded-full text-[0.8rem] font-semibold">
                      {l.atelier?.nom}
                      <button onClick={() => handleUnlink(l.atelier?.id || l.atelierId)} className="hover:text-[var(--accent-red)] ml-0.5">×</button>
                    </span>
                  ));
              })()}
            </div>
            {/* Add new link */}
            <div className="flex gap-2">
              <select id="linkAtelierSelect" className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[0.85rem]">
                <option value="">— Ajouter un atelier —</option>
                {linkAteliers.filter((a) => {
                  const links = linkModal.type === 'machine' ? (linkModal.item.machineAteliers || []) : (linkModal.item.operateurAteliers || []);
                  const linkedIds = links.map((l: any) => l.atelier?.id || l.atelierId);
                  return !linkedIds.includes(a.id);
                }).map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
              <button onClick={() => { const sel = document.getElementById('linkAtelierSelect') as HTMLSelectElement; handleLink(sel.value); }} disabled={isPending}
                className="px-4 py-2 rounded-md font-semibold text-white text-[0.85rem] btn-gradient-blue">Ajouter</button>
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => { setLinkModal(null); loadData(); }} className="px-4 py-2 rounded-md text-[0.85rem] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]">Fermer</button>
            </div>
          </div>
        </div>
      )}

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
