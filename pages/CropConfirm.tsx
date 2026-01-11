
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { solveProblem } from '../services/geminiService';
import { Solution } from '../types';
import { useAuth } from '../context/AuthContext';

interface CropConfirmProps {
  image: string | null;
  mode: string;
  onSave: (sol: Solution) => void;
}

const CropConfirm: React.FC<CropConfirmProps> = ({ image, mode, onSave }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Crop box state (percentages of container size)
  const [box, setBox] = useState({ top: 25, left: 10, width: 80, height: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ type: string; startX: number; startY: number; startBox: typeof box } | null>(null);

  useEffect(() => {
    if (!image) {
      navigate('/');
    }
  }, [image, navigate]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: string) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragInfo.current = {
      type,
      startX: clientX,
      startY: clientY,
      startBox: { ...box }
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!dragInfo.current || !containerRef.current) return;

      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((currentX - dragInfo.current.startX) / rect.width) * 100;
      const deltaY = ((currentY - dragInfo.current.startY) / rect.height) * 100;

      setBox(prev => {
        const next = { ...prev };
        const { type, startBox } = dragInfo.current!;

        if (type === 'move') {
          next.left = Math.max(0, Math.min(100 - prev.width, startBox.left + deltaX));
          next.top = Math.max(0, Math.min(100 - prev.height, startBox.top + deltaY));
        } else {
          // Resize logic
          if (type.includes('right')) {
            next.width = Math.max(10, Math.min(100 - prev.left, startBox.width + deltaX));
          }
          if (type.includes('left')) {
            const potentialWidth = Math.max(10, startBox.width - deltaX);
            const actualDeltaX = startBox.width - potentialWidth;
            if (startBox.left + actualDeltaX >= 0) {
              next.left = startBox.left + actualDeltaX;
              next.width = potentialWidth;
            }
          }
          if (type.includes('bottom')) {
            next.height = Math.max(10, Math.min(100 - prev.top, startBox.height + deltaY));
          }
          if (type.includes('top')) {
            const potentialHeight = Math.max(10, startBox.height - deltaY);
            const actualDeltaY = startBox.height - potentialHeight;
            if (startBox.top + actualDeltaY >= 0) {
              next.top = startBox.top + actualDeltaY;
              next.height = potentialHeight;
            }
          }
        }
        return next;
      });
    };

    const handleEnd = () => {
      dragInfo.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const difficulty = profile?.difficulty_level ?? 'standard';

      // In a real app, we would crop the image here based on 'box'
      // For this demo, we'll pass the whole image as before, but the UI reflects user choice
      const result = await solveProblem(image, mode, difficulty);
      const sol: Solution = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        captureUrl: image,
        timestamp: new Date().toISOString()
      };
      onSave(sol);
      navigate('/solution');
    } catch (err) {
      const anyErr = err as any;
      if (anyErr?.name === 'QuotaError' || anyErr?.status === 429) {
        console.warn(anyErr);
      } else {
        console.error(err);
      }
      if (anyErr?.name === 'QuotaError' || anyErr?.status === 429) {
        const retry = anyErr?.details?.retry_after_seconds;
        const remaining = anyErr?.details?.remaining_tokens;
        const extra =
          retry != null
            ? `\n\nTry again in about ${retry}s.`
            : remaining != null
              ? `\n\nRemaining tokens: ${remaining}.`
              : '';
        alert(`Quota exceeded (too many requests).${extra}`);
      } else {
        alert(anyErr?.message || "Failed to solve problem. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!image) return null;

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 justify-between sticky top-0 bg-white/50 dark:bg-black/20 backdrop-blur-md z-30">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center text-[#0d121c] dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 tracking-tight">Crop and Confirm</h2>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        <p className="text-sm font-medium mb-6 text-center text-slate-500 max-w-xs leading-relaxed">
          Drag corners or edges to focus on the problem for better results.
        </p>

        <div
          ref={containerRef}
          className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-black group"
        >
          <img
            src={image}
            className="w-full h-full object-contain pointer-events-none select-none opacity-90"
            alt="Captured content"
          />

          {/* Draggable Crop Box */}
          <div
            className="absolute crop-overlay border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move touch-none"
            style={{
              top: `${box.top}%`,
              left: `${box.left}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            onMouseDown={(e) => handleDragStart(e, 'move')}
            onTouchStart={(e) => handleDragStart(e, 'move')}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
            </div>

            {/* Resize Handles - Corners */}
            <div
              className="absolute -top-2 -left-2 size-6 border-t-4 border-l-4 border-primary rounded-tl-sm cursor-nw-resize z-10"
              onMouseDown={(e) => handleDragStart(e, 'top-left')}
              onTouchStart={(e) => handleDragStart(e, 'top-left')}
            ></div>
            <div
              className="absolute -top-2 -right-2 size-6 border-t-4 border-r-4 border-primary rounded-tr-sm cursor-ne-resize z-10"
              onMouseDown={(e) => handleDragStart(e, 'top-right')}
              onTouchStart={(e) => handleDragStart(e, 'top-right')}
            ></div>
            <div
              className="absolute -bottom-2 -left-2 size-6 border-b-4 border-l-4 border-primary rounded-bl-sm cursor-sw-resize z-10"
              onMouseDown={(e) => handleDragStart(e, 'bottom-left')}
              onTouchStart={(e) => handleDragStart(e, 'bottom-left')}
            ></div>
            <div
              className="absolute -bottom-2 -right-2 size-6 border-b-4 border-r-4 border-primary rounded-br-sm cursor-se-resize z-10"
              onMouseDown={(e) => handleDragStart(e, 'bottom-right')}
              onTouchStart={(e) => handleDragStart(e, 'bottom-right')}
            ></div>

            {/* Resize Handles - Edges */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 cursor-n-resize hover:bg-primary/50 transition-colors" onMouseDown={(e) => handleDragStart(e, 'top')}></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 cursor-s-resize hover:bg-primary/50 transition-colors" onMouseDown={(e) => handleDragStart(e, 'bottom')}></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 cursor-w-resize hover:bg-primary/50 transition-colors" onMouseDown={(e) => handleDragStart(e, 'left')}></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 cursor-e-resize hover:bg-primary/50 transition-colors" onMouseDown={(e) => handleDragStart(e, 'right')}></div>
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-4">
          <button
            disabled={loading}
            onClick={handleScan}
            className="w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined">refresh</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            )}
            <span>{loading ? 'Analyzing...' : 'Solve Problem'}</span>
          </button>

          <button
            disabled={loading}
            onClick={() => navigate(-1)}
            className="w-full h-14 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-[#0d121c] dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            <span>Retake Photo</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default CropConfirm;

