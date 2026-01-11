import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../../context/AuthContext';
import {
  createStudentInvite,
  getAllAchievements,
  getUserAchievements,
  updateDifficultyLevel,
} from '../../../services/databaseService';
import { Achievement } from '../../../types';

const WebProfile: React.FC = () => {
  const { profile, stats, signOut, refreshProfile } = useAuth();

  const [difficulty, setDifficulty] = useState<'easy' | 'standard' | 'challenge'>('standard');
  const [invite, setInvite] = useState<{ code: string; expires_at: string; relationship: 'parent' | 'teacher' } | null>(
    null,
  );
  const [inviteQr, setInviteQr] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.difficulty_level) setDifficulty(profile.difficulty_level);
  }, [profile?.difficulty_level]);

  useEffect(() => {
    const run = async () => {
      if (!profile?.id) return;
      const [all, user] = await Promise.all([getAllAchievements(), getUserAchievements(profile.id)]);
      setAchievements(all);
      setUnlockedIds(new Set(user.map((ua: any) => ua.achievements?.id).filter(Boolean)));
    };
    run();
  }, [profile?.id]);

  const displayName = profile?.full_name || profile?.username || 'Student';
  const avatarUrl =
    profile?.avatar_url || `https://picsum.photos/seed/${profile?.id || 'default'}/300/300`;

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'Unknown';
    return new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [profile?.created_at]);

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
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Profile</h1>
          <p className="text-sm text-slate-500">Account, difficulty, invites, and achievements.</p>
        </div>
        <button
          onClick={signOut}
          className="h-10 px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-black text-sm hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="size-20 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
            />
            <div className="min-w-0">
              <p className="text-xl font-black truncate">{displayName}</p>
              <p className="text-sm text-primary font-bold">{stats?.problemsSolved || 0} problems solved</p>
              <p className="text-xs text-slate-500 mt-1">Member since {memberSince}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <MiniStat label="Points" value={String(profile?.points ?? 0)} icon="auto_awesome" />
            <MiniStat label="Streak" value={`${stats?.streak ?? 0}d`} icon="local_fire_department" />
            <MiniStat label="Accuracy" value={`${stats?.accuracy ?? 0}%`} icon="verified" />
            <MiniStat label="Study" value={stats?.studyTime ?? '0h'} icon="schedule" />
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</p>
            <p className="text-sm text-slate-500 mt-1">Used to tailor explanations.</p>
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
                  className={`h-10 rounded-xl text-xs font-black border transition-colors ${
                    difficulty === opt.key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite parent/teacher</p>
            <p className="text-sm text-slate-500 mt-1">Generate a one-time code to link your account.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={inviteLoading}
                onClick={() => handleCreateInvite('parent')}
                className="h-10 px-4 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50"
              >
                {inviteLoading ? 'Generating…' : 'Parent code'}
              </button>
              <button
                disabled={inviteLoading}
                onClick={() => handleCreateInvite('teacher')}
                className="h-10 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-[#0d121c] dark:text-white font-black text-sm disabled:opacity-50"
              >
                {inviteLoading ? 'Generating…' : 'Teacher code'}
              </button>
            </div>

            {invite && (
              <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite code</p>
                    <p className="text-2xl font-black tracking-widest mt-1">{invite.code}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      for {invite.relationship} • expires {new Date(invite.expires_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(invite.code)}
                    className="h-10 px-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 text-xs font-black"
                  >
                    Copy
                  </button>
                </div>

                {inviteQr && (
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src={inviteQr}
                      alt="Invite QR"
                      className="rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <p className="font-black">Share QR</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Scanning opens Dashboard with the code prefilled.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievements</p>
                <p className="text-sm text-slate-500 mt-1">
                  Unlocked {unlockedIds.size} / {achievements.length || 0}
                </p>
              </div>
            </div>

            {achievements.length === 0 ? (
              <p className="text-sm text-slate-500 mt-4">No achievements available.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {achievements.slice(0, 8).map((a) => {
                  const unlocked = unlockedIds.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`rounded-2xl border p-4 flex items-center gap-3 ${
                        unlocked
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 opacity-70'
                      }`}
                    >
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center ${
                          unlocked ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-slate-500'
                        }`}
                      >
                        <span className="material-symbols-outlined">{unlocked ? a.icon : 'lock'}</span>
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
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 p-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <p className="text-xl font-black mt-2">{value}</p>
  </div>
);

export default WebProfile;
