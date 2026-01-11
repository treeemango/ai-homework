
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Solution } from '../types';

interface HistoryProps {
  history: Solution[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-xl font-bold">Homework History</h2>
        <button className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">calendar_today</span>
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 h-12 bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm">
          <span className="material-symbols-outlined text-primary">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm flex-1" placeholder="Search equations or topics" />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {['All', 'Math', 'Physics', 'Chemistry', 'Linguistics'].map((c, i) => (
            <button key={c} className={`px-6 h-9 rounded-full text-sm font-semibold whitespace-nowrap ${i === 0 ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
              {c}
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3">Recent Scans</h3>
          {history.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-slate-300">history</span>
              <p className="text-slate-500">No scans yet. Try solving something!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="size-16 rounded-lg bg-cover bg-center border border-slate-100 dark:border-slate-700 shrink-0" style={{ backgroundImage: `url(${item.captureUrl})` }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.topic} - {item.subtopic}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded uppercase">{item.topic}</span>
                      <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around items-center z-40">
        <NavItem icon="home" label="Home" onClick={() => navigate('/stats')} />
        <NavItem icon="photo_camera" label="Scanner" onClick={() => navigate('/')} />
        <NavItem icon="history" label="History" active />
        <NavItem icon="account_circle" label="Profile" onClick={() => navigate('/profile')} />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-gray-400'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
  </button>
);

export default History;
