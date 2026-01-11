
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAchievements, getAllAchievements } from '../services/databaseService';
import { Achievement } from '../types';

const TrophyRoom: React.FC = () => {
  const navigate = useNavigate();
  const { profile, stats } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (profile?.id) {
        const [all, user] = await Promise.all([
          getAllAchievements(),
          getUserAchievements(profile.id)
        ]);
        setAllAchievements(all);
        setUnlockedIds(user.map((ua: any) => ua.achievements?.id || ''));
      }
      setLoading(false);
    };
    fetchData();
  }, [profile?.id]);

  const unlockedCount = unlockedIds.length;
  const totalCount = allAchievements.length || 40;
  const points = profile?.points || 0;
  const nextLevel = Math.ceil(points / 500) * 500;
  const progress = totalCount > 0 ? (points % 500) / 5 : 0;

  const recentUnlocks = allAchievements
    .filter(a => unlockedIds.includes(a.id))
    .slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen bg-[#221e10] text-white pb-32">
      <header className="p-4 flex items-center justify-between sticky top-0 z-50 bg-[#221e10]/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="size-12 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
        </button>
        <h2 className="text-xl font-bold">Trophy Room</h2>
        <button className="size-12 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">info</span>
        </button>
      </header>

      <main className="p-4 space-y-8">
        <div className="rounded-2xl shadow-xl bg-[#342d18] border border-amber-400/20 overflow-hidden">
          <div
            className="w-full aspect-[16/7] bg-cover bg-center relative"
            style={{ backgroundImage: `linear-gradient(to bottom, transparent, #342d18), url(https://picsum.photos/seed/trophy/800/400)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-amber-400/20 backdrop-blur-md px-6 py-2 rounded-full border border-amber-400/40">
                <span className="text-amber-400 font-black text-xs tracking-widest uppercase">
                  Rank: {points >= 1000 ? 'Gold Scholar' : points >= 500 ? 'Silver Scholar' : 'Bronze Scholar'}
                </span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-2xl font-black">{unlockedCount}/{totalCount} Badges</p>
              {unlockedCount > totalCount * 0.25 && (
                <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                  TOP {Math.round((1 - unlockedCount / totalCount) * 100)}%
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-200/50">
                <span>Points to Next Level</span>
                <span>{points} / {nextLevel} XP</span>
              </div>
              <div className="h-3 bg-amber-900/40 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] italic text-amber-200/50">{nextLevel - points} XP to next level</p>
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-6 h-10 bg-amber-400 text-[#221e10] rounded-full font-bold text-sm active:scale-95 transition-transform"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Academic Achievements</h3>
            <span className="text-amber-400 text-xs font-bold underline underline-offset-4">View All</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {allAchievements.slice(0, 6).map(achievement => (
              <AchievementBadge
                key={achievement.id}
                icon={achievement.icon}
                label={achievement.name}
                unlocked={unlockedIds.includes(achievement.id)}
              />
            ))}
            {allAchievements.length === 0 && !loading && (
              <p className="col-span-3 text-center text-amber-200/50">No achievements available</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Recent Unlocks</h3>
          <div className="space-y-3">
            {recentUnlocks.map(achievement => (
              <RecentCard
                key={achievement.id}
                icon={achievement.icon}
                title={achievement.name}
                date="Recently"
              />
            ))}
            {recentUnlocks.length === 0 && (
              <p className="text-center text-amber-200/50 py-4">No achievements unlocked yet</p>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[#221e10]/90 backdrop-blur-xl border-t border-amber-400/10 flex justify-around items-center h-20 px-6 max-w-md mx-auto z-50">
        <NavItem icon="home" label="Home" onClick={() => navigate('/stats')} />
        <NavItem icon="camera" label="Scan" onClick={() => navigate('/')} />
        <NavItem icon="military_tech" label="Awards" active />
        <NavItem icon="person" label="Profile" onClick={() => navigate('/profile')} />
      </div>
    </div>
  );
};

const AchievementBadge: React.FC<{ icon: string, label: string, unlocked?: boolean }> = ({ icon, label, unlocked }) => (
  <div className={`flex flex-col items-center gap-2 group transition-all ${unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}>
    <div className={`hexagon p-1 w-full aspect-square flex items-center justify-center border-2 ${unlocked ? 'bg-amber-400/20 border-amber-400/30 shadow-lg shadow-amber-400/20' : 'bg-gray-700/50 border-gray-600'}`}>
      <div className={`hexagon w-full h-full flex items-center justify-center ${unlocked ? 'bg-amber-400 text-[#221e10]' : 'bg-gray-600 text-gray-400'}`}>
        <span className="material-symbols-outlined text-4xl fill-1">{unlocked ? icon : 'lock'}</span>
      </div>
    </div>
    <p className="text-[10px] font-black text-center leading-tight uppercase tracking-wider">{label}</p>
  </div>
);

const RecentCard: React.FC<{ icon: string, title: string, date: string }> = ({ icon, title, date }) => (
  <div className="flex items-center gap-4 bg-[#342d18] p-4 rounded-xl border border-amber-400/10">
    <div className="size-12 bg-amber-400 rounded-lg flex items-center justify-center shadow-inner">
      <span className="material-symbols-outlined text-[#221e10] fill-1">{icon}</span>
    </div>
    <div className="flex-1">
      <p className="font-bold text-sm">{title}</p>
      <p className="text-amber-200/50 text-[10px] font-medium tracking-wide">Unlocked {date}</p>
    </div>
    <span className="material-symbols-outlined text-amber-400 fill-1">verified</span>
  </div>
);

const NavItem: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-amber-400' : 'text-gray-500'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
  </button>
);

export default TrophyRoom;
