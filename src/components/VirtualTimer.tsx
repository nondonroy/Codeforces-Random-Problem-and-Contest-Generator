import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Bell } from 'lucide-react';

interface VirtualTimerProps {
  totalProblems: number;
  solvedCount: number;
}

export const VirtualTimer: React.FC<VirtualTimerProps> = ({ totalProblems, solvedCount }) => {
  const [initialSeconds, setInitialSeconds] = useState(2 * 60 * 60); // 2 hours default
  const [remainingSeconds, setRemainingSeconds] = useState(2 * 60 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  const toggleRun = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(initialSeconds);
      setIsFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(initialSeconds);
    setIsFinished(false);
  };

  const handleSetDuration = (hours: number, minutes: number = 0) => {
    const total = (hours * 60 + minutes) * 60;
    setInitialSeconds(total);
    setRemainingSeconds(total);
    setIsRunning(false);
    setIsFinished(false);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((initialSeconds - remainingSeconds) / initialSeconds) * 100));

  return (
    <div id="virtual-contest-timer" className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
      {/* All timer controls in a clean single-line layout */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {/* Left: Clock Icon + Time Display + Start/Reset Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
            <Timer className="w-4 h-4" />
          </div>

          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-lg sm:text-xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-wider">
              {formatTime(remainingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="timer-toggle-btn"
              onClick={toggleRun}
              className={`p-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                isRunning
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20'
              }`}
              title={isRunning ? 'Pause' : 'Start contest timer'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              type="button"
              id="timer-reset-btn"
              onClick={resetTimer}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Middle: Duration presets on the same line */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">Time:</span>
          {[
            { label: '1h', h: 1, m: 0 },
            { label: '2h', h: 2, m: 0 },
            { label: '2h15', h: 2, m: 15 },
            { label: '2h30', h: 2, m: 30 },
            { label: '3h', h: 3, m: 0 },
          ].map((preset) => {
            const isMatch = initialSeconds === (preset.h * 60 + preset.m) * 60;
            return (
              <button
                key={preset.label}
                type="button"
                id={`duration-preset-${preset.label}`}
                onClick={() => handleSetDuration(preset.h, preset.m)}
                disabled={isRunning}
                className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors border cursor-pointer ${
                  isMatch
                    ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-800 dark:text-blue-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Right: Solved Progress in Set on the same line */}
        <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-3 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">Score:</span>
          <span className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100">
            <span className="text-emerald-600 dark:text-emerald-400">{solvedCount}</span>
            <span className="text-slate-400">/</span>
            <span>{totalProblems}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isFinished
              ? 'bg-rose-500'
              : progressPercent > 80
              ? 'bg-amber-500'
              : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isFinished && (
        <div className="mt-2 p-1.5 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Bell className="w-3.5 h-3.5 animate-bounce" /> Time is up! Virtual contest finished.
          </span>
          <span className="text-[11px]">{solvedCount} / {totalProblems} solved</span>
        </div>
      )}
    </div>
  );
};
