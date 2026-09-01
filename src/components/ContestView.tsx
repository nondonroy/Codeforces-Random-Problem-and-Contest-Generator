import React, { useState } from 'react';
import { GeneratedContestSet } from '../types';
import { ProblemCard } from './ProblemCard';
import { VirtualTimer } from './VirtualTimer';
import {
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Trophy,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface ContestViewProps {
  contestSet: GeneratedContestSet;
  onToggleRevealTag: (problemId: string) => void;
  onToggleRevealAllTags: () => void;
  onRerollProblem: (problemId: string) => void;
  onRerollAll: () => void;
  onUpdateStatus: (problemId: string, status: 'unsolved' | 'solved' | 'attempted') => void;
  onCheckLiveSolves: () => Promise<number>;
  isGenerating: boolean;
  rerollingProblemId: string | null;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const ContestView: React.FC<ContestViewProps> = ({
  contestSet,
  onToggleRevealTag,
  onToggleRevealAllTags,
  onRerollProblem,
  onRerollAll,
  onUpdateStatus,
  onCheckLiveSolves,
  isGenerating,
  rerollingProblemId,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<'text' | 'markdown' | 'codes' | null>(null);
  const [isCheckingSolves, setIsCheckingSolves] = useState(false);
  const [checkResultMsg, setCheckResultMsg] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const solvedCount = contestSet.problems.filter((p) => p.status === 'solved').length;
  const attemptedCount = contestSet.problems.filter((p) => p.status === 'attempted').length;

  const handleCopyCodes = () => {
    const codes = contestSet.problems
      .map((p) => `${p.problem.contestId}${p.problem.index}`)
      .join(', ');

    navigator.clipboard.writeText(codes);
    setCopiedFormat('codes');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleCopyMarkdown = () => {
    let md = `### 🏆 Codeforces Custom Contest / Problem Set\n\n`;
    md += `| Slot | Problem | Rating | Tags (Spoilers) | Status |\n`;
    md += `| :--- | :--- | :---: | :--- | :---: |\n`;

    contestSet.problems.forEach((p, idx) => {
      const slot = ALPHABET[idx] || `P${idx + 1}`;
      const url = `https://codeforces.com/contest/${p.problem.contestId}/problem/${p.problem.index}`;
      const tags = p.problem.tags?.join(', ') || 'N/A';
      md += `| **${slot}** | [${p.problem.name}](${url}) (${p.problem.contestId}${p.problem.index}) | ${p.problem.rating || 'Unrated'} | ||${tags}|| | ${p.status} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleCopyLinks = () => {
    const text = contestSet.problems
      .map((p, idx) => {
        const slot = ALPHABET[idx] || `P${idx + 1}`;
        return `${slot}. ${p.problem.name} (${p.problem.rating ? p.problem.rating : 'Unrated'}) -> https://codeforces.com/contest/${p.problem.contestId}/problem/${p.problem.index}`;
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedFormat('text');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleLiveCheck = async () => {
    setIsCheckingSolves(true);
    setCheckResultMsg(null);
    try {
      const newlyFound = await onCheckLiveSolves();
      if (newlyFound > 0) {
        setCheckResultMsg(`🎉 Detected ${newlyFound} new solved problem(s) from Codeforces!`);
      } else {
        setCheckResultMsg('No new solves detected on Codeforces yet. Keep coding!');
      }
    } catch (e: any) {
      setCheckResultMsg(e.message || 'Failed to check submissions');
    } finally {
      setIsCheckingSolves(false);
      setTimeout(() => setCheckResultMsg(null), 4000);
    }
  };

  return (
    <div id="contest-view-container" className="space-y-6">
      {/* Contest Set Toolbar */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
                contestSet.isRealContest
                  ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
              }`}>
                <Trophy className="w-3.5 h-3.5" />
                {contestSet.isRealContest ? 'Official Contest' : 'Mashup Set'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(contestSet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {contestSet.problems.length} Problems
              </span>
              {contestSet.originalContestId && (
                <a
                  href={`https://codeforces.com/contest/${contestSet.originalContestId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono inline-flex items-center gap-1 font-semibold"
                >
                  CF #{contestSet.originalContestId} ↗
                </a>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {contestSet.title || 'Randomized Codeforces Practice Set'}
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {solvedCount} Solved
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                <Clock className="w-3.5 h-3.5" /> {attemptedCount} Attempted
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> {contestSet.problems.length - solvedCount - attemptedCount} Unsolved
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reveal/Hide all tags */}
            <button
              type="button"
              id="reveal-all-tags-btn"
              onClick={onToggleRevealAllTags}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                contestSet.allTagsRevealed
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/25'
              }`}
            >
              {contestSet.allTagsRevealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Hide All Tags</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Reveal All Tags</span>
                </>
              )}
            </button>

            {/* Check Solves via CF API */}
            <button
              type="button"
              id="live-cf-sync-btn"
              onClick={handleLiveCheck}
              disabled={isCheckingSolves}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
              title="Query Codeforces API to see if anyone solved these problems live!"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isCheckingSolves ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{isCheckingSolves ? 'Checking CF...' : 'Live CF Sync'}</span>
            </button>

            {/* Contest Timer Toggle */}
            <button
              type="button"
              id="toggle-timer-view-btn"
              onClick={() => setShowTimer(!showTimer)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                showTimer
                  ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{showTimer ? 'Hide Timer' : 'Contest Timer'}</span>
            </button>

            {/* Export Links & Problem IDs Buttons */}
            <button
              type="button"
              id="copy-all-codes-btn"
              onClick={handleCopyCodes}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer font-mono"
              title="Copy all problem codes (e.g., 2050A, 2224F, ...) to clipboard"
            >
              {copiedFormat === 'codes' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copiedFormat === 'codes' ? 'Copied IDs!' : 'Copy IDs'}</span>
            </button>

            <button
              type="button"
              id="copy-all-links-btn"
              onClick={handleCopyLinks}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedFormat === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copiedFormat === 'text' ? 'Copied Links!' : 'Copy Links'}</span>
            </button>

            {/* Re-roll entire set */}
            <button
              type="button"
              id="reroll-entire-set-btn"
              onClick={onRerollAll}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Reroll All</span>
            </button>
          </div>
        </div>

        {/* Live sync alert feedback */}
        {checkResultMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
            <span>{checkResultMsg}</span>
          </div>
        )}

        {/* Optional Timer view */}
        {showTimer && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <VirtualTimer totalProblems={contestSet.problems.length} solvedCount={solvedCount} />
          </div>
        )}
      </div>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contestSet.problems.map((item, idx) => {
          const letterSlot = ALPHABET[idx] || `${idx + 1}`;
          const problemId = `${item.problem.contestId}${item.problem.index}`;
          return (
            <ProblemCard
              key={problemId}
              item={item}
              indexNumber={idx + 1}
              letterSlot={letterSlot}
              onToggleRevealTags={onToggleRevealTag}
              onRerollProblem={onRerollProblem}
              onUpdateStatus={onUpdateStatus}
              isRerolling={rerollingProblemId === problemId}
            />
          );
        })}
      </div>
    </div>
  );
};
