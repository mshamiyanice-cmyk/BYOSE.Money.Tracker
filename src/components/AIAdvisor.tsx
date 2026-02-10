import React, { useState, useRef, useEffect } from 'react';
import { askFinancialAdvisor } from '../services/geminiService';
import { Inflow, Outflow, Overdraft } from '../types';
import { Button } from './ui/Button';
import { Send, Bot, User, Loader2, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';

interface AIAdvisorProps {
  inflows: Inflow[];
  outflows: Outflow[];
  overdrafts: Overdraft[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ inflows, outflows, overdrafts }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to the Strategic Advisor Hub. I have access to your current ledger. How can I assist with your financial analysis today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const result = await askFinancialAdvisor(userQuery, inflows, outflows, overdrafts, history);
      setMessages(prev => [...prev, { role: 'model', text: result.text, sources: result.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Connection failed. Please verify your API status." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-[#165b4c] text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Sparkles size={24} className="text-emerald-300" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight uppercase">AI Financial Advisor</h3>
            <p className="text-xs font-bold text-emerald-100 opacity-70">Gemini 3 Pro + Google Search</p>
          </div>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Active Analysis</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth-chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-[#165b4c]'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm border ${
                m.role === 'user' 
                ? 'bg-white border-slate-200 text-slate-800 font-medium' 
                : 'bg-[#165b4c] text-white'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Verified Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-bold transition-all border border-white/5">
                          <ExternalLink size={10} />
                          {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#165b4c]">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm italic font-medium">
                AI is analyzing your ledger data...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-4">
        <input 
          type="text"
          placeholder="e.g., Analyze our spending by category this month..."
          className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] transition-all text-sm font-bold"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="h-14 w-14 rounded-2xl shadow-xl shadow-[#165b4c]/20">
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};

export default AIAdvisor;