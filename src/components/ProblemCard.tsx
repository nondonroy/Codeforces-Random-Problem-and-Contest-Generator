import React, { useState } from 'react';
import { GeneratedProblemItem } from '../types';
import { getRankInfo } from '../utils/cfColors';
import { useTheme } from '../context/ThemeContext';
import {
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Bookmark,
  Users,
  Award,
} from 'lucide-react';

interface ProblemCardProps {
  item: GeneratedProblemItem;
  indexNumber: number;
  letterSlot?: string;
  onToggleRevealTags: (problemId: string) => void;
  onRerollProblem: (problemId: string) => void;
  onUpdateStatus: (problemId: string, status: 'unsolved' | 'solved' | 'attempted') => void;
  isRerolling?: boolean;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  item,
  indexNumber,
  letterSlot,
  onToggleRevealTags,
  onRerollProblem,
  onUpdateStatus,
  isRerolling = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { isDark } = useTheme();

  const { problem, tagsRevealed, status } = item;
  const cfUrl = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;
  const problemCode = `${problem.contestId}${problem.index}`;
  const rank = getRankInfo(problem.rating, !isDark);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cfUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(problemCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Determine slot text cleanly
  let displayLetter = letterSlot || `P${indexNumber}`;
  if (displayLetter.startsWith('Problem ')) {
    displayLetter = displayLetter.replace('Problem ', '');
  }

  return (
    <div
      id={`problem-card-${problem.contestId}-${problem.index}`}
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        status === 'solved'
          ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-md shadow-emerald-500/5'
          : status === 'attempted'
          ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/60 shadow-md shadow-blue-500/5'
          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col justify-between gap-4 h-full">
        {/* Header Row: Slot badge, Direct Copy Problem ID, Rating, Solved stats */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Slot badge (Problem A, Problem B...) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs shrink-0">
              <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider font-semibold">
                Problem
              </span>
              <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                {displayLetter}
              </span>
            </div>

            {/* Direct Copy Problem ID (e.g. 2224F) Button */}
            <button
              type="button"
              id={`copy-problem-number-${problemCode}`}
              onClick={handleCopyCode}
              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all group/code shrink-0 cursor-pointer ${
                copiedCode
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500/70 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-slate-100 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-500/50'
              }`}
              title={`Click to copy problem number "${problemCode}" to clipboard`}
            >
              <span>{problemCode}</span>
              {copiedCode ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold animate-in fade-in">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Copied!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400 group-hover/code:text-blue-600 dark:group-hover/code:text-blue-400 transition-colors">
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px] font-sans font-normal opacity-0 group-hover/code:opacity-100 transition-opacity hidden sm:inline">
                    Copy ID
                  </span>
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Problem Rating Badge */}
            {problem.rating !== undefined ? (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1 ${
                  isDark ? rank.badgeBg : rank.lightBadgeBg
                }`}
                style={{ color: isDark ? rank.textColor : rank.lightTextColor }}
                title={`Codeforces Rating: ${problem.rating} (${rank.name})`}
              >
                <Award className="w-3 h-3 inline" />
                {problem.rating}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Unrated
              </span>
            )}

            {/* Solved Count Stat */}
            {problem.solvedCount !== undefined && problem.solvedCount > 0 && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-950/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                <Users className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                {problem.solvedCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Problem Title & Direct Link */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={cfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-baseline gap-1.5 group leading-snug"
            >
              <span>{problem.name}</span>
              <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 inline-block translate-y-0.5" />
            </a>

            <div className="flex items-center gap-1 shrink-0">
              {/* Copy Problem Code button */}
              <button
                type="button"
                id={`copy-code-action-${problemCode}`}
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={`Copy problem code (${problemCode})`}
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="text-xs font-mono font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600">
                    #{problemCode}
                  </span>
                )}
              </button>

              <button
                type="button"
                id={`bookmark-problem-${problem.contestId}-${problem.index}`}
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Bookmark for later"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
              </button>

              <button
                type="button"
                id={`copy-link-${problem.contestId}-${problem.index}`}
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy direct problem URL"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Spoiler Tags Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              Topic Tags:
            </span>

            {/* Toggle Reveal Button */}
            <button
              type="button"
              id={`reveal-tags-${problem.contestId}-${problem.index}`}
              onClick={() => onToggleRevealTags(`${problem.contestId}${problem.index}`)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                tagsRevealed
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 dark:text-blue-300 dark:border-blue-500/30'
              }`}
            >
              {tagsRevealed ? (
                <>
                  <EyeOff className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>Hide Tags</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Reveal Tags ({problem.tags?.length || 0})</span>
                </>
              )}
            </button>
          </div>

          {/* Tags Display or Spoiler Shield */}
          {tagsRevealed ? (
            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-200">
              {problem.tags && problem.tags.length > 0 ? (
                problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800/90 text-blue-700 dark:text-blue-200 border border-slate-200 dark:border-slate-700"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No tags specified</span>
              )}
            </div>
          ) : (
            <div
              onClick={() => onToggleRevealTags(`${problem.contestId}${problem.index}`)}
              className="py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
            >
              <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-300 flex items-center justify-center gap-1.5">
                <span className="tracking-widest blur-[3px] select-none text-slate-400 dark:text-slate-600">
                  dp graphs binary search greedy
                </span>
                <span className="text-[11px] font-semibold underline decoration-dotted">
                  Click to show spoiler tags
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions: Practice Status & Single Problem Reroll */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              id={`status-unsolved-${problem.contestId}-${problem.index}`}
              onClick={() => onUpdateStatus(`${problem.contestId}${problem.index}`, 'unsolved')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                status === 'unsolved'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Unsolved
            </button>
            <button
              type="button"
              id={`status-attempted-${problem.contestId}-${problem.index}`}
              onClick={() => onUpdateStatus(`${problem.contestId}${problem.index}`, 'attempted')}
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                status === 'attempted'
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              Attempted
            </button>
            <button
              type="button"
              id={`status-solved-${problem.contestId}-${problem.index}`}
              onClick={() => onUpdateStatus(`${problem.contestId}${problem.index}`, 'solved')}
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                status === 'solved'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Solved
            </button>
          </div>

          {/* Individual Reroll Button */}
          <button
            type="button"
            id={`reroll-problem-${problem.contestId}-${problem.index}`}
            onClick={() => onRerollProblem(`${problem.contestId}${problem.index}`)}
            disabled={isRerolling}
            className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 transition-colors flex items-center gap-1 text-[11px] disabled:opacity-50"
            title="Replace just this problem with another random match"
          >
            <RefreshCw className={`w-3 h-3 ${isRerolling ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span>Reroll</span>
          </button>
        </div>
      </div>
    </div>
  );
};
