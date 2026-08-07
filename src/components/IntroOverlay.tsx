import React, { useEffect, useState, useRef } from 'react';

interface IntroOverlayProps {
  progress: number; // Real fetch progress 0 - 100 based on resolved collections
  isDataLoaded: boolean; // True when all initial fetches have completed
  onDismiss: () => void; // Callback when overlay finishes dismiss transition
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  progress,
  isDataLoaded,
  onDismiss,
}) => {
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const dismissTriggered = useRef<boolean>(false);

  // Smoothly interpolate displayProgress towards real fetch progress
  useEffect(() => {
    if (isFadingOut) return;

    let animFrame: number;
    const updateProgress = () => {
      setDisplayProgress((prev) => {
        let target = progress;

        // If data is not fully loaded yet, let progress crawl smoothly up to 90%
        if (!isDataLoaded && target < 90) {
          target = Math.max(target, Math.min(prev + 1.5, 90));
        }

        // When data is loaded, snap target directly to 100%
        if (isDataLoaded) {
          target = 100;
        }

        const diff = target - prev;
        if (Math.abs(diff) < 0.5) {
          const next = target;
          if (next >= 100 && !dismissTriggered.current) {
            triggerDismiss();
          }
          return next;
        }

        // Smooth ease towards target
        const next = prev + diff * 0.25;
        if (next >= 99.5 && isDataLoaded && !dismissTriggered.current) {
          triggerDismiss();
          return 100;
        }
        return next;
      });

      animFrame = requestAnimationFrame(updateProgress);
    };

    animFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, [progress, isDataLoaded, isFadingOut]);

  // Handle immediate or complete dismiss
  const triggerDismiss = () => {
    if (dismissTriggered.current) return;
    dismissTriggered.current = true;

    // Mark session flag so intro is never shown again in this browser session
    try {
      sessionStorage.setItem('introShown', 'true');
    } catch (e) {
      // Ignore sessionStorage exceptions if restricted
    }

    setIsFadingOut(true);

    // After ~400ms fade-out transition, call onDismiss to unmount overlay
    setTimeout(() => {
      onDismiss();
    }, 400);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerDismiss();
  };

  return (
    <div
      id="centivate-intro-overlay"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1b2a] text-[#e8f1f2] select-none p-6 transition-all duration-400 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      aria-label="CentIvate Loading Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Centered Branded Content */}
      <div className="flex flex-col items-center max-w-sm w-full space-y-6">
        {/* Geometric Mark Logo */}
        <div className="relative group">
          <svg
            className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Hexagonal Outer Frame */}
            <path
              d="M50 8L88 30V70L50 92L12 70V30L50 8Z"
              stroke="#172a3a"
              strokeWidth="4"
              fill="#0a1420"
            />
            {/* Left Facet - Teal (#4fd1c5) */}
            <path
              d="M50 14L82 32.5V67.5L50 86V50L22 34V32.5L50 14Z"
              fill="#4fd1c5"
              fillOpacity="0.9"
            />
            {/* Right Facet - Warm Orange (#f6ad55) */}
            <path
              d="M50 50L78 34V66L50 82V50Z"
              fill="#f6ad55"
              fillOpacity="0.95"
            />
            {/* Inner Core Accent */}
            <circle cx="50" cy="50" r="6" fill="#0d1b2a" stroke="#4fd1c5" strokeWidth="2" />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#e8f1f2] font-sans">
            Cent<span className="text-[#4fd1c5]">I</span><span className="text-[#f6ad55]">vate</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Facility Maintenance & Complaint Tracking
          </p>
        </div>

        {/* Progress Container */}
        <div className="w-56 sm:w-72 md:w-80 space-y-2 pt-2">
          {/* Progress Bar Track */}
          <div className="w-full h-1.5 bg-[#172a3a] rounded-full overflow-hidden shadow-inner border border-slate-800/60">
            <div
              className="h-full bg-gradient-to-r from-[#4fd1c5] to-[#f6ad55] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
            />
          </div>

          {/* Percentage Readout */}
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-slate-400 px-0.5">
            <span className="text-slate-500">Initializing system...</span>
            <span className="text-[#e8f1f2] font-semibold">{Math.round(displayProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Skip Button - Bottom Right */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed bottom-6 right-6 px-3.5 py-1.5 bg-[#13273d]/90 hover:bg-[#1e3a5f] text-slate-300 hover:text-[#e8f1f2] text-xs font-medium tracking-wide rounded-lg border border-slate-700/60 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#4fd1c5] active:scale-95"
      >
        Skip &rarr;
      </button>
    </div>
  );
};
