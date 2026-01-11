
import React, { useEffect, useState } from 'react';
import { Solution } from './types';
import { useAuth } from './context/AuthContext';
import { getSolutionHistory, saveSolution } from './services/databaseService';
import LandingPage from './pages/LandingPage';
import MobileApp from './ui/mobile/MobileApp';
import WebApp from './ui/web/WebApp';
import { useMediaQuery } from './ui/shared/useMediaQuery';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMode, setCapturedMode] = useState<string>('Homework');
  const [lastSolution, setLastSolution] = useState<Solution | null>(null);
  const [scanHistory, setScanHistory] = useState<Solution[]>([]);
  const { user, loading } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 900px)');

  // Load solution history from database on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (user?.id) {
        const history = await getSolutionHistory(user.id);
        setScanHistory(history);
      }
    };
    loadHistory();
  }, [user?.id]);

  const handleCapture = (img: string, mode: string) => {
    setCapturedImage(img);
    setCapturedMode(mode);
  };

  const handleSaveSolution = async (sol: Solution) => {
    setLastSolution(sol);
    setScanHistory(prev => [sol, ...prev]);

    // Save to database if user is logged in
    if (user?.id) {
      await saveSolution(user.id, sol);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }
  // Show landing page if user is not authenticated
  if (!user) {
    return <LandingPage />;
  }

  if (isDesktop) {
    return (
      <WebApp
        capturedImage={capturedImage}
        capturedMode={capturedMode}
        lastSolution={lastSolution}
        scanHistory={scanHistory}
        onCapture={handleCapture}
        onSaveSolution={handleSaveSolution}
        onSelectSolution={setLastSolution}
      />
    );
  }

  return (
    <MobileApp
      capturedImage={capturedImage}
      capturedMode={capturedMode}
      lastSolution={lastSolution}
      scanHistory={scanHistory}
      onCapture={handleCapture}
      onSaveSolution={handleSaveSolution}
    />
  );
};

export default App;
