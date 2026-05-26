import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, ChevronRight, X, User, Zap, RefreshCw } from 'lucide-react';
import { StudentProfile } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiTutorProps {
  profile: StudentProfile;
  activeSubjectName?: string;
  activeLessonTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  quickPromptText?: string;
  onClearQuickPrompt?: () => void;
}

export default function AiTutor({
  profile,
  activeSubjectName,
  activeLessonTitle,
  isOpen,
  onClose,
  quickPromptText,
  onClearQuickPrompt
}: AiTutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ahalan ${profile.name.split(' ')[0]} ! 👋 Bienvenue sur Moul L'Bac AI. Je suis ton tuteur dédié pour décrocher ton Bac avec mention incha'Allah ! Tu as des questions de Mathématiques, de Physique ou besoin d'astuces pour l'examen ? Écris-moi en Darija, Français ou Arabe !`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Monitor quick prompts injected from other sub-components
  useEffect(() => {
    if (quickPromptText) {
      handleSendPrompt(quickPromptText);
      if (onClearQuickPrompt) onClearQuickPrompt();
    }
  }, [quickPromptText]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendPrompt = async (textToSend: string) => {
    const val = textToSend.trim();
    if (!val) return;

    // Add user message to state
    const userMsg: Message = { role: 'user', content: val };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: val,
          history: updatedHistory.slice(0, -1), // Send previous history items
          currentLessonTitle: activeLessonTitle,
          currentSubjectName: activeSubjectName,
          levelName: profile.academicLevelId === "2eme" ? "2ème Bac" : "1ère Bac",
          streamName: profile.streamId === "sm" ? "Sciences Mathématiques (SM)" : profile.streamId === "pc" ? "Sciences Physiques (PC)" : "Sciences Expérimentales"
        })
      });

      if (!response.ok) {
        throw new Error('Server responded with an error code.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oups ! Moul L'Bac a rencontré un petit problème de liaison. Vérifie que la clé d'API Google Gemini est bien ajoutée dans les secrets ou réessaye dans un instant !"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    handleSendPrompt(input);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `C'est reparti pour un nouveau sujet d'étude ! Pose-moi toutes tes questions sur le programme de ${activeSubjectName || "révisions"}.`
      }
    ]);
  };

  const sampleQuestions = [
    { text: "Explique-moi le TVI d'une façon simple 💡" },
    { text: "Donne-moi une astuce pour l'examen de physique ! ⚡" },
    { text: "Formule du retard temporel τ ? 📏" },
    { text: "Comment gérer le stress avant l'Examen National ? 🧘" }
  ];

  // LaTeX notation parsing formatter
  const formatMessageText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        return (
          <div key={i} className="my-2 p-2 bg-indigo-950 text-emerald-300 rounded font-mono text-xs overflow-x-auto text-center border border-emerald-500/20">
            {formula}
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const inlineFormula = part.slice(1, -1);
        return (
          <code key={i} className="px-1 py-0.2 bg-emerald-50 text-emerald-800 font-mono text-xs font-bold rounded">
            {inlineFormula}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div id="ai-tutor-sidebar" className="fixed right-0 top-16 bottom-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col justify-between overflow-hidden">
      
      {/* Header bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-950 p-4 text-white flex items-center justify-between relative border-b border-emerald-950">
        <div className="absolute inset-0 opacity-10 bg-moroccan-pattern"></div>
        <div className="relative flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
            <Sparkles className="w-5 h-5 fill-emerald-300" />
          </span>
          <div>
            <h3 className="font-display font-bold text-sm">Moul L'Bac AI Tutor</h3>
            <p className="text-[10px] text-emerald-300">En direct • Darija/Français</p>
          </div>
        </div>
        
        <div className="relative flex items-center gap-2">
          <button 
            id="clear-chat-btn"
            onClick={clearChat}
            className="p-1 hover:bg-white/10 rounded text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Effacer l'historique"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            id="close-ai-tutor-btn"
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* active context indicator */}
      {(activeSubjectName || activeLessonTitle) && (
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
          <span className="font-bold text-emerald-700">Contexte:</span> 
          <span className="truncate">{activeSubjectName} • {activeLessonTitle}</span>
        </div>
      )}

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              m.role === 'user' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-emerald-800" /> : <MessageSquare className="w-4 h-4 text-emerald-700" />}
            </div>

            <div className={`max-w-[75%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
            }`}>
              {m.role === 'user' ? m.content : formatMessageText(m.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" />
            </div>
            <div className="max-w-[75%] p-3 rounded-2xl rounded-tl-none bg-slate-50 text-slate-505 border border-slate-100 text-xs italic">
              Moul L'Bac est en train de réfléchir...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick sample prompt bubbles */}
      {messages.length === 1 && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sujets d'aide rapides</div>
          <div className="grid grid-cols-2 gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`quick-ai-q-${idx}`}
                onClick={() => handleSendPrompt(q.text)}
                className="p-2 bg-white text-left hover:bg-emerald-50 text-[10px] text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all font-sans leading-tight line-clamp-2"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          id="ai-tutor-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mettre votre formule, question..."
          className="flex-1 px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all"
        />
        <button
          id="ai-tutor-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3.5 bg-emerald-701 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
