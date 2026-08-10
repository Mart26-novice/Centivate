import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-950 text-white select-none p-6 transition-all duration-400 ease-out ${
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
        {/* Brand Mark — matches the header logo */}
        <div className="relative group">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center shadow-lg border-2 border-amber-300">
            <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11 text-blue-950" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-blue-950 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            CENTIVATE
          </h1>
          <p className="text-xs text-blue-200 font-medium tracking-wide">
            Facility Maintenance & Complaint Tracking
          </p>
        </div>

        {/* Progress Container */}
        <div className="w-56 sm:w-72 md:w-80 space-y-2 pt-2">
          {/* Progress Bar Track */}
          <div className="w-full h-1.5 bg-blue-900 rounded-full overflow-hidden shadow-inner border border-blue-800/60">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
            />
          </div>

          {/* Percentage Readout */}
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-blue-300 px-0.5">
            <span className="text-blue-400">Initializing system...</span>
            <span className="text-white font-semibold">{Math.round(displayProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Skip Button - Bottom Right */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed bottom-6 right-6 px-3.5 py-1.5 bg-blue-900/90 hover:bg-blue-800 text-blue-200 hover:text-white text-xs font-medium tracking-wide rounded-lg border border-blue-800/60 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95"
      >
        Skip &rarr;
      </button>
    </div>
  );
};
