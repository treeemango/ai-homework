
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Solution } from '../types';
import { chatWithSolution } from '../services/geminiService';

interface SolutionViewProps {
  solution: Solution | null;
}

const SolutionView: React.FC<SolutionViewProps> = ({ solution }) => {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!solution) {
    navigate('/');
    return null;
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const geminiHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      const response = await chatWithSolution(geminiHistory, userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response || "I'm not sure, could you rephrase?" }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="flex items-center p-4 justify-between sticky top-0 z-30 bg-white/80 dark:bg-black/50 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate('/')} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Solution Details</h2>
        <button className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Original Capture</p>
          <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative shadow-sm">
            <img src={solution.captureUrl} className="w-full h-full object-cover" alt="Capture" />
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1 rounded-lg">
              <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Chip icon="functions" label={solution.topic} active />
          <Chip label={solution.subtopic} />
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-1">Step-by-Step Solution</h3>
          <p className="text-sm text-slate-500">{solution.explanation}</p>
        </div>

        <div className="space-y-6">
          {solution.steps.map((step, i) => (
            <div key={i} className="grid grid-cols-[32px_1fr] gap-4">
              <div className="flex flex-col items-center">
                <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-sm">{step.icon || 'psychology'}</span>
                </div>
                {i < solution.steps.length - 1 && <div className="w-0.5 bg-primary/10 flex-1 my-1"></div>}
              </div>
              <div className="pb-4">
                <h4 className="font-bold text-base">{step.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {step.description}
                </p>
                {step.math && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded font-mono text-primary text-sm">
                    {step.math}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-[32px_1fr] gap-4">
            <div className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </div>
            <div>
              <h4 className="font-bold text-base">Final Result</h4>
              <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                <p className="text-emerald-700 dark:text-emerald-400 font-mono text-lg font-bold">{solution.finalResult}</p>
                <p className="text-emerald-600/60 text-[10px] mt-2 italic">Don't forget the constants if applicable!</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-white/90 dark:bg-[#101622]/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 space-y-3">
        <button 
          onClick={() => setShowChat(true)}
          className="w-full h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          Chat with AI
        </button>
        <div className="flex gap-3">
          <button className="flex-1 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">bookmark</span> Save
          </button>
          <button className="flex-1 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">content_copy</span> Copy
          </button>
        </div>
      </div>

      {/* Chat Overlay */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowChat(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1a2130] rounded-t-3xl shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-bold">AI Assistant</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="size-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-3">
                <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 text-sm">
                  I've analyzed the problem. Do you have any questions about the steps or the final result?
                </div>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 text-sm rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl rounded-tl-none w-16 items-center justify-center">
                  <span className="size-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-[#1a2130] border-t border-gray-100 dark:border-gray-800 pb-8">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl p-2 pl-4 border border-gray-200 dark:border-gray-700">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5" 
                  placeholder="Type a message..." 
                  type="text"
                />
                <button 
                  onClick={handleSendMessage}
                  className="size-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ icon?: string, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1 h-8 px-4 rounded-full border text-xs font-bold ${active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-500'}`}>
    {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
    <span>{label}</span>
  </div>
);

export default SolutionView;
