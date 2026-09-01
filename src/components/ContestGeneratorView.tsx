import React from 'react';
import { GeneratorFilter, CFUser } from '../types';
import {
  Trophy,
  Calendar,
  Users,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ContestGeneratorViewProps {
  filter: GeneratorFilter;
  onChange: (filter: GeneratorFilter) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  users: CFUser[];
  selectedUserHandles: string[];
}

const AGE_OPTIONS: { value: GeneratorFilter['ageFilter']; label: string; desc: string }[] = [
  { value: 'all', label: 'All Time', desc: 'Any official Codeforces round' },
  { value: '6months', label: 'Last 6 Months', desc: 'Fresh contests from past 6 months' },
  { value: '1year', label: 'Last 1 Year', desc: 'Within past 12 months' },
  { value: '2years', label: 'Last 2 Years', desc: 'Modern contest styles' },
  { value: '3years', label: 'Last 3 Years', desc: 'Recent active contest era' },
  { value: 'modern', label: 'Modern Era (2020+)', desc: 'Contest ID ≥ 1300' },
];

export const ContestGeneratorView: React.FC<ContestGeneratorViewProps> = ({
  filter,
  onChange,
  onGenerate,
  isGenerating,
  users,
  selectedUserHandles,
}) => {
  const update = (partial: Partial<GeneratorFilter>) => {
    onChange({ ...filter, ...partial, generatorMode: 'real_contest' });
  };

  const selectedDiv = filter.contestTypeFilter || 'all';

  return (
    <div className="space-y-6">
      {/* Hero Intro Header */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              Full Official Codeforces Contest
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Official Contest Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Generates an entire real official Codeforces round for authentic virtual contest practice.
              Guarantees that <strong>100% of the problems in the round are unsolved</strong> by all your selected teammates.
            </p>
          </div>

          <button
            type="button"
            id="contest-gen-main-btn"
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transform active:scale-95 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Finding Unsolved Contest...' : 'Generate Official Contest 🏆'}</span>
          </button>
        </div>
      </div>

      {/* 1. Division Selection */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            1. Select Contest Division / Format
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              type: 'all',
              title: 'Any Official Round',
              badge: 'All Divs',
              desc: 'Picks randomly from any standard Codeforces round',
              color: 'border-slate-200 dark:border-slate-700',
            },
            {
              type: 'div2',
              title: 'Div. 2 Round',
              badge: 'Rated for Div 2',
              desc: 'Standard Div. 2 rounds (~1000–2200 ratings)',
              color: 'border-blue-300 dark:border-blue-700',
            },
            {
              type: 'div3',
              title: 'Div. 3 Round',
              badge: 'Rated for Div 3',
              desc: '6–8 problems tailored for speed and practice (~800–1800 ratings)',
              color: 'border-emerald-300 dark:border-emerald-700',
            },
            {
              type: 'div4',
              title: 'Div. 4 Round',
              badge: 'Beginner Friendly',
              desc: 'Accessible 7–8 problems for beginners (~800–1400 ratings)',
              color: 'border-amber-300 dark:border-amber-700',
            },
            {
              type: 'educational',
              title: 'Educational Round',
              badge: 'Classic 6-7 Problems',
              desc: 'Standard Educational Codeforces rounds with well-structured topics',
              color: 'border-indigo-300 dark:border-indigo-700',
            },
            {
              type: 'div1',
              title: 'Div. 1 Round',
              badge: 'Master / Grandmaster',
              desc: 'Advanced problems for high rated candidates (~1800–3200 ratings)',
              color: 'border-rose-300 dark:border-rose-700',
            },
            {
              type: 'global',
              title: 'Global Round',
              badge: 'All Rating Bands',
              desc: 'Open to all competitors, 8 problems from easy to extreme',
              color: 'border-cyan-300 dark:border-cyan-700',
            },
          ].map((item) => {
            const isSelected = selectedDiv === item.type;
            return (
              <button
                key={item.type}
                type="button"
                id={`contest-gen-div-${item.type}`}
                onClick={() => update({ contestTypeFilter: item.type as any })}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-100 ring-2 ring-purple-400/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Era / Contest Age Selection */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          2. Contest Era / Recency
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AGE_OPTIONS.map((opt) => {
            const isSelected = filter.ageFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                id={`contest-gen-age-${opt.value}`}
                onClick={() => update({ ageFilter: opt.value })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Team Solved Protection */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            3. Team Unsolved Filter
          </label>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                100% Unsolved Protection Active
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Checks across {selectedUserHandles.length} selected user handle{selectedUserHandles.length !== 1 ? 's' : ''}:{' '}
                <span className="font-mono text-purple-600 dark:text-purple-300 font-bold">
                  {selectedUserHandles.length > 0 ? selectedUserHandles.join(', ') : 'No users selected (select in Users tab)'}
                </span>
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              id="contest-gen-unsolved-cb"
              checked={filter.requireAllUnsolved !== false}
              onChange={(e) => update({ requireAllUnsolved: e.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Strict Unsolved Check</span>
          </label>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="contest-gen-bottom-btn"
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed transform active:scale-95"
        >
          <Zap className="w-5 h-5" />
          <span>{isGenerating ? 'Generating Official Contest...' : 'Generate Official Codeforces Contest'}</span>
        </button>
      </div>
    </div>
  );
};
