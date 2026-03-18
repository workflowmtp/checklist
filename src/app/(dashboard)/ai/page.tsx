'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getDashboardData, getHomeData } from '@/lib/actions';
import { formatNumber, formatDuration, getInitials, getStatutDossierLabel } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string; time: string; }

const QUICK_ACTIONS = [
  { label: '📊 État production', q: "Quel est l'état actuel de la production ?" },
  { label: '📋 Dossiers actifs', q: 'Quels sont les dossiers en cours ?' },
  { label: '🚫 Analyse arrêts', q: 'Analyse des arrêts et causes principales' },
  { label: '🗑 Taux de gâche', q: 'Quel est le taux de gâche par pôle ?' },
  { label: '🏭 Comparer pôles', q: 'Compare les performances des pôles' },
  { label: '📋 Synthèse direction', q: 'Génère une synthèse pour la direction' },
];

export default function AIPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const userInitials = session?.user ? getInitials(session.user.name || '') : '??';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "🤖 **Bienvenue ! Je suis PrintSeq AI**, votre copilote de production.\n\nJe connais l'état de tous vos dossiers, machines, arrêts et indicateurs en temps réel.\n\nUtilisez les boutons rapides ci-dessus ou posez-moi directement une question !",
        time: new Date().toISOString(),
      }]);
    }
  }, []);

  useEffect(() => { messagesRef.current?.scrollTo(0, messagesRef.current.scrollHeight); }, [messages, isTyping]);

  const localAnalyze = async (question: string): Promise<string> => {
    const data = await getDashboardData();
    const q = question.toLowerCase();

    if (q.includes('dossier') && (q.includes('actif') || q.includes('en cours') || q.includes('cours'))) {
      const homeData = await getHomeData();
      if (homeData.activeDossiers.length === 0) return '📋 **Aucun dossier actif** actuellement.';
      let resp = `📋 **${homeData.activeDossiers.length} dossier(s) actif(s)**\n\n`;
      homeData.activeDossiers.forEach((d: any) => {
        resp += `• **${d.dossierNumero}** — ${d.designation}\n  ${d.pole?.icone || ''} ${d.pole?.nom || ''} | Machine : ${d.machine?.codeMachine || '—'} | Statut : ${getStatutDossierLabel(d.statut)}\n`;
      });
      return resp;
    }
    if (q.includes('état') || q.includes('situation') || q.includes('résumé') || q.includes('overview')) {
      return `📊 **Situation production MULTIPRINT**\n\n🏭 ${data.nbTotal} dossiers au total : ${data.nbEnCours} en cours, ${data.nbAttente} en attente, ${data.nbCloture} clôturés.\n\n📦 Production : ${formatNumber(data.totBonnes)} bonnes / ${formatNumber(data.totEngage)} engagées\n🗑 Gâche : ${formatNumber(data.totGache)} (${data.txGache.toFixed(1)}%)\n⏱ Disponibilité : ${data.txDispo.toFixed(1)}% | MTTR : ${formatDuration(data.mttr)}\n✅ Conformité tâches : ${data.txConf.toFixed(1)}%`;
    }
    if (q.includes('arrêt') || q.includes('arret') || q.includes('stop') || q.includes('panne')) {
      let resp = `🚫 **Analyse des arrêts**\n\n📊 ${data.nbArrets} arrêts enregistrés\n⏱ Temps total : ${formatDuration(data.totStopMs)}\n🔧 MTTR : ${formatDuration(data.mttr)}\n📈 Disponibilité : ${data.txDispo.toFixed(1)}%\n`;
      if (data.pareto.length > 0) {
        resp += '\n**Top causes :**\n';
        data.pareto.slice(0, 5).forEach((p: any, i: number) => { resp += `${i + 1}. ${p.label} — ${p.count} fois\n`; });
      }
      return resp;
    }
    if (q.includes('gâche') || q.includes('gache') || q.includes('rebut')) {
      let resp = `🗑 **Analyse de la gâche**\n\nTotal : ${formatNumber(data.totGache)} / ${formatNumber(data.totEngage)} engagés\nTaux : ${data.txGache.toFixed(1)}%\n\n**Par pôle :**\n`;
      data.perPole.forEach((p: any) => { resp += `${p.txGache > 5 ? '⚠️' : '✅'} ${p.pole.icone} ${p.pole.nom} : ${p.txGache.toFixed(1)}%\n`; });
      return resp;
    }
    if (q.includes('pôle') || q.includes('pole') || q.includes('compar')) {
      let resp = '🏭 **Comparatif des pôles**\n\n';
      data.perPole.forEach((p: any) => {
        resp += `${p.pole.icone} **${p.pole.nom}** : ${p.dossiers} dossiers, engagé ${formatNumber(p.engage)}, gâche ${p.txGache.toFixed(1)}%, dispo ${p.txDispo.toFixed(1)}%\n`;
      });
      return resp;
    }
    if (q.includes('synthèse') || q.includes('synthese') || q.includes('direction') || q.includes('rapport')) {
      let resp = `📋 **SYNTHÈSE DIRECTION — MULTIPRINT**\nDate : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      resp += `📊 **PRODUCTION** : ${data.nbTotal} dossiers, ${formatNumber(data.totBonnes)} bonnes pièces\n`;
      resp += `🗑 **QUALITÉ** : gâche ${data.txGache.toFixed(1)}%, conformité ${data.txConf.toFixed(1)}%\n`;
      resp += `⏱ **DISPONIBILITÉ** : ${data.txDispo.toFixed(1)}%, ${data.nbArrets} arrêts\n\n`;
      resp += '🏭 **PAR PÔLE :**\n';
      data.perPole.forEach((p: any) => { resp += `${p.pole.icone} ${p.pole.nom} : dispo ${p.txDispo.toFixed(0)}%, gâche ${p.txGache.toFixed(1)}%\n`; });
      return resp;
    }
    return "🤖 Je suis PrintSeq AI. Posez-moi une question sur :\n📊 État production | 📋 Dossiers | 🚫 Arrêts | 🗑 Gâche | 🏭 Pôles | 📋 Synthèse direction";
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg, time: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await localAnalyze(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: response, time: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Désolé, une erreur s'est produite.", time: new Date().toISOString() }]);
    }
    setIsTyping(false);
  };

  const formatMd = (text: string) => {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px-48px)] max-h-[calc(100vh-60px-48px)]">
      {/* Header */}
      <div className="flex items-center gap-3.5 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg mb-3.5 flex-shrink-0">
        <div className="w-11 h-11 rounded-md flex items-center justify-center text-[22px] btn-gradient-purple text-white">🤖</div>
        <div className="flex-1"><h3 className="font-mono font-bold">PrintSeq AI</h3><p className="text-[0.78rem] text-[var(--text-tertiary)]">Assistant intelligent de production — MULTIPRINT</p></div>
        <div className="flex gap-1.5 flex-wrap">{['Copilote','Analyste','Mémoire','Expert'].map((r) => <span key={r} className="px-2.5 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-[0.65rem] text-[var(--text-secondary)]">{r}</span>)}</div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 pb-2 flex-shrink-0">
        {QUICK_ACTIONS.map((qa) => (
          <button key={qa.q} onClick={() => send(qa.q)} className="px-3.5 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] text-[0.78rem] hover:bg-[var(--accent-blue-dim)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-all whitespace-nowrap">{qa.label}</button>
        ))}
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto py-2 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 max-w-[85%] animate-msg-in ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'btn-gradient-purple text-white'}`}>
              {msg.role === 'user' ? userInitials : '🤖'}
            </div>
            <div>
              <div className={`px-4 py-3 rounded-md text-[0.88rem] leading-relaxed ${msg.role === 'user' ? 'bg-[var(--accent-blue)] text-white rounded-br-[4px]' : 'bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-bl-[4px]'}`}
                dangerouslySetInnerHTML={{ __html: formatMd(msg.content) }} />
              <div className={`text-[0.65rem] text-[var(--text-muted)] mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {new Date(msg.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5 self-start"><div className="w-[30px] h-[30px] rounded-full btn-gradient-purple text-white flex items-center justify-center text-sm">🤖</div>
            <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md"><div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-typing" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div></div></div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2.5 pt-3.5 border-t border-[var(--border-primary)] flex-shrink-0 items-end">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Posez une question sur la production..." rows={1}
          className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.9rem] resize-none min-h-[44px] max-h-[120px] focus-ring" />
        <button onClick={() => send()} disabled={isTyping || !input.trim()}
          className="w-11 h-11 rounded-md flex items-center justify-center text-white text-lg btn-gradient-purple flex-shrink-0 disabled:opacity-50 hover:scale-105 transition-all">➤</button>
      </div>
    </div>
  );
}
