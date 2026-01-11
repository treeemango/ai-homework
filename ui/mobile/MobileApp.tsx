import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CropConfirm from '../../pages/CropConfirm';
import Dashboard from '../../pages/Dashboard';
import History from '../../pages/History';
import Leaderboard from '../../pages/Leaderboard';
import Profile from '../../pages/Profile';
import Scanner from '../../pages/Scanner';
import SolutionView from '../../pages/SolutionView';
import Stats from '../../pages/Stats';
import TrophyRoom from '../../pages/TrophyRoom';
import { Solution } from '../../types';

export type MobileAppProps = {
  capturedImage: string | null;
  capturedMode: string;
  lastSolution: Solution | null;
  scanHistory: Solution[];
  onCapture: (img: string, mode: string) => void;
  onSaveSolution: (sol: Solution) => void;
};

const MobileApp: React.FC<MobileAppProps> = ({
  capturedImage,
  capturedMode,
  lastSolution,
  scanHistory,
  onCapture,
  onSaveSolution,
}) => {
  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background-light dark:bg-background-dark overflow-hidden">
      <Routes>
        <Route path="/" element={<Scanner onCapture={onCapture} />} />
        <Route
          path="/crop"
          element={<CropConfirm image={capturedImage} mode={capturedMode} onSave={onSaveSolution} />}
        />
        <Route path="/solution" element={<SolutionView solution={lastSolution} />} />
        <Route path="/history" element={<History history={scanHistory} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/trophy-room" element={<TrophyRoom />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default MobileApp;
