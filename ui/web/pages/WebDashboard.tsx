import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getLinkedStudents, getQuotaStatus, redeemStudentInvite } from '../../../services/databaseService';
import { LinkedStudent } from '../../../types';

const WebDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, stats: userStats } = useAuth();

  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [inviteCode, setInviteCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemDone, setRedeemDone] = useState(false);

  const displayName = profile?.full_name?.split(' ')[0] || profile?.username || 'there';

  useEffect(() => {
    const run = async () => {
      if (!profile?.id) return;
      setLoading(true);
      const [linked, quotaStatus] = await Promise.all([
        getLinkedStudents(profile.id),
        getQuotaStatus(profile.id),
      ]);
      setStudents(linked);
      setQuota(quotaStatus);
      setLoading(false);
    };
    run();
  }, [profile?.id]);

  // Prefill code from URL: #/dashboard?code=XXXX
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code && !inviteCode) setInviteCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const stats = useMemo(() => {
    const total = students.length;
    const avgStreak = total ? Math.round(students.reduce((a, s) => a + (s.streak ?? 0), 0) / total) : 0;
    const avgAccuracy = total
      ? Math.round(students.reduce((a, s) => a + Number(s.accuracy ?? 0), 0) / total)
      : 0;
    return { total, avgStreak, avgAccuracy };
  }, [students]);

  const handleRedeem = async () => {
    if (!profile?.id) return;
    const code = inviteCode.trim();
    if (!code) return;
    setRedeemError(null);
    setRedeemLoading(true);
    try {
      await redeemStudentInvite(code);
      setRedeemDone(true);
      const linked = await getLinkedStudents(profile.id);
      setStudents(linked);
    } catch (e: any) {
      setRedeemError(e?.message ?? 'Failed to redeem invite');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Hey {displayName}! 👋</h1>
            <p className="text-white/80 mt-1">Ready to solve some problems today?</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">local_fire_department</span>
                <span className="font-bold">{userStats?.streak || profile?.streak || 0} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span className="font-bold">{userStats?.problemsSolved || 0} solved</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/scan')}
            className="h-12 px-6 rounded-xl bg-white text-purple-600 font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
          >
            Open Scanner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link a student</p>
          <p className="text-sm text-slate-500 mt-1">Paste an invite code from a student.</p>

          <div className="mt-4 flex gap-2">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code (e.g. 3FA9C0D1B2AA)"
              className="flex-1 h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-sm"
            />
            <button
              disabled={redeemLoading || !inviteCode.trim()}
              onClick={handleRedeem}
              className="h-11 px-4 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50"
            >
              {redeemLoading ? 'Linking…' : 'Link'}
            </button>
          </div>
          {redeemError && <p className="text-sm text-red-500 mt-2">{redeemError}</p>}
          {redeemDone && !redeemError && <p className="text-sm text-emerald-500 mt-2">Linked successfully.</p>}
        </div>

        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI quota (today)</p>
          {quota ? (
            <div className="mt-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black">{quota.tokens_remaining_today}</p>
                  <p className="text-xs text-slate-500">tokens remaining</p>
                </div>
                <p className="text-xs text-slate-500">
                  used {quota.tokens_used_today} / {quota.daily_token_limit}
                </p>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      quota.daily_token_limit
                        ? (quota.tokens_used_today / quota.daily_token_limit) * 100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-3">No quota row yet. It’s created after your first AI call.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked students</p>
            <p className="text-2xl font-black mt-1">{stats.total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Avg streak: {stats.avgStreak} days</p>
            <p className="text-sm text-slate-500">Avg accuracy: {stats.avgAccuracy}%</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">No linked students yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2">Student</th>
                  <th className="py-2">Relationship</th>
                  <th className="py-2">Streak</th>
                  <th className="py-2">Accuracy</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-9 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                          style={{
                            backgroundImage: `url(${s.avatar_url || `https://picsum.photos/seed/${s.student_id}/80/80`})`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{s.full_name || s.username || 'Student'}</p>
                          <p className="text-xs text-slate-500 truncate">{s.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 capitalize">{s.relationship}</td>
                    <td className="py-3">{s.streak ?? 0} days</td>
                    <td className="py-3">{s.accuracy ?? 0}%</td>
                    <td className="py-3 text-right font-black">{s.points ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebDashboard;
