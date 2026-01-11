
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Scanner from './pages/Scanner';
import CropConfirm from './pages/CropConfirm';
import SolutionView from './pages/SolutionView';
import History from './pages/History';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import Leaderboard from './pages/Leaderboard';
import TrophyRoom from './pages/TrophyRoom';
import { Solution } from './types';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lastSolution, setLastSolution] = useState<Solution | null>(null);
  const [scanHistory, setScanHistory] = useState<Solution[]>([]);

  const handleCapture = (img: string) => {
    setCapturedImage(img);
  };

  const handleSaveSolution = (sol: Solution) => {
    setLastSolution(sol);
    setScanHistory(prev => [sol, ...prev]);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background-light dark:bg-background-dark overflow-hidden">
      <Routes>
        <Route path="/" element={<Scanner onCapture={handleCapture} />} />
        <Route path="/crop" element={<CropConfirm image={capturedImage} onSave={handleSaveSolution} />} />
        <Route path="/solution" element={<SolutionView solution={lastSolution} />} />
        <Route path="/history" element={<History history={scanHistory} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/trophy-room" element={<TrophyRoom />} />
      </Routes>
    </div>
  );
};

export default App;
