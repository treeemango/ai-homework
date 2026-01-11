import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import CropConfirm from '../../pages/CropConfirm';
import Scanner from '../../pages/Scanner';
import SolutionView from '../../pages/SolutionView';
import { Solution } from '../../types';
import WebShell from './layouts/WebShell';
import WebDashboard from './pages/WebDashboard';
import WebHistory from './pages/WebHistory';
import WebLeaderboard from './pages/WebLeaderboard';
import WebProfile from './pages/WebProfile';
import WebStats from './pages/WebStats';
import WebTrophyRoom from './pages/WebTrophyRoom';

export type WebAppProps = {
  capturedImage: string | null;
  capturedMode: string;
  lastSolution: Solution | null;
  scanHistory: Solution[];
  onCapture: (img: string, mode: string) => void;
  onSaveSolution: (sol: Solution) => void;
  onSelectSolution: (sol: Solution) => void;
};

const WebApp: React.FC<WebAppProps> = ({
  capturedImage,
  capturedMode,
  lastSolution,
  scanHistory,
  onCapture,
  onSaveSolution,
  onSelectSolution,
}) => {
  return (
    <Routes>
      <Route element={<WebShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<WebDashboard />} />
        <Route path="/history" element={<WebHistory history={scanHistory} onSelectSolution={onSelectSolution} />} />
        <Route path="/stats" element={<WebStats />} />

        {/* Pages we can reuse for now */}
        <Route path="/scan" element={<Scanner onCapture={onCapture} />} />
        <Route path="/crop" element={<CropConfirm image={capturedImage} mode={capturedMode} onSave={onSaveSolution} />} />
        <Route path="/solution" element={<SolutionView solution={lastSolution} />} />
        <Route path="/profile" element={<WebProfile />} />
        <Route path="/leaderboard" element={<WebLeaderboard />} />
        <Route path="/trophy-room" element={<WebTrophyRoom />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default WebApp;
