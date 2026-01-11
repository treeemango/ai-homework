import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAllAchievements, getUserAchievements } from '../../../services/databaseService';
import { Achievement } from '../../../types';

const WebTrophyRoom: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [all, user] = await Promise.all([getAllAchievements(), getUserAchievements(profile.id)]);
      setAllAchievements(all);
      setUnlockedIds(new Set(user.map((ua: any) => ua.achievements?.id).filter(Boolean)));
      setLoading(false);
    };
    run();
  }, [profile?.id]);

  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements.length || 0;
  const points = profile?.points || 0;
  const nextLevel = Math.ceil(points / 500) * 500;
  const progressPct = nextLevel ? Math.min(100, Math.round(((points % 500) / 500) * 100)) : 0;

  const recentUnlocks = useMemo(() => {
    return allAchievements.filter((a) => unlockedIds.has(a.id)).slice(0, 6);
  }, [allAchievements, unlockedIds]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Trophy Room</h1>
          <p className="text-sm text-slate-500">Badges and progress.</p>
        </div>
        <button
          onClick={() => navigate('/leaderboard')}
          className="h-10 px-4 rounded-xl bg-primary text-white font-black text-sm"
        >
          Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badges</p>
              <p className="text-2xl font-black mt-1">{unlockedCount}/{totalCount}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP</p>
              <p className="text-xl font-black text-primary">{points}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Next level</span>
              <span>{points} / {nextLevel}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : allAchievements.length === 0 ? (
            <p className="text-sm text-slate-500 mt-6">No achievements available.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {allAchievements.map((a) => {
                const unlocked = unlockedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border p-4 flex items-center gap-3 ${
                      unlocked
                        ? 'border-amber-300/40 dark:border-amber-400/25 bg-amber-50/60 dark:bg-amber-950/10'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 opacity-70'
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center ${
                        unlocked ? 'bg-amber-400 text-[#221e10]' : 'bg-gray-200 dark:bg-gray-700 text-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined fill-1">{unlocked ? a.icon : 'lock'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{a.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{a.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent unlocks</p>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : recentUnlocks.length === 0 ? (
            <p className="text-sm text-slate-500 mt-4">No achievements unlocked yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentUnlocks.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 p-4"
                >
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill-1">{a.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 truncate">Unlocked</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WebTrophyRoom;
