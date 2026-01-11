
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { LeaderboardEntry } from '../types';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'friends' | 'global'>('global');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await getLeaderboard(20);
      setLeaders(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const userRank = leaders.find(l => l.id === profile?.id);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#101622] pb-32">
      <header className="p-4 flex items-center justify-between sticky top-0 z-20 bg-background-light dark:bg-[#101622] border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold">Leaderboard</h2>
        <button className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <div className="px-4 py-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex relative">
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2 text-sm font-bold rounded-full ${tab === 'friends' ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
          >
            Friends
          </button>
          <button
            onClick={() => setTab('global')}
            className={`flex-1 py-2 text-sm font-medium ${tab === 'global' ? 'bg-white dark:bg-primary rounded-full shadow-sm' : 'text-gray-500'}`}
          >
            Global
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      ) : (
        <>
          <div className="flex justify-center items-end gap-2 px-6 pt-12 pb-6 bg-gradient-to-b from-primary/10 to-transparent">
            {top3[1] && <Top3 rank={2} name={top3[1].username || 'User'} pts={String(top3[1].points)} color="silver" avatar={top3[1].avatar_url || `https://picsum.photos/seed/${top3[1].id}/150/150`} />}
            {top3[0] && <Top3 rank={1} name={top3[0].username || 'User'} pts={String(top3[0].points)} color="gold" featured avatar={top3[0].avatar_url || `https://picsum.photos/seed/${top3[0].id}/200/200`} />}
            {top3[2] && <Top3 rank={3} name={top3[2].username || 'User'} pts={String(top3[2].points)} color="bronze" avatar={top3[2].avatar_url || `https://picsum.photos/seed/${top3[2].id}/150/150`} />}
          </div>

          <div className="flex-1 bg-white dark:bg-[#101622] rounded-t-[2.5rem] mt-[-20px] z-10 px-6 pt-8 pb-32 space-y-4">
            {rest.map(leader => (
              <ListItem
                key={leader.id}
                rank={leader.rank}
                name={leader.username || 'Anonymous'}
                streak={`${leader.streak} days`}
                pts={String(leader.points)}
                active={leader.id === profile?.id}
                avatar={leader.avatar_url}
              />
            ))}
            {rest.length === 0 && (
              <p className="text-center text-gray-400 py-10">No other players yet</p>
            )}
          </div>
        </>
      )}

      {userRank && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 z-30">
          <div className="bg-primary text-white rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase opacity-80">Rank</p>
              <p className="text-xl font-bold">#{userRank.rank}</p>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="flex-1">
              <p className="text-sm font-bold">Keep it up, {profile?.username || 'Student'}!</p>
              <p className="text-[10px] opacity-80">
                {userRank.rank > 1 ? `${leaders[userRank.rank - 2]?.points - userRank.points} pts to reach #${userRank.rank - 1}` : 'You are #1!'}
              </p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold text-sm">
              {userRank.points} <span className="material-symbols-outlined text-xs fill-1">auto_awesome</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Top3: React.FC<{ rank: number, name: string, pts: string, color: 'gold' | 'silver' | 'bronze', avatar: string, featured?: boolean }> = ({ rank, name, pts, color, avatar, featured }) => {
  const colors = {
    gold: 'border-amber-400 text-amber-500',
    silver: 'border-gray-300 text-gray-400',
    bronze: 'border-orange-400 text-orange-500',
  };
  return (
    <div className={`flex flex-col items-center flex-1 ${featured ? 'z-10 -translate-y-4 scale-110' : ''}`}>
      <div className="relative mb-2">
        <div className={`rounded-full bg-cover bg-center border-2 ${featured ? 'size-20 border-4' : 'size-16 opacity-90'} ${colors[color]}`} style={{ backgroundImage: `url(${avatar})` }}></div>
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-white dark:border-[#101622] bg-current`}>
          <span className="text-white">{rank}</span>
        </div>
        {featured && <span className="absolute -top-10 left-1/2 -translate-x-1/2 material-symbols-outlined text-3xl text-amber-500 fill-1">workspace_premium</span>}
      </div>
      <p className="text-[10px] font-bold truncate w-full text-center">{name}</p>
      <p className="text-[10px] text-primary font-black uppercase tracking-widest">{pts} pts</p>
      <div className={`w-full bg-white dark:bg-gray-800 rounded-t-xl mt-2 border-x border-t flex items-end justify-center pb-2 opacity-10 ${featured ? 'h-24' : rank === 2 ? 'h-16' : 'h-12'}`}>
        <span className="material-symbols-outlined">emoji_events</span>
      </div>
    </div>
  );
};

const ListItem: React.FC<{ rank: number, name: string, streak?: string, accuracy?: string, pts: string, active?: boolean, avatar?: string }> = ({ rank, name, streak, accuracy, pts, active, avatar }) => (
  <div className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${active ? 'bg-primary/10 border border-primary/20 ring-1 ring-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
    <span className={`w-6 text-sm font-black ${active ? 'text-primary' : 'text-gray-300'}`}>{rank}</span>
    <div className="relative">
      <div className={`size-10 rounded-full bg-cover bg-center ${active ? 'border-2 border-primary shadow-sm' : 'border border-gray-100 dark:border-gray-800'}`} style={{ backgroundImage: `url(${avatar || `https://picsum.photos/seed/${name}/100/100`})` }}></div>
      {active && <div className="absolute -top-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-white dark:ring-[#101622]"><span className="material-symbols-outlined text-[10px] block">person</span></div>}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold truncate">
        {name} {active && <span className="text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded ml-1 uppercase">You</span>}
      </p>
      <p className="text-[10px] text-gray-400 font-medium">
        {streak ? `Streak: ${streak}` : accuracy ? `Accuracy: ${accuracy}` : ''}
      </p>
    </div>
    <div className="flex items-center gap-1 font-bold">
      <span className={active ? 'text-primary' : ''}>{pts}</span>
      <span className={`material-symbols-outlined text-xs fill-1 ${active ? 'text-primary' : 'text-gray-300'}`}>auto_awesome</span>
    </div>
  </div>
);

export default Leaderboard;
