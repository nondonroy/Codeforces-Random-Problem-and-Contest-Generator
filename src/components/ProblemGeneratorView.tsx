import React, { useState } from 'react';
import { AgeFilterOption, GeneratorFilter, ContestDistributionMode } from '../types';
import { COMMON_CF_TAGS } from '../services/codeforces';
import {
  Sliders,
  Calendar,
  Layers,
  Tag,
  Hash,
  Award,
  Sparkles,
  TrendingUp,
  Shuffle,
  Info,
  Check,
  Search,
  X,
  Zap,
} from 'lucide-react';

interface ProblemGeneratorViewProps {
  filter: GeneratorFilter;
  onChange: (filter: GeneratorFilter) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  totalCandidatePool: number;
}

const COUNT_PRESETS = [3, 5, 6, 8, 10, 12, 15, 20];

const RATING_PRESETS = [
  { label: 'Div 4 (800 - 1400)', min: 800, max: 1400 },
  { label: 'Div 3 (800 - 1800)', min: 800, max: 1800 },
  { label: 'Div 2 (1100 - 2200)', min: 1100, max: 2200 },
  { label: 'Div 1 (1800 - 3000)', min: 1800, max: 3000 },
  { label: 'Beginner (800 - 1200)', min: 800, max: 1200 },
  { label: 'Candidate Master (1900 - 2200)', min: 1900, max: 2200 },
  { label: 'Grandmaster+ (2400 - 3500)', min: 2400, max: 3500 },
];

const AGE_OPTIONS: { value: AgeFilterOption; label: string; desc: string }[] = [
  { value: 'all', label: 'All Time', desc: 'Any historical Codeforces problem' },
  { value: '6months', label: 'Last 6 Months', desc: 'Recent fresh problems' },
  { value: '1year', label: 'Last 1 Year', desc: 'Within past 12 months' },
  { value: '2years', label: 'Last 2 Years', desc: 'Modern problem styles' },
  { value: '3years', label: 'Last 3 Years', desc: 'High quality recent sets' },
  { value: 'modern', label: 'Modern Era (2020+)', desc: 'Contest ID ≥ 1300' },
];

const POPULAR_TAG_SHORTCUTS = [
  { label: 'Dynamic Programming', tag: 'dp' },
  { label: 'Greedy', tag: 'greedy' },
  { label: 'Math', tag: 'math' },
  { label: 'Graphs', tag: 'graphs' },
  { label: 'Data Structures', tag: 'data structures' },
  { label: 'Trees', tag: 'trees' },
  { label: 'Binary Search', tag: 'binary search' },
  { label: 'Strings', tag: 'strings' },
  { label: 'Number Theory', tag: 'number theory' },
  { label: 'Constructive Algorithms', tag: 'constructive algorithms' },
  { label: 'Two Pointers', tag: 'two pointers' },
  { label: 'Bitmasks', tag: 'bitmasks' },
  { label: 'Combinatorics', tag: 'combinatorics' },
  { label: 'DFS & BFS', tag: 'dfs and similar' },
  { label: 'Shortest Paths', tag: 'shortest paths' },
  { label: 'Geometry', tag: 'geometry' },
];

export const ProblemGeneratorView: React.FC<ProblemGeneratorViewProps> = ({
  filter,
  onChange,
  onGenerate,
  isGenerating,
  totalCandidatePool,
}) => {
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const update = (partial: Partial<GeneratorFilter>) => {
    onChange({ ...filter, ...partial, generatorMode: 'mashup_custom' });
  };

  const handleTagToggle = (tag: string) => {
    if (filter.selectedTags.includes(tag)) {
      update({ selectedTags: filter.selectedTags.filter((t) => t !== tag) });
    } else {
      update({ selectedTags: [...filter.selectedTags, tag] });
    }
  };

  const filteredTags = COMMON_CF_TAGS.filter((tag) =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Hero Intro Header */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Custom Problemset &amp; Mashup Ladder
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Problem Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Create a custom practice problem set by specifying your desired problem count, rating range, difficulty curve, and topics/tags.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pool: <strong className="text-blue-600 dark:text-blue-400 font-bold">{totalCandidatePool.toLocaleString()}</strong> problems
            </div>

            <button
              type="button"
              id="problem-gen-main-btn"
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transform active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Set...' : `Generate Problem Set (${filter.problemCount} Pbs)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Problem Count Selection */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="prob-gen-slider" className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            1. Problem Count:
            <span className="text-blue-600 dark:text-blue-400 font-mono text-base font-bold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {filter.problemCount} problems
            </span>
          </label>
          <span className="text-xs text-slate-400 font-mono">1 – 20 problems</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {COUNT_PRESETS.map((cnt) => (
            <button
              key={cnt}
              type="button"
              id={`prob-count-preset-${cnt}`}
              onClick={() => update({ problemCount: cnt })}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                filter.problemCount === cnt
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
              }`}
            >
              {cnt} Problems
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <input
              type="range"
              id="prob-gen-slider"
              min="1"
              max="20"
              value={filter.problemCount}
              onChange={(e) => update({ problemCount: parseInt(e.target.value, 10) || 10 })}
              className="w-32 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Rating Range Filter */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            2. Rating Range:
            <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {filter.minRating} – {filter.maxRating}
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              id="prob-allow-unrated-checkbox"
              checked={filter.allowUnrated}
              onChange={(e) => update({ allowUnrated: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Include unrated</span>
          </label>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Minimum Rating:</span>
              <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{filter.minRating}</strong>
            </div>
            <input
              type="range"
              id="prob-min-rating-slider"
              min="800"
              max="3500"
              step="100"
              value={filter.minRating}
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value, 10), filter.maxRating);
                update({ minRating: val });
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Maximum Rating:</span>
              <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{filter.maxRating}</strong>
            </div>
            <input
              type="range"
              id="prob-max-rating-slider"
              min="800"
              max="3500"
              step="100"
              value={filter.maxRating}
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value, 10), filter.minRating);
                update({ maxRating: val });
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Div Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {RATING_PRESETS.map((preset) => {
            const isMatch = filter.minRating === preset.min && filter.maxRating === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                id={`prob-rating-preset-${preset.min}-${preset.max}`}
                onClick={() => update({ minRating: preset.min, maxRating: preset.max })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                  isMatch
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Distribution Mode (Ladder progression) */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          3. Difficulty Progression
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'progressive' as ContestDistributionMode,
              label: 'Progressive Ladder (A → B → C → D)',
              desc: 'Spreads problem difficulty gradually from easiest to hardest, like a real contest.',
              icon: TrendingUp,
            },
            {
              id: 'uniform' as ContestDistributionMode,
              label: 'Uniform / Random Spread',
              desc: 'Picks problems uniformly at random across the entire rating range.',
              icon: Shuffle,
            },
          ].map((mode) => {
            const isSelected = filter.distributionMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                id={`prob-dist-mode-${mode.id}`}
                onClick={() => update({ distributionMode: mode.id })}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 dark:border-blue-400 ring-1 ring-blue-400 text-blue-900 dark:text-blue-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">{mode.label}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{mode.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Era / Contest Age Selection */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          4. Contest Era / Recency
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AGE_OPTIONS.map((opt) => {
            const isSelected = filter.ageFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                id={`prob-age-${opt.value}`}
                onClick={() => update({ ageFilter: opt.value })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-400'
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

      {/* 5. Dedicated Tag / Topic Filter Option */}
      <div id="prob-tag-filter-section" className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            5. Topic &amp; Algorithm Tags Filter
            {filter.selectedTags.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold">
                {filter.selectedTags.length} active
              </span>
            )}
          </label>

          {/* Tag Match Mode */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono text-slate-500 px-2">Match:</span>
            {[
              { id: 'any', label: 'Match Any' },
              { id: 'all', label: 'Match All' },
              { id: 'exclude', label: 'Exclude Tags' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                id={`prob-tag-mode-${m.id}`}
                onClick={() => update({ tagMode: m.id as any })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filter.tagMode === m.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tags Chips */}
        {filter.selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <span className="text-xs text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1 mr-1">
              Active {filter.tagMode === 'exclude' ? 'Exclusions' : 'Tags'}:
            </span>
            {filter.selectedTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-blue-600 text-white shadow-xs"
              >
                {t}
                <button
                  type="button"
                  onClick={() => handleTagToggle(t)}
                  className="hover:bg-blue-700 rounded p-0.5 ml-0.5 cursor-pointer"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              id="prob-clear-tags-btn"
              onClick={() => update({ selectedTags: [] })}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-mono ml-auto cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Popular Shortcuts */}
        <div className="space-y-2">
          <div className="text-xs text-slate-500 font-medium">Quick Topic Shortcuts:</div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TAG_SHORTCUTS.map((item) => {
              const isSelected = filter.selectedTags.includes(item.tag);
              return (
                <button
                  key={item.tag}
                  type="button"
                  id={`prob-quick-tag-${item.tag.replace(/\s+/g, '-')}`}
                  onClick={() => handleTagToggle(item.tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Search Input */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
          <input
            type="text"
            id="prob-tag-search-input"
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            placeholder="Search all 35+ official Codeforces tags (e.g. geometry, fft, flows, games)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bottom Action */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="prob-gen-bottom-btn"
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed transform active:scale-95"
        >
          <Zap className="w-5 h-5" />
          <span>{isGenerating ? 'Generating Set...' : `Generate Problem Set (${filter.problemCount} Problems)`}</span>
        </button>
      </div>
    </div>
  );
};
