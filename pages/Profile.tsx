
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <header className="p-4 flex items-center justify-between bg-white dark:bg-background-dark sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold">Profile</h2>
        <button onClick={() => navigate('/leaderboard')} className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">leaderboard</span>
        </button>
      </header>

      <div className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="size-32 rounded-full border-4 border-primary/20 p-1">
            <img 
              src="https://picsum.photos/seed/alex/300/300" 
              className="size-full rounded-full object-cover" 
              alt="Avatar" 
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full border-2 border-background-light dark:border-background-dark shadow-lg">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold">Alex Johnson</h3>
          <p className="text-primary font-medium">10th Grade Student</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-slate-400 text-xs">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Member since Sept 2023</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold">Learning Goals</h4>
          <button className="text-primary text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add_circle</span> Add Goal
          </button>
        </div>

        <div className="space-y-3">
          <GoalCard icon="functions" title="Daily Math Problems" progress={2} total={5} desc="Solve 5 problems to keep streak" />
          <GoalCard icon="timer" title="Study Timer" progress={15} total={30} unit="mins" desc="Deep focus study session" />
        </div>

        <h4 className="text-lg font-bold">Badges & Achievements</h4>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <Badge icon="local_fire_department" label="Streak Master" rank="Level 3" color="primary" />
          <Badge icon="workspace_premium" label="Math Whiz" rank="Gold" color="amber" />
          <Badge icon="dark_mode" label="Night Owl" rank="Unlocked" color="purple" />
          <Badge icon="lock" label="Speed Reader" rank="Locked" color="gray" locked />
        </div>

        <h4 className="text-lg font-bold">Settings</h4>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          <SettingsItem icon="shield_person" label="Account Security" color="blue" />
          <SettingsItem icon="crown" label="Subscription Plan" color="amber" tag="PRO" />
          <SettingsItem icon="notifications_active" label="Notifications" color="red" />
          <SettingsItem icon="help_center" label="Help & Support" color="green" />
        </div>

        <button className="w-full py-4 text-red-500 font-bold bg-white dark:bg-gray-800/50 border border-red-50 border-red-900/30 rounded-xl hover:bg-red-50 transition-colors">
          Log Out
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around items-center z-40">
        <NavItem icon="home" label="Home" onClick={() => navigate('/stats')} />
        <NavItem icon="photo_camera" label="Scanner" onClick={() => navigate('/')} />
        <NavItem icon="history" label="History" onClick={() => navigate('/history')} />
        <NavItem icon="account_circle" label="Profile" active />
      </nav>
    </div>
  );
};

const GoalCard: React.FC<{ icon: string, title: string, progress: number, total: number, unit?: string, desc: string }> = ({ icon, title, progress, total, unit, desc }) => (
  <div className="bg-white dark:bg-gray-800/30 p-4 rounded-xl border border-primary/5 shadow-sm space-y-3">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <span className="font-bold text-sm">{title}</span>
      </div>
      <span className="text-sm font-bold">{progress}/{total} {unit}</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(progress / total) * 100}%` }}></div>
    </div>
    <p className="text-[10px] text-slate-500">{desc}</p>
  </div>
);

const Badge: React.FC<{ icon: string, label: string, rank: string, color: string, locked?: boolean }> = ({ icon, label, rank, color, locked }) => {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-500',
  };
  return (
    <div className={`flex flex-col items-center gap-2 shrink-0 bg-white dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800 w-28 ${locked ? 'opacity-40 grayscale' : ''}`}>
      <div className={`size-14 rounded-full flex items-center justify-center ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-center leading-tight">{label}</p>
      <p className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${colorMap[color]}`}>{rank}</p>
    </div>
  );
};

const SettingsItem: React.FC<{ icon: string, label: string, color: string, tag?: string }> = ({ icon, label, color, tag }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`size-8 rounded flex items-center justify-center ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        {tag && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{tag}</span>}
        <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-gray-400'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
  </button>
);

export default Profile;
