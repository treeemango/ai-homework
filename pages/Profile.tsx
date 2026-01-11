
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createStudentInvite, getUserAchievements, getAllAchievements, updateDifficultyLevel } from '../services/databaseService';
import { Achievement, UserAchievement } from '../types';
import QRCode from 'qrcode';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, stats, signOut, loading, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'standard' | 'challenge'>('standard');
  const [invite, setInvite] = useState<{ code: string; expires_at: string; relationship: 'parent' | 'teacher' } | null>(null);
  const [inviteQr, setInviteQr] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (profile?.id) {
        const [all, user] = await Promise.all([
          getAllAchievements(),
          getUserAchievements(profile.id)
        ]);
        setAchievements(all);
        setUserAchievements(user.map((ua: any) => ua.achievements?.id || ''));
      }
    };
    fetchAchievements();
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.difficulty_level) {
      setDifficulty(profile.difficulty_level);
    }
  }, [profile?.difficulty_level]);

  const handleDifficultyChange = async (value: 'easy' | 'standard' | 'challenge') => {
    setDifficulty(value);
    if (!profile?.id) return;
    await updateDifficultyLevel(profile.id, value);
    await refreshProfile();
  };

  const handleCreateInvite = async (relationship: 'parent' | 'teacher') => {
    if (!profile?.id) return;
    setInviteLoading(true);
    try {
      const created = await createStudentInvite(relationship);
      if (!created?.code) throw new Error('Failed to create invite');
      const code = String(created.code);
      const expires_at = String(created.expires_at);
      setInvite({ code, expires_at, relationship });

      const url = `${window.location.origin}${window.location.pathname}#/dashboard?code=${encodeURIComponent(code)}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      setInviteQr(qr);
    } catch (e) {
      console.error(e);
      alert('Failed to create invite code.');
    } finally {
      setInviteLoading(false);
    }
  };

  const displayName = profile?.full_name || profile?.username || 'Student';
  const avatarUrl = profile?.avatar_url || 'https://picsum.photos/seed/default/300/300';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

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
              src={avatarUrl}
              className="size-full rounded-full object-cover"
              alt="Avatar"
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full border-2 border-background-light dark:border-background-dark shadow-lg">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold">{displayName}</h3>
          <p className="text-primary font-medium">{stats?.problemsSolved || 0} problems solved</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-slate-400 text-xs">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Member since {memberSince}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <h4 className="text-lg font-bold">Invite Parent/Teacher</h4>
          <p className="text-xs text-slate-500 mt-1">Generate a one-time code to link your account.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              disabled={inviteLoading}
              onClick={() => handleCreateInvite('parent')}
              className="h-11 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {inviteLoading ? 'Generating…' : 'Parent code'}
            </button>
            <button
              disabled={inviteLoading}
              onClick={() => handleCreateInvite('teacher')}
              className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700 text-[#0d121c] dark:text-white font-bold text-sm disabled:opacity-50"
            >
              {inviteLoading ? 'Generating…' : 'Teacher code'}
            </button>
          </div>

          {invite && (
            <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite code</p>
                  <p className="text-xl font-black tracking-widest mt-1">{invite.code}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    for {invite.relationship} • expires {new Date(invite.expires_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(invite.code)}
                  className="h-9 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold"
                >
                  Copy
                </button>
              </div>

              {inviteQr && (
                <div className="mt-4 flex justify-center">
                  <img src={inviteQr} alt="Invite QR" className="rounded-xl border border-gray-200 dark:border-gray-700" />
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-3 text-center">
                Scan QR to open Dashboard with code prefilled.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <h4 className="text-lg font-bold">Difficulty</h4>
          <p className="text-xs text-slate-500 mt-1">Used to tailor explanations.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { key: 'easy', label: 'Easy' },
                { key: 'standard', label: 'Standard' },
                { key: 'challenge', label: 'Challenge' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleDifficultyChange(opt.key)}
                className={`h-10 rounded-xl text-xs font-bold border transition-colors ${
                  difficulty === opt.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold">Learning Goals</h4>
          <button className="text-primary text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add_circle</span> Add Goal
          </button>
        </div>

        <div className="space-y-3">
          <GoalCard icon="functions" title="Daily Math Problems" progress={stats?.problemsSolved || 0} total={5} desc="Solve 5 problems to keep streak" />
          <GoalCard icon="timer" title="Study Timer" progress={15} total={30} unit="mins" desc="Deep focus study session" />
        </div>

        <h4 className="text-lg font-bold">Badges & Achievements</h4>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {achievements.slice(0, 4).map(achievement => (
            <Badge
              key={achievement.id}
              icon={userAchievements.includes(achievement.id) ? achievement.icon : 'lock'}
              label={achievement.name}
              rank={userAchievements.includes(achievement.id) ? 'Unlocked' : 'Locked'}
              color={userAchievements.includes(achievement.id) ? 'primary' : 'gray'}
              locked={!userAchievements.includes(achievement.id)}
            />
          ))}
          {achievements.length === 0 && (
            <p className="text-gray-400 text-sm">No achievements available</p>
          )}
        </div>

        <h4 className="text-lg font-bold">Settings</h4>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          <div onClick={() => navigate('/dashboard')}>
            <SettingsItem icon="dashboard" label="Dashboard" color="purple" />
          </div>
          <SettingsItem icon="shield_person" label="Account Security" color="blue" />
          <SettingsItem icon="crown" label="Subscription Plan" color="amber" tag="PRO" />
          <SettingsItem icon="notifications_active" label="Notifications" color="red" />
          <SettingsItem icon="help_center" label="Help & Support" color="green" />
        </div>

        <button
          onClick={signOut}
          className="w-full py-4 text-red-500 font-bold bg-white dark:bg-gray-800/50 border border-red-50 border-red-900/30 rounded-xl hover:bg-red-50 transition-colors"
        >
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
      <span className="text-sm font-bold">{Math.min(progress, total)}/{total} {unit}</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min((progress / total) * 100, 100)}%` }}></div>
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
