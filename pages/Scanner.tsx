
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ScannerProps {
  onCapture: (img: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [mode, setMode] = useState('Math');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const data = canvas.toDataURL('image/jpeg');
        onCapture(data);
        navigate('/crop');
      }
    }
  };

  return (
    <div className="relative h-screen bg-black">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full z-20 flex items-center p-4 justify-between">
        <button className="text-white size-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-white text-lg font-bold">Point & Solve</h2>
        <button onClick={() => navigate('/profile')} className="text-white size-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Camera Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover opacity-80"
      />

      {/* Frame Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-72 h-48 scanner-frame rounded-xl relative">
          <div className="scanner-corner top-0 left-0 border-t-4 border-l-4 rounded-tl-xl border-primary"></div>
          <div className="scanner-corner top-0 right-0 border-t-4 border-r-4 rounded-tr-xl border-primary"></div>
          <div className="scanner-corner bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl border-primary"></div>
          <div className="scanner-corner bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl border-primary"></div>
          <div className="scanner-line absolute left-0 right-0"></div>
        </div>
        <div className="mt-8">
          <h4 className="text-white text-sm font-bold px-4 py-2 bg-black/40 backdrop-blur-lg rounded-full">
            Align the problem inside the frame
          </h4>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 w-full z-10 flex flex-col items-center">
        <div className="w-full bg-gradient-to-t from-black/80 to-transparent pt-10 pb-4">
          <div className="flex justify-center gap-8 px-4">
            {['Homework', 'Math', 'Translate'].map(m => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={`pb-2 text-sm font-bold transition-colors ${mode === m ? 'text-white border-b-2 border-primary' : 'text-white/60 border-b-2 border-transparent'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-6 flex items-center justify-around">
          <button className="size-12 rounded-full bg-white/10 text-white flex items-center justify-center ring-1 ring-white/20">
            <span className="material-symbols-outlined">image</span>
          </button>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute size-20 rounded-full border-4 border-primary/40"></div>
            <button 
              onClick={takePhoto}
              className="size-16 rounded-full bg-white text-primary flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-4xl font-bold">camera</span>
            </button>
          </div>

          <button className="size-12 rounded-full bg-white/10 text-white flex items-center justify-center ring-1 ring-white/20">
            <span className="material-symbols-outlined">flash_on</span>
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="w-full bg-black/80 px-4 pb-8 pt-2 flex border-t border-white/10">
          <NavItem icon="home" label="Home" onClick={() => navigate('/stats')} />
          <NavItem icon="photo_camera" label="Scanner" active />
          <NavItem icon="history" label="History" onClick={() => navigate('/history')} />
          <NavItem icon="account_circle" label="Profile" onClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-gray-400'}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
  </button>
);

export default Scanner;
