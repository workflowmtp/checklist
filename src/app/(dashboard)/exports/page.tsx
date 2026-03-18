'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { getExportData, getExportStats } from '@/lib/actions';

const EXPORTS = [
  { icon: '📋', color: 'var(--accent-blue)', title: 'Dossiers — Global', desc: 'Tous les dossiers avec KPI calculés', type: 'dossiers', format: 'csv' },
  { icon: '📦', color: 'var(--accent-green)', title: 'Déclarations production', desc: 'Détail bonnes/calage/gâche par dossier', type: 'declarations', format: 'csv' },
  { icon: '🚫', color: 'var(--accent-red)', title: 'Arrêts / Incidents', desc: 'Historique arrêts avec causes et durées', type: 'arrets', format: 'csv' },
  { icon: '✅', color: 'var(--accent-purple)', title: 'Tâches de production', desc: 'Toutes les tâches avec temps prévu/réel', type: 'taches', format: 'csv' },
  { icon: '🔍', color: 'var(--accent-cyan)', title: 'Contrôles qualité', desc: 'Bons et mauvais contrôles avec commentaires', type: 'controles', format: 'csv' },
  { icon: '🔄', color: 'var(--accent-orange)', title: 'Passations', desc: "Transferts d'équipe avec détail production", type: 'passations', format: 'csv' },
  { icon: '📊', color: 'var(--accent-blue)', title: 'Synthèse KPI', desc: 'KPI consolidés par pôle et machine', type: 'kpi', format: 'csv' },
  { icon: '⚙️', color: 'var(--text-secondary)', title: 'Configuration complète', desc: 'Pôles, ateliers, machines, opérateurs (JSON)', type: 'backup', format: 'json' },
];

function downloadFile(filename: string, content: string, mime: string = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: any[], headers: string[]): string {
  const escape = (v: any) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [headers.join(';')];
  rows.forEach((r) => lines.push(headers.map((h) => escape(r[h])).join(';')));
  return lines.join('\n');
}

export default function ExportsPage() {
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    getExportStats().then(setStats);
  }, []);

  const handleExport = (type: string, format: string) => {
    startTransition(async () => {
      const data = await getExportData(type) as any[];
      const date = new Date().toISOString().slice(0, 10);
      if (format === 'json') {
        downloadFile(`printseq_${type}_${date}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
      } else {
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const csv = toCSV(data, headers);
        downloadFile(`printseq_${type}_${date}.csv`, csv);
      }
      toast.success(`Export ${type} : ${data.length} éléments`);
    });
  };

  return (
    <div>
      <div className="page-title">📤 Exports</div>
      <div className="page-subtitle">Exporter les données de production en CSV</div>

      <div className="export-grid">
        {EXPORTS.map((exp) => (
          <div key={exp.type} className="export-card" onClick={() => handleExport(exp.type, exp.format)} style={{ cursor: isPending ? 'wait' : 'pointer' }}>
            <div className="export-card-icon" style={{ background: `${exp.color}20`, color: exp.color }}>{exp.icon}</div>
            <div className="export-card-body"><h4>{exp.title}</h4><p>{exp.desc}</p></div>
          </div>
        ))}
      </div>

      {stats.length > 0 && (
        <div className="section-block" style={{ marginTop: '24px' }}>
          <div className="section-block-title">📁 Données disponibles</div>
          <div className="kpi-row">
            {stats.map((s) => (
              <div key={s.label} className="kpi-card">
                <div className="kpi-card-label">{s.label}</div>
                <div className="kpi-card-value">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
