import React, { useState } from 'react';
import { Bot, Send, Lightbulb } from 'lucide-react';
import { consultArchitect } from '../services/aiService';

export const AIArchitect: React.FC = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Olá! Sou seu Consultor da Agência Chan. Pergunte-me qualquer coisa sobre planejamento, squads ou otimização de fluxo de trabalho.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleConsult = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Context from our "System" (mocked for this specific file, usually passed via props)
    const context = JSON.stringify({
       activeModules: ['Kanban', 'CRM', 'Financeiro', 'Produtividade'],
       userRole: 'ADMIN',
       goal: 'Escalar Operações da Agência'
    });

    const response = await consultArchitect(userMsg, context);
    
    setHistory(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-pink-600 p-6 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg text-white">
            <Bot size={24} />
        </div>
        <div>
            <h2 className="text-white font-bold text-lg">Consultor IA Chan</h2>
            <p className="text-pink-100 text-sm">Planejamento Estratégico & Operacional</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-5 ${
                    msg.role === 'user' 
                    ? 'bg-pink-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ 
                        __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br />') 
                    }} />
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                placeholder="Ex: Como devo estruturar minha equipe Criativa?"
                className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-pink-500 rounded-lg px-4 py-3 outline-none transition-all"
            />
            <button 
                onClick={handleConsult}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
                <Send size={20} />
            </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setQuery("Sugira um fluxo Kanban para projetos de SEO")} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-pink-50 text-pink-600 text-xs font-medium rounded-full border border-pink-100 flex items-center gap-1 transition-colors">
                <Lightbulb size={12} /> Fluxo SEO
            </button>
            <button onClick={() => setQuery("Como medir produtividade de freelancers?")} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-pink-50 text-pink-600 text-xs font-medium rounded-full border border-pink-100 flex items-center gap-1 transition-colors">
                <Lightbulb size={12} /> KPIs Freelancer
            </button>
        </div>
      </div>
    </div>
  );
};