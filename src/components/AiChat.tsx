'use client';

import { useState, useRef, useEffect, useTransition } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isPending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/ai-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId }),
        });

        const data = await res.json();

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.ok ? data.reply : `Erreur: ${data.error || 'Impossible de contacter l\'agent IA'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: 'Erreur de connexion avec l\'agent IA.',
            timestamp: new Date(),
          },
        ]);
      }
    });
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-[1.5rem] z-50 transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        title="Agent IA"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Panneau de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-[1.3rem]">🤖</span>
            <div className="flex-1">
              <div className="text-white font-bold text-[0.9rem]">Agent IA</div>
              <div className="text-white/70 text-[0.7rem]">Assistant intelligent PrintSeq</div>
            </div>
            <button onClick={() => setMessages([])} className="text-white/60 hover:text-white text-[0.75rem] px-2 py-1 rounded hover:bg-white/10" title="Effacer la conversation">
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="text-[2.5rem] mb-3">🤖</div>
                <div className="font-semibold text-[var(--text-primary)] text-[0.95rem]">Bonjour !</div>
                <div className="text-[var(--text-secondary)] text-[0.82rem] mt-1">
                  Je suis l&apos;assistant IA de PrintSeq.<br />
                  Comment puis-je vous aider ?
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[0.85rem] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#6366f1] text-white rounded-br-md'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-primary)]'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  <div className={`text-[0.6rem] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-[var(--text-tertiary)]'}`}>
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border-primary)] p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Tapez votre message..."
                disabled={isPending}
                className="flex-1 px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[0.85rem] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#6366f1] disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isPending || !input.trim()}
                className="px-4 py-2.5 rounded-xl font-semibold text-white text-[0.85rem] disabled:opacity-40 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
