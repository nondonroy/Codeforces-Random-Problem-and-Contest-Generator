import React, { useState, useEffect, useMemo } from 'react';
import { CFProblem, CFSubmission, CFUser, UserProblemSolveResult } from '../types';
import {
  parseProblemId,
  fetchProblemDetails,
  fetchUserSubmissionsForProblem,
} from '../services/codeforces';
import { getRankInfo } from '../utils/cfColors';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Award,
  AlertTriangle,
  Code2,
  Tag,
  Sparkles,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProblemSolveCheckerProps {
  users: CFUser[];
  allProblems: CFProblem[];
  currentContestProblems?: CFProblem[];
  onAddUser: (handle: string) => Promise<void>;
  isAddingUser: boolean;
}

const POPULAR_EXAMPLES = ['2050A', '2224F', '1999A', '1900B', '158A', '4A'];

export const ProblemSolveChecker: React.FC<ProblemSolveCheckerProps> = ({
  users,
  allProblems,
  currentContestProblems = [],
  onAddUser,
  isAddingUser,
}) => {
  const { isDark } = useTheme();

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  const [activeProblemCode, setActiveProblemCode] = useState<string>('2050A');
  const [parsedTarget, setParsedTarget] = useState<{ contestId: number; index: string } | null>({
    contestId: 2050,
    index: 'A',
  });

  // Problem metadata
  const [problemInfo, setProblemInfo] = useState<CFProblem | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [revealTags, setRevealTags] = useState(false);

  // Submissions detailed cache & loading
  const [userDetailedSubs, setUserDetailedSubs] = useState<Record<string, CFSubmission[]>>({});
  const [loadingUserSubs, setLoadingUserSubs] = useState<Record<string, boolean>>({});
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Filter & UX
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved' | 'attempted'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [newHandleInput, setNewHandleInput] = useState('');
  const [addHandleError, setAddHandleError] = useState<string | null>(null);
  const [isFetchingAllDetails, setIsFetchingAllDetails] = useState(false);

  // Parse input whenever search is submitted or changed
  const handlePerformLookup = async (inputStr: string) => {
    const parsed = parseProblemId(inputStr);
    if (!parsed) {
      return;
    }

    const codeStr = `${parsed.contestId}${parsed.index}`;
    setParsedTarget(parsed);
    setActiveProblemCode(codeStr);
    setIsLoadingProblem(true);

    try {
      const details = await fetchProblemDetails(parsed.contestId, parsed.index, allProblems);
      setProblemInfo(details);
    } catch (e) {
      console.warn('Failed to load problem details:', e);
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Initial load
  useEffect(() => {
    handlePerformLookup('2050A');
  }, [allProblems.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    handlePerformLookup(searchInput);
  };

  const handleQuickSelect = (code: string) => {
    setSearchInput(code);
    handlePerformLookup(code);
  };

  // Copy Problem ID
  const handleCopyCode = () => {
    if (!activeProblemCode) return;
    navigator.clipboard.writeText(activeProblemCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Fetch detailed submissions for a specific user
  const handleFetchUserSubmissions = async (handle: string) => {
    if (!parsedTarget) return;
    setLoadingUserSubs((prev) => ({ ...prev, [handle]: true }));
    try {
      const subs = await fetchUserSubmissionsForProblem(handle, parsedTarget.contestId, parsedTarget.index);
      setUserDetailedSubs((prev) => ({ ...prev, [handle]: subs }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserSubs((prev) => ({ ...prev, [handle]: false }));
    }
  };

  // Fetch detailed submissions for all users
  const handleFetchAllUserSubmissions = async () => {
    if (!parsedTarget) return;
    setIsFetchingAllDetails(true);
    try {
      for (const user of users) {
        await handleFetchUserSubmissions(user.handle);
      }
    } finally {
      setIsFetchingAllDetails(false);
    }
  };

  // Calculate solve status results for all users
  const userResults: UserProblemSolveResult[] = useMemo(() => {
    if (!parsedTarget) return [];
    const targetId = `${parsedTarget.contestId}${parsedTarget.index.toUpperCase()}`;

    return users.map((u) => {
      const isSolvedInCache = u.solvedProblemIds.some(
        (id) => id.toUpperCase() === targetId
      );

      const detailedSubs = userDetailedSubs[u.handle] || [];
      const hasDetailedSolves = detailedSubs.some((s) => s.verdict === 'OK');
      const isSolved = isSolvedInCache || hasDetailedSolves;
      const hasAttempted = isSolved || detailedSubs.length > 0;

      const latestSub = detailedSubs[0];
      const okSub = detailedSubs.find((s) => s.verdict === 'OK');

      return {
        user: u,
        isSolved,
        hasAttempted,
        submissionsCount: detailedSubs.length,
        bestVerdict: okSub ? 'OK' : latestSub?.verdict,
        firstSolvedTimeSeconds: okSub?.creationTimeSeconds,
        lastAttemptTimeSeconds: latestSub?.creationTimeSeconds,
        latestLanguage: okSub?.programmingLanguage || latestSub?.programmingLanguage,
        submissions: detailedSubs,
      };
    });
  }, [users, parsedTarget, userDetailedSubs]);

  // Solved counts
  const solvedCount = userResults.filter((r) => r.isSolved).length;
  const attemptedCount = userResults.filter((r) => r.hasAttempted && !r.isSolved).length;
  const unsolvedCount = userResults.filter((r) => !r.isSolved).length;

  // Filtered list
  const filteredResults = useMemo(() => {
    if (statusFilter === 'solved') return userResults.filter((r) => r.isSolved);
    if (statusFilter === 'unsolved') return userResults.filter((r) => !r.isSolved);
    if (statusFilter === 'attempted') return userResults.filter((r) => r.hasAttempted && !r.isSolved);
    return userResults;
  }, [userResults, statusFilter]);

  // Copy solve summary text
  const handleCopySummary = () => {
    if (!parsedTarget || !problemInfo) return;
    const pCode = `${parsedTarget.contestId}${parsedTarget.index}`;
    let text = `📊 Codeforces Solve Status for Problem ${pCode}: ${problemInfo.name || ''}\n`;
    text += `Rating: ${problemInfo.rating || 'Unrated'} | Solved: ${solvedCount}/${users.length} (${Math.round((solvedCount / Math.max(1, users.length)) * 100)}%)\n\n`;

    text += `✅ SOLVED (${solvedCount}):\n`;
    const solvedUsers = userResults.filter((r) => r.isSolved).map((r) => r.user.handle);
    text += solvedUsers.length > 0 ? `  ${solvedUsers.join(', ')}\n\n` : '  (None)\n\n';

    text += `❌ NOT SOLVED (${unsolvedCount}):\n`;
    const unsolvedUsers = userResults.filter((r) => !r.isSolved).map((r) => r.user.handle);
    text += unsolvedUsers.length > 0 ? `  ${unsolvedUsers.join(', ')}\n\n` : '  (None)\n\n';

    text += `URL: https://codeforces.com/contest/${parsedTarget.contestId}/problem/${parsedTarget.index}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Add handle inside checker
  const handleAddHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandleInput.trim()) return;
    setAddHandleError(null);
    try {
      await onAddUser(newHandleInput.trim());
      setNewHandleInput('');
    } catch (err: any) {
      setAddHandleError(err.message || 'Failed to add user');
    }
  };

  const rank = getRankInfo(problemInfo?.rating, !isDark);
  const cfUrl = parsedTarget
    ? `https://codeforces.com/contest/${parsedTarget.contestId}/problem/${parsedTarget.index}`
    : 'https://codeforces.com/problemset';

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Problem Solve Status Lookup
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter any Codeforces problem ID or URL to check solve status and submissions across all contestants.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="fetch-all-submissions-btn"
                onClick={handleFetchAllUserSubmissions}
                disabled={isFetchingAllDetails || users.length === 0}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Fetch detailed submission logs for all saved users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAllDetails ? 'animate-spin text-blue-500' : ''}`} />
                <span>{isFetchingAllDetails ? 'Checking...' : 'Check Live Details'}</span>
              </button>

              <button
                type="button"
                id="copy-status-summary-btn"
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 transition-colors flex items-center gap-1.5"
                title="Copy formatted text summary of solve statuses"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="problem-search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. 2224F, 2050A, 1900B, 4A, or https://codeforces.com/contest/2050/problem/A"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              id="submit-problem-lookup-btn"
              disabled={isLoadingProblem}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isLoadingProblem ? 'Looking up...' : 'Check Problem'}</span>
            </button>
          </form>

          {/* Quick Problem Selectors */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-mono">Quick Examples:</span>
            {POPULAR_EXAMPLES.map((code) => (
              <button
                key={code}
                type="button"
                id={`quick-code-${code}`}
                onClick={() => handleQuickSelect(code)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-colors border ${
                  activeProblemCode.toUpperCase() === code.toUpperCase()
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {code}
              </button>
            ))}

            {/* Current Contest problems shortcut if available */}
            {currentContestProblems.length > 0 && (
              <>
                <span className="text-slate-400 dark:text-slate-600 mx-1">|</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">From Generated Set:</span>
                {currentContestProblems.slice(0, 5).map((p) => {
                  const code = `${p.contestId}${p.index}`;
                  return (
                    <button
                      key={code}
                      type="button"
                      id={`contest-quick-code-${code}`}
                      onClick={() => handleQuickSelect(code)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold transition-colors border ${
                        activeProblemCode.toUpperCase() === code.toUpperCase()
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Problem Target Highlight Card */}
      {parsedTarget && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl transition-colors space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Direct Copy Problem Number Button */}
                <button
                  type="button"
                  id="target-problem-copy-badge"
                  onClick={handleCopyCode}
                  className={`font-mono font-bold text-sm px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    copiedCode
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/20'
                      : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                  }`}
                  title="Click to copy problem number"
                >
                  <span className="text-base">{activeProblemCode}</span>
                  {copiedCode ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>

                {/* Rating Badge */}
                {problemInfo?.rating ? (
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                      isDark ? rank.badgeBg : rank.lightBadgeBg
                    }`}
                    style={{ color: isDark ? rank.textColor : rank.lightTextColor }}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Rating: {problemInfo.rating}</span>
                    <span className="text-[10px] opacity-80 hidden sm:inline">({rank.name})</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Unrated
                  </span>
                )}

                {/* Contest ID */}
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Contest #{parsedTarget.contestId} &bull; Index {parsedTarget.index}
                </span>
              </div>

              {/* Problem Name & CF Link */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {problemInfo?.name || `Problem ${activeProblemCode}`}
                </h3>
                <a
                  href={cfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                  title="Open on Codeforces in new tab"
                >
                  <span>Open on CF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Tags with spoiler protection */}
              {problemInfo?.tags && problemInfo.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    id="toggle-lookup-tags-btn"
                    onClick={() => setRevealTags((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {revealTags ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{revealTags ? 'Hide Tags (Spoilers)' : `Show Tags (${problemInfo.tags.length})`}</span>
                  </button>

                  {revealTags && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {problemInfo.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Solved Ratio Scorecard */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shrink-0 justify-around sm:justify-start">
              <div className="text-center">
                <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {solvedCount}
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Solved
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-center">
                <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">
                  {unsolvedCount}
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Unsolved
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-center">
                <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">
                  {users.length > 0 ? Math.round((solvedCount / users.length) * 100) : 0}%
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Solve Rate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Solver Status List & Matrix */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl transition-colors space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Contestant Status Matrix ({userResults.length} Users)
            </h4>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              id="filter-status-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({userResults.length})
            </button>

            <button
              type="button"
              id="filter-status-solved"
              onClick={() => setStatusFilter('solved')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                statusFilter === 'solved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Solved ({solvedCount})</span>
            </button>

            <button
              type="button"
              id="filter-status-unsolved"
              onClick={() => setStatusFilter('unsolved')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                statusFilter === 'unsolved'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Unsolved ({unsolvedCount})</span>
            </button>
          </div>
        </div>

        {/* User Status Rows */}
        {users.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Users Added Yet</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add Codeforces handles below to instantly see whether they have solved problem {activeProblemCode}.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
            No users match the "{statusFilter}" filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResults.map((result) => {
              const u = result.user;
              const userRank = getRankInfo(u.rating, !isDark);
              const isExpanded = expandedUser === u.handle;
              const isFetchingThisUser = loadingUserSubs[u.handle] || false;

              return (
                <div
                  key={u.handle}
                  className={`p-4 rounded-xl border transition-all ${
                    result.isSolved
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/60'
                      : result.hasAttempted
                      ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.handle}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                            {u.handle[0].toUpperCase()}
                          </div>
                        )}
                        {result.isSolved ? (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center shadow-xs">
                            <XCircle className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://codeforces.com/profile/${u.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-bold text-sm hover:underline ${userRank.colorClass}`}
                            style={{ color: isDark ? userRank.textColor : userRank.lightTextColor }}
                          >
                            {u.handle}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <span>{u.rating ? `${u.rating} (${userRank.name})` : 'Unrated'}</span>
                          <span>&bull;</span>
                          <span>{u.solvedCount} total solves</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & details trigger */}
                    <div className="flex items-center gap-2">
                      {result.isSolved ? (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>SOLVED</span>
                        </div>
                      ) : result.hasAttempted ? (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>ATTEMPTED</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>UNSOLVED</span>
                        </div>
                      )}

                      {/* Expand submissions button */}
                      <button
                        type="button"
                        id={`expand-user-subs-${u.handle}`}
                        onClick={() => {
                          if (!isExpanded && result.submissions.length === 0) {
                            handleFetchUserSubmissions(u.handle);
                          }
                          setExpandedUser(isExpanded ? null : u.handle);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        title={isExpanded ? 'Hide submissions' : 'View submissions breakdown'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Submissions Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                        <span>Submission Logs for {activeProblemCode}</span>
                        <button
                          type="button"
                          onClick={() => handleFetchUserSubmissions(u.handle)}
                          disabled={isFetchingThisUser}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isFetchingThisUser ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {isFetchingThisUser ? (
                        <div className="py-3 text-center text-slate-500 font-mono animate-pulse">
                          Querying Codeforces submissions...
                        </div>
                      ) : result.submissions.length === 0 ? (
                        <div className="py-2 px-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 font-mono text-[11px]">
                          {result.isSolved
                            ? 'Problem marked solved in user profile. Click refresh to inspect specific verdict timestamps.'
                            : 'No submissions found for this problem from this user.'}
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {result.submissions.map((sub) => {
                            const isOk = sub.verdict === 'OK';
                            const dateStr = new Date(sub.creationTimeSeconds * 1000).toLocaleDateString();
                            return (
                              <div
                                key={sub.id}
                                className={`p-2 rounded-lg border font-mono text-[11px] flex items-center justify-between gap-2 ${
                                  isOk
                                    ? 'bg-emerald-100/50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-rose-100/40 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">
                                    {isOk ? 'Accepted' : sub.verdict || 'Failed'}
                                  </span>
                                  {sub.programmingLanguage && (
                                    <span className="opacity-75">({sub.programmingLanguage})</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 opacity-80">
                                  <span>{dateStr}</span>
                                  <a
                                    href={`https://codeforces.com/contest/${parsedTarget?.contestId}/submission/${sub.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"
                                  >
                                    <span>#{sub.id}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Quick Add User */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleAddHandleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="inline-add-user-input"
                value={newHandleInput}
                onChange={(e) => setNewHandleInput(e.target.value)}
                placeholder="Add Codeforces handle to check solve status..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              id="inline-add-user-btn"
              disabled={isAddingUser}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingUser ? 'Adding...' : 'Add & Check'}</span>
            </button>
          </form>
          {addHandleError && (
            <p className="text-xs text-rose-500 font-mono mt-1">{addHandleError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
