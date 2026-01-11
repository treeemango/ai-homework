import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Solution } from '../../../types';

export type WebHistoryProps = {
  history: Solution[];
  onSelectSolution: (sol: Solution) => void;
};

const WebHistory: React.FC<WebHistoryProps> = ({ history, onSelectSolution }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string>('All');

  const topics = useMemo(() => ['All', ...new Set(history.map((s) => s.topic))], [history]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((s) => {
      const matchesTopic = topic === 'All' ? true : s.topic === topic;
      const matchesQuery = !q
        ? true
        : [s.topic, s.subtopic, s.explanation, s.finalResult]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [history, query, topic]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">History</h1>
          <p className="text-sm text-slate-500">Review previous solutions and reopen details.</p>
        </div>
        <button
          onClick={() => navigate('/scan')}
          className="h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm"
        >
          New Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 h-fit">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</p>
          <div className="mt-2 flex items-center gap-2 h-11 bg-gray-50 dark:bg-black/20 rounded-xl px-3 border border-gray-200 dark:border-gray-700">
            <span className="material-symbols-outlined text-primary">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm flex-1"
              placeholder="Search topics or answers"
            />
          </div>

          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic</p>
          <div className="mt-2 space-y-1">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`w-full text-left px-3 h-10 rounded-xl font-bold text-sm border transition-colors ${
                  t === topic
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="font-black">Results</p>
            <p className="text-sm text-slate-500">{filtered.length}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No scans yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSolution(item);
                    navigate('/solution');
                  }}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="size-16 rounded-xl bg-cover bg-center border border-gray-200 dark:border-gray-700 shrink-0"
                      style={{ backgroundImage: `url(${item.captureUrl})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black truncate">{item.topic} • {item.subtopic}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {item.finalResult}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WebHistory;
