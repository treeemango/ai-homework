
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solveProblem } from '../services/geminiService';
import { Solution } from '../types';

interface CropConfirmProps {
  image: string | null;
  onSave: (sol: Solution) => void;
}

const CropConfirm: React.FC<CropConfirmProps> = ({ image, onSave }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!image) {
    navigate('/');
    return null;
  }

  const handleScan = async () => {
    setLoading(true);
    try {
      const result = await solveProblem(image, 'Math');
      const sol: Solution = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        captureUrl: image,
        timestamp: new Date().toISOString()
      };
      onSave(sol);
      navigate('/solution');
    } catch (err) {
      console.error(err);
      alert("Failed to solve problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 justify-between sticky top-0 bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center text-[#0d121c] dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Crop and Confirm</h2>
      </header>

      <main className="flex-1 flex flex-col items-center p-6">
        <p className="text-sm font-medium mb-4 text-center text-slate-500">
          Adjust corners to focus on the math problem
        </p>

        <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-800">
          <img src={image} className="w-full h-full object-cover" alt="Captured" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-4/5 h-1/2 crop-overlay border-2 border-primary/80 pointer-events-auto">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-b border-white/20"></div>
              </div>
              <div className="absolute -top-1 -left-1 size-6 border-t-4 border-l-4 border-primary rounded-tl-sm"></div>
              <div className="absolute -top-1 -right-1 size-6 border-t-4 border-r-4 border-primary rounded-tr-sm"></div>
              <div className="absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-primary rounded-bl-sm"></div>
              <div className="absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-primary rounded-br-sm"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-3">
          <button 
            disabled={loading}
            onClick={handleScan}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined">refresh</span>
            ) : (
              <span className="material-symbols-outlined">search_check</span>
            )}
            <span>{loading ? 'Solving...' : 'Scan Now'}</span>
          </button>
          <button 
            disabled={loading}
            onClick={() => navigate(-1)}
            className="w-full h-14 bg-gray-200 dark:bg-gray-800 text-[#0d121c] dark:text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            <span>Retake</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default CropConfirm;
