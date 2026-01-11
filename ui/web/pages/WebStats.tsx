import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getTopicBreakdown } from '../../../services/databaseService';

const WebStats: React.FC = () => {
  const { stats, profile } = useAuth();
  const [topicData, setTopicData] = useState<{ topic: string; count: number }[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!profile?.id) return;
      const data = await getTopicBreakdown(profile.id);
      setTopicData(data.map((d: any) => ({ topic: d.topic, count: d.count })));
    };
    fetchTopics();
  }, [profile?.id]);

  const problemsSolved = stats?.problemsSolved ?? 0;
  const streak = stats?.streak ?? 0;
  const accuracy = stats?.accuracy ?? 0;
  const studyTime = stats?.studyTime ?? '0h';
  const masteredTopics = stats?.masteredTopics ?? 0;

  const totalTopics = topicData.reduce((acc, t) => acc + t.count, 0) || 1;
  const topTopics = useMemo(() => {
    return [...topicData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((t) => ({
        ...t,
        percentage: Math.round((t.count / totalTopics) * 100),
      }));
  }, [topicData, totalTopics]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Stats</h1>
        <p className="text-sm text-slate-500">Your learning progress at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Problems" value={String(problemsSolved)} icon="school" />
        <Metric label="Streak" value={`${streak} days`} icon="local_fire_department" />
        <Metric label="Accuracy" value={`${accuracy}%`} icon="verified" />
        <Metric label="Study Time" value={studyTime} icon="schedule" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject breakdown</p>
          <div className="mt-4 space-y-3">
            {topTopics.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              topTopics.map((t) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <div className="w-36 font-bold truncate">{t.topic}</div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${t.percentage}%` }} />
                  </div>
                  <div className="w-14 text-right text-sm font-black">{t.percentage}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</p>
          <div className="mt-4">
            <p className="text-4xl font-black">{masteredTopics}</p>
            <p className="text-sm text-slate-500">topics mastered</p>
            <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-4">
              <p className="text-sm font-bold text-primary">Tip</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Try a new topic in the scanner to grow your breakdown.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <p className="text-2xl font-black mt-2">{value}</p>
  </div>
);

export default WebStats;
