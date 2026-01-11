import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

type LinkItem = {
  to: string;
  label: string;
  icon: string;
};

const links: LinkItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/scan', label: 'Scanner', icon: 'photo_camera' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/stats', label: 'Stats', icon: 'query_stats' },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { to: '/trophy-room', label: 'Trophies', icon: 'military_tech' },
  { to: '/profile', label: 'Profile', icon: 'account_circle' },
];

const WebShell: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const displayName = profile?.full_name || profile?.username || 'Student';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="grid grid-cols-[280px_1fr] min-h-screen">
        <aside className="hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/20 backdrop-blur-xl">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <p className="font-black leading-tight">Mwakenya</p>
                <p className="text-xs text-slate-500">AI Homework Assistant</p>
              </div>
            </button>
          </div>

          <nav className="p-3 flex-1 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 h-11 rounded-xl font-bold text-sm',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5',
                  ].join(' ')
                }
              >
                <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                style={{
                  backgroundImage: `url(${profile?.avatar_url || `https://picsum.photos/seed/${profile?.id || 'user'}/120/120`})`,
                }}
              />
              <div className="min-w-0">
                <p className="font-bold truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.difficulty_level || 'standard'}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/20 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div
                className="size-8 rounded-full bg-cover bg-center border-2 border-primary/20"
                style={{
                  backgroundImage: `url(${profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`})`,
                }}
              />
              <div>
                <p className="font-bold text-sm">{displayName}</p>
                <p className="text-[10px] text-slate-500">Welcome back! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <button
                onClick={() => document.documentElement.classList.toggle('dark')}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 text-xs font-bold"
              >
                Theme
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default WebShell;
