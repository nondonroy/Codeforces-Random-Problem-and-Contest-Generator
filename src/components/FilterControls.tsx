import React, { useState } from 'react';
import { AgeFilterOption, GeneratorFilter } from '../types';
import { COMMON_CF_TAGS } from '../services/codeforces';
import {
  Sliders,
  Calendar,
  Layers,
  Tag,
  Hash,
  Award,
  TrendingUp,
  Shuffle,
  Info,
  Check,
  Search,
  X,
  Flame,
  Sparkles,
} from 'lucide-react';

interface FilterControlsProps {
  filter: GeneratorFilter;
  onChange: (filter: GeneratorFilter) => void;
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
  { value: 'all', label: 'All Time', desc: 'Any historical Codeforces contest' },
  { value: '6months', label: 'Last 6 Months', desc: 'Recent fresh problems' },
  { value: '1year', label: 'Last 1 Year', desc: 'Within past 12 months' },
  { value: '2years', label: 'Last 2 Years', desc: 'Modern contest problem styles' },
  { value: '3years', label: 'Last 3 Years', desc: 'High quality recent sets' },
  { value: '5years', label: 'Last 5 Years', desc: 'Broader variety post-2021' },
  { value: 'modern', label: 'Modern Era (2020+)', desc: 'Contest ID ≥ 1300' },
  { value: 'custom', label: 'Custom Contest ID Range', desc: 'Specify min & max contest IDs' },
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

export const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onChange,
  totalCandidatePool,
}) => {
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const update = (partial: Partial<GeneratorFilter>) => {
    onChange({ ...filter, ...partial });
  };

  const currentMode = filter.generatorMode || 'mashup_custom';

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
    <div id="filter-controls-section" className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Contest Generator Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate either a full Official Codeforces Contest or a custom Mashup practice ladder.
            </p>
          </div>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Pool:{' '}
          <strong className="text-blue-600 dark:text-blue-300 font-semibold">{totalCandidatePool.toLocaleString()}</strong> eligible problems
        </div>
      </div>

      {/* Main Mode Toggle: Full Real Contest vs Custom Mashup */}
      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Select Contest Generator Mode:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="generator-mode-real-contest"
            onClick={() => update({ generatorMode: 'real_contest' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentMode === 'real_contest'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide">🏆 Official Real CF Contest</span>
              {currentMode === 'real_contest' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${currentMode === 'real_contest' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Generates an entire official Codeforces Round (e.g. Div. 2, Div. 3, Div. 4, Educational) where none of the problems have been solved by your team.
            </p>
          </button>

          <button
            type="button"
            id="generator-mode-mashup"
            onClick={() => update({ generatorMode: 'mashup_custom' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentMode === 'mashup_custom'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide">🎯 Custom Mashup Ladder</span>
              {currentMode === 'mashup_custom' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${currentMode === 'mashup_custom' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Creates a custom curated problem set across chosen ratings, tags, and problem counts with difficulty progression (A → B → C → D).
            </p>
          </button>
        </div>
      </div>

      {/* Real Contest Division Filter (Only shown in Real Contest mode) */}
      {currentMode === 'real_contest' && (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Official Contest Division Type:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'all', label: 'Any Official Round', desc: 'Div 1, 2, 3, 4, Edu' },
              { type: 'div2', label: 'Div. 2 Round', desc: 'Intermediate (~1200–2200)' },
              { type: 'div3', label: 'Div. 3 Round', desc: 'Speed / Practice (~800–1800)' },
              { type: 'div4', label: 'Div. 4 Round', desc: 'Beginner (~800–1400)' },
              { type: 'educational', label: 'Educational Round', desc: 'Classic 6-7 problem format' },
              { type: 'div1', label: 'Div. 1 Round', desc: 'Master+ (~1900–3200)' },
              { type: 'global', label: 'Global Round', desc: 'Open for all divisions' },
            ].map((d) => {
              const isSelected = (filter.contestTypeFilter || 'all') === d.type;
              return (
                <button
                  key={d.type}
                  type="button"
                  id={`contest-type-${d.type}`}
                  onClick={() => update({ contestTypeFilter: d.type as any })}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/60 text-blue-800 dark:text-blue-300 font-bold ring-1 ring-blue-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">{d.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{d.desc}</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 pt-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              id="require-all-unsolved-cb"
              checked={filter.requireAllUnsolved !== false}
              onChange={(e) => update({ requireAllUnsolved: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Ensure <strong>100% of problems in the contest</strong> are unsolved for all selected users</span>
          </label>
        </div>
      )}

      {/* 1. Problem Count Selection (Only shown in Custom Mashup mode) */}
      {currentMode === 'mashup_custom' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="problem-count-slider" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Problem Count:
              <span className="text-blue-600 dark:text-blue-400 font-mono text-base font-bold bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
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
                id={`count-preset-${cnt}`}
                onClick={() => update({ problemCount: cnt })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  filter.problemCount === cnt
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {cnt} Pbs
              </button>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="range"
                id="problem-count-slider"
                min="1"
                max="20"
                value={filter.problemCount}
                onChange={(e) => update({ problemCount: parseInt(e.target.value, 10) || 10 })}
                className="w-28 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Rating Range Filter (Only in Mashup mode) */}
      {currentMode === 'mashup_custom' && (
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Rating Range:
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                {filter.minRating} – {filter.maxRating}
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                id="allow-unrated-checkbox"
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
                id="min-rating-slider"
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
                id="max-rating-slider"
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
                  id={`rating-preset-${preset.min}-${preset.max}`}
                  onClick={() => update({ minRating: preset.min, maxRating: preset.max })}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors border ${
                    isMatch
                      ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Dedicated Tag / Topic Filter Option */}
      <div id="tag-filter-section" className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Tag &amp; Topic Filter:
            {filter.selectedTags.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold font-mono">
                {filter.selectedTags.length} active
              </span>
            )}
          </label>

          {/* Match Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 px-1 text-[11px] font-medium">Mode:</span>
            {(
              [
                { mode: 'any', label: 'Match Any' },
                { mode: 'all', label: 'Match All' },
                { mode: 'exclude', label: 'Exclude Tags' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.mode}
                type="button"
                id={`tag-mode-${opt.mode}`}
                onClick={() => update({ tagMode: opt.mode })}
                className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  filter.tagMode === opt.mode
                    ? opt.mode === 'exclude'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Shortcuts */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          {/* Tag Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="tag-search-input"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="Search Codeforces tags (e.g. dp, greedy, math, graphs, binary search)..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {tagSearchQuery && (
              <button
                type="button"
                onClick={() => setTagSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Tags Tray */}
          {filter.selectedTags.length > 0 && (
            <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 font-mono">
                  {filter.tagMode === 'exclude' ? 'Excluding:' : 'Filter by:'}
                </span>
                {filter.selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-500/40"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="hover:text-rose-500 transition-colors"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <button
                type="button"
                id="clear-all-tags-btn"
                onClick={() => update({ selectedTags: [] })}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-medium ml-auto"
              >
                Clear all ({filter.selectedTags.length})
              </button>
            </div>
          )}

          {/* Popular Tag Shortcut Pills */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-blue-500" /> Popular Topic Shortcuts:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAG_SHORTCUTS.map((item) => {
                const isSelected = filter.selectedTags.includes(item.tag);
                return (
                  <button
                    key={item.tag}
                    type="button"
                    id={`popular-tag-${item.tag}`}
                    onClick={() => handleTagToggle(item.tag)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                      isSelected
                        ? filter.tagMode === 'exclude'
                          ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Tag List */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              All Available Tags ({filteredTags.length}):
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredTags.map((tag) => {
                const isSelected = filter.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    id={`tag-chip-${tag}`}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all border ${
                      isSelected
                        ? filter.tagMode === 'exclude'
                          ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-blue-100 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/60 text-blue-800 dark:text-blue-300 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            Generated contest problems will keep their tags spoiler-shielded until clicked.
          </p>
        </div>
      </div>

      {/* 4. Contest Age Filter */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Contest Age Acceptance:
          <span className="text-slate-400 font-normal text-xs">
            (Filter how old problem sets can be)
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AGE_OPTIONS.map((opt) => {
            const isSelected = filter.ageFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                id={`age-option-${opt.value}`}
                onClick={() => update({ ageFilter: opt.value })}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-300 dark:ring-blue-500/30 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Contest ID Range if custom selected */}
        {filter.ageFilter === 'custom' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-in fade-in">
            <div className="space-y-1 flex-1">
              <label htmlFor="custom-min-contest-id" className="text-xs text-slate-600 dark:text-slate-400">
                Min Contest ID:
              </label>
              <input
                type="number"
                id="custom-min-contest-id"
                value={filter.customMinContestId || 1000}
                onChange={(e) => update({ customMinContestId: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label htmlFor="custom-max-contest-id" className="text-xs text-slate-600 dark:text-slate-400">
                Max Contest ID:
              </label>
              <input
                type="number"
                id="custom-max-contest-id"
                value={filter.customMaxContestId || 2050}
                onChange={(e) => update({ customMaxContestId: parseInt(e.target.value, 10) || 2050 })}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Distribution / Contest Mode (Ladder vs Uniform) */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Set Structure &amp; Distribution:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="distribution-progressive-btn"
            onClick={() => update({ distributionMode: 'progressive' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter.distributionMode === 'progressive'
                ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-300 dark:ring-blue-500/30'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-xs">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Contest Ladder (A → B → C → D difficulty)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ascending difficulty curve sorted from easiest slot A up to hardest slot.
            </p>
          </button>

          <button
            type="button"
            id="distribution-uniform-btn"
            onClick={() => update({ distributionMode: 'uniform' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter.distributionMode === 'uniform'
                ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-300 dark:ring-blue-500/30'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-xs">
              <Shuffle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Uniform Random Practice Set</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Samples problems uniformly from the entire selected rating and age range.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
