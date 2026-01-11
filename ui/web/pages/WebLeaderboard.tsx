import React, { useEffect, useMemo, useState } from 'react';
import { getLeaderboard } from '../../../services/databaseService';
import { useAuth } from '../../../context/AuthContext';
import { LeaderboardEntry } from '../../../types';

const WebLeaderboard: React.FC = () => {
  const { profile } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const data = await getLeaderboard(50);
      setLeaders(data);
      setLoading(false);
    };
    run();
  }, []);

  const top3 = useMemo(() => leaders.slice(0, 3), [leaders]);
  const rest = useMemo(() => leaders.slice(3), [leaders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Leaderboard</h1>
        <p className="text-sm text-slate-500">Top students by points.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((l, i) => (
              <div
                key={l.id}
                className={`rounded-2xl border p-5 bg-white dark:bg-white/5 ${
                  i === 0
                    ? 'border-amber-300/50 dark:border-amber-400/30'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</p>
                  <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                    #{l.rank}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="size-12 rounded-2xl bg-cover bg-center border border-gray-200 dark:border-gray-700"
                    style={{ backgroundImage: `url(${l.avatar_url || `https://picsum.photos/seed/${l.id}/100/100`})` }}
                  />
                  <div className="min-w-0">
                    <p className="font-black truncate">
                      {l.username || 'User'}
                      {l.id === profile?.id && (
                        <span className="ml-2 text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">Streak: {l.streak} • Acc: {l.accuracy}%</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points</p>
                    <p className="text-3xl font-black text-primary">{l.points}</p>
                  </div>
                  <span className="material-symbols-outlined text-amber-400 text-3xl fill-1">
                    {i === 0 ? 'workspace_premium' : 'emoji_events'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="font-black">All ranks</p>
              <p className="text-sm text-slate-500">{leaders.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Streak</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((l) => (
                    <tr
                      key={l.id}
                      className={`border-t border-gray-100 dark:border-gray-800 ${
                        l.id === profile?.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-black">#{l.rank}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-8 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                            style={{
                              backgroundImage: `url(${l.avatar_url || `https://picsum.photos/seed/${l.id}/80/80`})`,
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold truncate">
                              {l.username || 'User'}
                              {l.id === profile?.id && (
                                <span className="ml-2 text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{l.streak} days</td>
                      <td className="py-3 px-4">{l.accuracy}%</td>
                      <td className="py-3 px-4 text-right font-black">{l.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebLeaderboard;
