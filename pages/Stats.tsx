
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTopicBreakdown } from '../services/databaseService';

const Stats: React.FC = () => {
  const navigate = useNavigate();
  const { stats, profile, loading } = useAuth();
  const [topicData, setTopicData] = useState<{ topic: string, count: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState([60, 45, 30, 55, 75, 95, 40]); // Will be fetched later

  useEffect(() => {
    const fetchTopics = async () => {
      if (profile?.id) {
        const data = await getTopicBreakdown(profile.id);
        setTopicData(data.map((d: any) => ({ topic: d.topic, count: d.count })));
      }
    };
    fetchTopics();
  }, [profile?.id]);

  const problemsSolved = stats?.problemsSolved ?? 0;
  const streak = stats?.streak ?? 0;
  const accuracy = stats?.accuracy ?? 0;
  const studyTime = stats?.studyTime ?? '0h';
  const masteredTopics = stats?.masteredTopics ?? 0;

  // Calculate topic percentages
  const totalTopics = topicData.reduce((acc, t) => acc + t.count, 0) || 1;
  const topicPercentages = topicData.map(t => ({
    ...t,
    percentage: Math.round((t.count / totalTopics) * 100)
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#101622] pb-20">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#101622]/80 backdrop-blur-md">
        <div className="size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">account_circle</span>
        </div>
        <h2 className="text-lg font-bold">Study Statistics</h2>
        <button onClick={() => navigate('/trophy-room')} className="size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">military_tech</span>
        </button>
      </header>

      <main className="p-4 space-y-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
            <span className="material-symbols-outlined fill-1">local_fire_department</span>
          </div>
          <div className="flex-1">
            <p className="text-orange-900 dark:text-orange-200 text-xs font-medium uppercase tracking-wider">Current Streak</p>
            <p className="text-orange-600 dark:text-orange-400 text-2xl font-bold">{streak} Days</p>
          </div>
          {streak >= 7 && <div className="bg-white/50 px-3 py-1 rounded-full text-[10px] font-bold text-orange-700">+FIRE</div>}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-gray-500 text-sm font-medium">Problems Solved</p>
              <h3 className="text-3xl font-bold">{problemsSolved}</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weekly View</span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-32">
            {weeklyData.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className={`w-full rounded-t-sm relative transition-all duration-1000 ${i === 5 ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary/20'}`}
                  style={{ height: `${h}%` }}
                >
                  {i !== 5 && <div className="absolute inset-x-0 top-0 h-1 bg-primary rounded-t-sm"></div>}
                </div>
                <p className={`text-[10px] font-bold ${i === 5 ? 'text-primary' : 'text-gray-400'}`}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">Key Metrics</h2>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard icon="school" label="Mastered" value={String(masteredTopics)} color="blue" />
            <MetricCard icon="schedule" label="Study Time" value={studyTime} color="purple" />
            <MetricCard icon="verified" label="Accuracy" value={`${accuracy}%`} color="emerald" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">Subject Breakdown</h2>
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-6 flex items-center gap-8">
            <div className="relative size-32">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {topicPercentages.length > 0 ? (
                  topicPercentages.map((t, i) => {
                    const offset = topicPercentages.slice(0, i).reduce((acc, p) => acc + p.percentage, 0);
                    const colors = ['stroke-primary', 'stroke-emerald-500', 'stroke-amber-500', 'stroke-purple-500'];
                    return (
                      <circle key={t.topic} cx="18" cy="18" r="16" fill="none" className={colors[i % colors.length]} strokeWidth="4" strokeDasharray={`${t.percentage} 100`} strokeDashoffset={`-${offset}`} />
                    );
                  })
                ) : (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-300" strokeWidth="4" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 font-bold">Total</span>
                <span className="text-lg font-bold">100%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {topicPercentages.length > 0 ? topicPercentages.slice(0, 3).map((t, i) => {
                const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500'];
                return <LegendItem key={t.topic} color={colors[i % colors.length]} label={t.topic} value={`${t.percentage}%`} />;
              }) : (
                <p className="text-gray-400 text-sm">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around items-center z-40">
        <NavItem icon="home" label="Home" active />
        <NavItem icon="photo_camera" label="Scanner" onClick={() => navigate('/')} />
        <NavItem icon="history" label="History" onClick={() => navigate('/history')} />
        <NavItem icon="account_circle" label="Profile" onClick={() => navigate('/profile')} />
      </nav>
    </div>
  );
};

const MetricCard: React.FC<{ icon: string, label: string, value: string, color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
  };
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-3 border ${colors[color]}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-80">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string, label: string, value: string }> = ({ color, label, value }) => (
  <div className="flex items-center gap-2">
    <div className={`size-3 rounded-full ${color}`}></div>
    <div className="flex-1 flex justify-between text-sm font-medium">
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  </div>
);

const NavItem: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-gray-400'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
  </button>
);

export default Stats;
