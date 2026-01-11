import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLinkedStudents, getQuotaStatus, redeemStudentInvite } from '../services/databaseService';
import { LinkedStudent } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemDone, setRedeemDone] = useState(false);

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
    if (code && !inviteCode) {
      setInviteCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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

  const stats = useMemo(() => {
    const total = students.length;
    const avgStreak = total ? Math.round(students.reduce((a, s) => a + (s.streak ?? 0), 0) / total) : 0;
    const avgAccuracy = total
      ? Math.round(students.reduce((a, s) => a + Number(s.accuracy ?? 0), 0) / total)
      : 0;
    return { total, avgStreak, avgAccuracy };
  }, [students]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#101622] pb-20">
      <header className="p-4 flex items-center justify-between sticky top-0 z-20 bg-white/80 dark:bg-[#101622]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold">Dashboard</h2>
        <div className="size-10" />
      </header>

      <main className="p-4 space-y-6">
        <div className="bg-white dark:bg-gray-800/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link a student</p>
          <p className="text-xs text-slate-500 mt-1">Paste an invite code from a student (or scan their QR).</p>
          <div className="mt-3 flex gap-2">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code (e.g. 3FA9C0D1B2AA)"
              className="flex-1 h-11 px-3 rounded-xl bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 text-sm"
            />
            <button
              disabled={redeemLoading || !inviteCode.trim()}
              onClick={handleRedeem}
              className="h-11 px-4 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {redeemLoading ? 'Linking…' : 'Link'}
            </button>
          </div>
          {redeemError && <p className="text-xs text-red-500 mt-2">{redeemError}</p>}
          {redeemDone && !redeemError && <p className="text-xs text-emerald-500 mt-2">Linked successfully.</p>}
        </div>

        <div className="bg-white dark:bg-gray-800/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your AI quota (today)</p>
          {quota ? (
            <div className="mt-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{quota.tokens_remaining_today}</p>
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
                      quota.daily_token_limit ? (quota.tokens_used_today / quota.daily_token_limit) * 100 : 0,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-2">No quota row yet. It’s created after your first AI call.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked students</p>
              <p className="text-xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Avg streak: {stats.avgStreak} days</p>
              <p className="text-xs text-slate-500">Avg accuracy: {stats.avgAccuracy}%</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">
              No linked students yet. (Linking UI can be added next; for now, insert rows into `student_links`.)
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {students.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                >
                  <div
                    className="size-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                    style={{ backgroundImage: `url(${s.avatar_url || `https://picsum.photos/seed/${s.student_id}/100/100`})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{s.full_name || s.username || 'Student'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {s.relationship} • streak {s.streak} • accuracy {s.accuracy}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{s.points}</p>
                    <p className="text-[10px] text-slate-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around items-center z-40">
        <NavItem icon="home" label="Home" onClick={() => navigate('/stats')} />
        <NavItem icon="photo_camera" label="Scanner" onClick={() => navigate('/')} />
        <NavItem icon="history" label="History" onClick={() => navigate('/history')} />
        <NavItem icon="account_circle" label="Profile" onClick={() => navigate('/profile')} />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({
  icon,
  label,
  active,
  onClick,
}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-gray-400'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
      {icon}
    </span>
    <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
  </button>
);

export default Dashboard;
