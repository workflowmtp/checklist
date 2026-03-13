'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { getExportData } from '@/lib/actions';

const EXPORTS = [
  { icon: '📋', color: 'var(--accent-blue)', title: 'Dossiers — Global', desc: 'Tous les dossiers avec KPI calculés', type: 'dossiers' },
  { icon: '📦', color: 'var(--accent-green)', title: 'Déclarations production', desc: 'Détail bonnes/calage/gâche par dossier', type: 'declarations' },
  { icon: '🚫', color: 'var(--accent-red)', title: 'Arrêts / Incidents', desc: 'Historique arrêts avec causes et durées', type: 'arrets' },
  { icon: '✅', color: 'var(--accent-purple)', title: 'Tâches de production', desc: 'Toutes les tâches avec temps prévu/réel', type: 'taches' },
  { icon: '🔍', color: 'var(--accent-cyan)', title: 'Contrôles qualité', desc: 'Bons et mauvais contrôles', type: 'controles' },
  { icon: '🔄', color: 'var(--accent-orange)', title: 'Passations', desc: "Transferts d'équipe", type: 'passations' },
];

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportsPage() {
  const [isPending, startTransition] = useTransition();

  const handleExport = (type: string) => {
    startTransition(async () => {
      const data = await getExportData(type) as any[];
      const date = new Date().toISOString().slice(0, 10);
      const csv = JSON.stringify(data, null, 2);
      downloadCSV(`printseq_${type}_${date}.json`, csv);
      toast.success(`Export ${type} : ${data.length} éléments`);
    });
  };

  return (
    <div>
      <h1 className="font-mono text-[1.5rem] font-bold mb-1">📤 Exports</h1>
      <p className="text-[var(--text-secondary)] text-[0.9rem] mb-6">Exporter les données de production</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {EXPORTS.map((exp) => (
          <button key={exp.type} onClick={() => handleExport(exp.type)} disabled={isPending}
            className="flex gap-3.5 items-start p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md card-interactive text-left">
            <div className="w-[42px] h-[42px] rounded-md flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${exp.color}20`, color: exp.color }}>{exp.icon}</div>
            <div><h4 className="font-bold text-[0.95rem] mb-0.5">{exp.title}</h4><p className="text-[0.78rem] text-[var(--text-tertiary)]">{exp.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}
