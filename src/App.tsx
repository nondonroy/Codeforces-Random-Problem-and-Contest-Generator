import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CFContestInfo,
  CFProblem,
  CFUser,
  GeneratedContestSet,
  GeneratedProblemItem,
  GeneratorFilter,
} from './types';
import {
  fetchAllProblems,
  fetchContestsList,
  generateRandomProblems,
  generateRealContest,
  getSavedUsers,
  loadFullUserProfile,
  saveUsersToStorage,
  shuffleArray,
} from './services/codeforces';
import { UserManagement } from './components/UserManagement';
import { ContestGeneratorView } from './components/ContestGeneratorView';
import { ProblemGeneratorView } from './components/ProblemGeneratorView';
import { ContestView } from './components/ContestView';
import { ProblemSolveChecker } from './components/ProblemSolveChecker';
import { useTheme } from './context/ThemeContext';
import {
  Code2,
  Sparkles,
  Users,
  Sliders,
  Trophy,
  History,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Layers,
  ChevronRight,
  Flame,
  HelpCircle,
  Sun,
  Moon,
  Tag,
  X,
  Search,
} from 'lucide-react';

const STORAGE_KEY_SAVED_HISTORY = 'cf_gen_history_v2';
const STORAGE_KEY_LAST_FILTER = 'cf_gen_last_filter_v2';

const DEFAULT_FILTER: GeneratorFilter = {
  problemCount: 10,
  minRating: 800,
  maxRating: 2000,
  ageFilter: 'all',
  distributionMode: 'progressive',
  selectedTags: [],
  tagMode: 'any',
  allowUnrated: false,
  selectedUserHandles: [],
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  // State
  const [users, setUsers] = useState<CFUser[]>([]);
  const [selectedUserHandles, setSelectedUserHandles] = useState<string[]>([]);
  const [filter, setFilter] = useState<GeneratorFilter>(DEFAULT_FILTER);
  const [allProblems, setAllProblems] = useState<CFProblem[]>([]);
  const [contestsMap, setContestsMap] = useState<Map<number, CFContestInfo>>(new Map());
  const [contestSet, setContestSet] = useState<GeneratedContestSet | null>(null);
  const [historySets, setHistorySets] = useState<GeneratedContestSet[]>([]);

  // Loading & UX States
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [problemProgressMsg, setProblemProgressMsg] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [refreshingHandle, setRefreshingHandle] = useState<string | null>(null);
  const [rerollingProblemId, setRerollingProblemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contest' | 'contest_gen' | 'problem_gen' | 'checker' | 'users' | 'history'>('contest');

  // 1. Initial Load: Read saved users, filter, and cached history
  useEffect(() => {
    const saved = getSavedUsers();
    setUsers(saved);
    if (saved.length > 0) {
      const allHandles = saved.map((u) => u.handle);
      setSelectedUserHandles(allHandles);
      setFilter((prev) => ({ ...prev, selectedUserHandles: allHandles }));
    }

    try {
      const savedHist = localStorage.getItem(STORAGE_KEY_SAVED_HISTORY);
      if (savedHist) {
        setHistorySets(JSON.parse(savedHist));
      }
      const savedFilter = localStorage.getItem(STORAGE_KEY_LAST_FILTER);
      if (savedFilter) {
        const parsed = JSON.parse(savedFilter);
        setFilter((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Error reading saved filter/history:', e);
    }
  }, []);

  // 2. Load problem repository and contest list from Codeforces API
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setIsLoadingProblems(true);
      try {
        setProblemProgressMsg('Connecting to Codeforces Problemset API...');
        const [problems, contests] = await Promise.all([
          fetchAllProblems((msg) => {
            if (isMounted) setProblemProgressMsg(msg);
          }),
          fetchContestsList(),
        ]);
        if (isMounted) {
          setAllProblems(problems);
          setContestsMap(contests);
          setIsLoadingProblems(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setErrorMessage(err.message || 'Failed to fetch Codeforces problem repository');
          setIsLoadingProblems(false);
        }
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep filter.selectedUserHandles synchronized
  useEffect(() => {
    setFilter((prev) => ({ ...prev, selectedUserHandles }));
  }, [selectedUserHandles]);

  // Persist filter changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_FILTER, JSON.stringify(filter));
    } catch (e) {}
  }, [filter]);

  // Calculate live matching candidate problem count
  const eligiblePoolCount = useMemo(() => {
    if (allProblems.length === 0) return 0;
    const { totalMatching } = generateRandomProblems(allProblems, contestsMap, users, filter);
    return totalMatching;
  }, [allProblems, contestsMap, users, filter]);

  // Handler: Add User
  const handleAddUser = async (handle: string) => {
    setIsAddingUser(true);
    setErrorMessage(null);
    try {
      const fullProfile = await loadFullUserProfile(handle);
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.handle.toLowerCase() !== fullProfile.handle.toLowerCase());
        const nextUsers = [fullProfile, ...filtered];
        saveUsersToStorage(nextUsers);
        return nextUsers;
      });

      setSelectedUserHandles((prev) => {
        if (!prev.includes(fullProfile.handle)) {
          return [...prev, fullProfile.handle];
        }
        return prev;
      });
    } catch (err: any) {
      throw new Error(err.message || `Failed to add user ${handle}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  // Handler: Refresh Single User
  const handleRefreshUser = async (handle: string) => {
    setRefreshingHandle(handle);
    try {
      const fullProfile = await loadFullUserProfile(handle);
      setUsers((prev) => {
        const nextUsers = prev.map((u) => (u.handle.toLowerCase() === handle.toLowerCase() ? fullProfile : u));
        saveUsersToStorage(nextUsers);
        return nextUsers;
      });
    } catch (err: any) {
      setErrorMessage(`Failed to refresh @${handle}: ${err.message}`);
    } finally {
      setRefreshingHandle(null);
    }
  };

  // Handler: Refresh All Users
  const handleRefreshAllUsers = async () => {
    setRefreshingHandle('__ALL__');
    try {
      const refreshed: CFUser[] = [];
      for (const u of users) {
        try {
          const p = await loadFullUserProfile(u.handle);
          refreshed.push(p);
        } catch (e) {
          refreshed.push(u);
        }
      }
      setUsers(refreshed);
      saveUsersToStorage(refreshed);
    } finally {
      setRefreshingHandle(null);
    }
  };

  // Handler: Remove User
  const handleRemoveUser = (handle: string) => {
    setUsers((prev) => {
      const nextUsers = prev.filter((u) => u.handle !== handle);
      saveUsersToStorage(nextUsers);
      return nextUsers;
    });
    setSelectedUserHandles((prev) => prev.filter((h) => h !== handle));
  };

  // Handler: Toggle User Selection
  const handleToggleUser = (handle: string) => {
    setSelectedUserHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedUserHandles(users.map((u) => u.handle));
  };

  const handleDeselectAllUsers = () => {
    setSelectedUserHandles([]);
  };

  // Handler: Generate Official Real CF Contest
  const handleGenerateOfficialContest = useCallback(() => {
    if (allProblems.length === 0) {
      setErrorMessage('Codeforces problemset is still downloading. Please wait a moment...');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const activeFilter: GeneratorFilter = { ...filter, generatorMode: 'real_contest' };
    const { contest, problems, explanation } = generateRealContest(
      allProblems,
      contestsMap,
      users,
      activeFilter
    );

    if (!contest || problems.length === 0) {
      setErrorMessage(explanation || 'No official contests matched your criteria where all problems are unsolved.');
      setIsGenerating(false);
      return;
    }

    const problemItems: GeneratedProblemItem[] = problems.map((p) => ({
      id: `${p.contestId}${p.index}`,
      problem: p,
      tagsRevealed: false,
      status: 'unsolved',
    }));

    const newSet: GeneratedContestSet = {
      id: `contest_${Date.now()}`,
      createdAt: Date.now(),
      title: contest.name || `Codeforces Round #${contest.id}`,
      filterUsed: activeFilter,
      problems: problemItems,
      allTagsRevealed: false,
      isRealContest: true,
      originalContestId: contest.id,
      originalContestName: contest.name,
    };

    setContestSet(newSet);
    setActiveTab('contest');
    setIsGenerating(false);

    setHistorySets((prev) => {
      const nextHist = [newSet, ...prev.slice(0, 9)];
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_HISTORY, JSON.stringify(nextHist));
      } catch (e) {}
      return nextHist;
    });
  }, [allProblems, contestsMap, users, filter]);

  // Handler: Generate Custom Problem Set / Mashup
  const handleGenerateProblemSet = useCallback(() => {
    if (allProblems.length === 0) {
      setErrorMessage('Codeforces problemset is still downloading. Please wait a moment...');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const activeFilter: GeneratorFilter = { ...filter, generatorMode: 'mashup_custom' };
    const { selected, explanation } = generateRandomProblems(
      allProblems,
      contestsMap,
      users,
      activeFilter
    );

    if (selected.length === 0) {
      setErrorMessage(explanation || 'No problems matched the selected criteria.');
      setIsGenerating(false);
      return;
    }

    const problemItems: GeneratedProblemItem[] = selected.map((p) => ({
      id: `${p.contestId}${p.index}`,
      problem: p,
      tagsRevealed: false,
      status: 'unsolved',
    }));

    const titleMode = activeFilter.distributionMode === 'progressive' ? 'Mashup Contest' : 'Practice Set';
    const newSet: GeneratedContestSet = {
      id: `contest_${Date.now()}`,
      createdAt: Date.now(),
      title: `Codeforces ${titleMode} (${activeFilter.problemCount} Problems, ${activeFilter.minRating}–${activeFilter.maxRating})`,
      filterUsed: activeFilter,
      problems: problemItems,
      allTagsRevealed: false,
      isRealContest: false,
    };

    setContestSet(newSet);
    setActiveTab('contest');
    setIsGenerating(false);

    setHistorySets((prev) => {
      const nextHist = [newSet, ...prev.slice(0, 9)];
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_HISTORY, JSON.stringify(nextHist));
      } catch (e) {}
      return nextHist;
    });
  }, [allProblems, contestsMap, users, filter]);

  // Handler: Unified Generate
  const handleGenerateContest = useCallback(() => {
    if (filter.generatorMode === 'real_contest') {
      handleGenerateOfficialContest();
    } else {
      handleGenerateProblemSet();
    }
  }, [filter.generatorMode, handleGenerateOfficialContest, handleGenerateProblemSet]);

  // Handler: Toggle single problem tags reveal
  const handleToggleRevealTag = (problemId: string) => {
    if (!contestSet) return;
    setContestSet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        problems: prev.problems.map((p) => {
          if (`${p.problem.contestId}${p.problem.index}` === problemId) {
            return { ...p, tagsRevealed: !p.tagsRevealed };
          }
          return p;
        }),
      };
    });
  };

  // Handler: Master Reveal / Hide All Tags
  const handleToggleRevealAllTags = () => {
    if (!contestSet) return;
    const nextState = !contestSet.allTagsRevealed;
    setContestSet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        allTagsRevealed: nextState,
        problems: prev.problems.map((p) => ({ ...p, tagsRevealed: nextState })),
      };
    });
  };

  // Handler: Reroll single problem
  const handleRerollProblem = (problemId: string) => {
    if (!contestSet || allProblems.length === 0) return;
    setRerollingProblemId(problemId);

    const targetItem = contestSet.problems.find(
      (p) => `${p.problem.contestId}${p.problem.index}` === problemId
    );
    if (!targetItem) {
      setRerollingProblemId(null);
      return;
    }

    const currentUsedIds = new Set(
      contestSet.problems.map((p) => `${p.problem.contestId}${p.problem.index}`)
    );

    // Generate candidates
    const singleFilter: GeneratorFilter = {
      ...contestSet.filterUsed,
      problemCount: 50,
      minRating: targetItem.problem.rating ? Math.max(800, targetItem.problem.rating - 100) : filter.minRating,
      maxRating: targetItem.problem.rating ? targetItem.problem.rating + 100 : filter.maxRating,
    };

    const { selected } = generateRandomProblems(allProblems, contestsMap, users, singleFilter);
    const replacement = selected.find(
      (p) => !currentUsedIds.has(`${p.contestId}${p.index}`)
    );

    if (replacement) {
      setContestSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          problems: prev.problems.map((p) => {
            if (`${p.problem.contestId}${p.problem.index}` === problemId) {
              return {
                id: `${replacement.contestId}${replacement.index}`,
                problem: replacement,
                tagsRevealed: false,
                status: 'unsolved',
              };
            }
            return p;
          }),
        };
      });
    }

    setTimeout(() => setRerollingProblemId(null), 300);
  };

  // Handler: Update status (unsolved, attempted, solved)
  const handleUpdateStatus = (problemId: string, status: 'unsolved' | 'solved' | 'attempted') => {
    if (!contestSet) return;
    setContestSet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        problems: prev.problems.map((p) => {
          if (`${p.problem.contestId}${p.problem.index}` === problemId) {
            return { ...p, status };
          }
          return p;
        }),
      };
    });
  };

  // Handler: Check live solves on Codeforces
  const handleCheckLiveSolves = async (): Promise<number> => {
    if (!contestSet || selectedUserHandles.length === 0) return 0;

    let newlySolvedCount = 0;
    const currentProblemIds = contestSet.problems.map(
      (p) => `${p.problem.contestId}${p.problem.index.toUpperCase()}`
    );

    // Refresh all selected users
    const updatedUsers: CFUser[] = [];
    const freshlySolvedProblemIds = new Set<string>();

    for (const u of users) {
      if (selectedUserHandles.includes(u.handle)) {
        const fresh = await loadFullUserProfile(u.handle);
        updatedUsers.push(fresh);
        for (const pid of fresh.solvedProblemIds) {
          freshlySolvedProblemIds.add(pid.toUpperCase());
        }
      } else {
        updatedUsers.push(u);
      }
    }

    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);

    // Check which problems in active set are now solved
    setContestSet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        problems: prev.problems.map((p) => {
          const pid = `${p.problem.contestId}${p.problem.index.toUpperCase()}`;
          if (freshlySolvedProblemIds.has(pid) && p.status !== 'solved') {
            newlySolvedCount++;
            return { ...p, status: 'solved' };
          }
          return p;
        }),
      };
    });

    return newlySolvedCount;
  };

  // Auto-generate on first problemset load if no contest exists and users are present
  useEffect(() => {
    if (!contestSet && allProblems.length > 0 && !isLoadingProblems) {
      handleGenerateContest();
    }
  }, [allProblems.length, isLoadingProblems]);

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-700 dark:selection:bg-blue-500/30 dark:selection:text-blue-200 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          {/* Logo & Brand (No subtitle text) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 shrink-0">
              <Code2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                CF Contest &amp; Problem Gen
              </span>
              <span className="text-[10px] uppercase font-mono font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 px-1 py-0.5 rounded">
                v2.0
              </span>
            </div>
          </div>

          {/* Right Navigation & Theme Switcher - Single Line */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nav Tabs */}
            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                id="nav-tab-contest"
                onClick={() => setActiveTab('contest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'contest'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight text-left hidden sm:inline">
                  <span className="block font-bold">Active</span>
                  <span className="block text-[10px] opacity-80">Set</span>
                </span>
              </button>

              <button
                type="button"
                id="nav-tab-contest-gen"
                onClick={() => {
                  setFilter((prev) => ({ ...prev, generatorMode: 'real_contest' }));
                  setActiveTab('contest_gen');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'contest_gen'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="leading-tight text-left">
                  <span className="block font-bold">Contest</span>
                  <span className="block text-[10px] opacity-80">Generator</span>
                </span>
              </button>

              <button
                type="button"
                id="nav-tab-problem-gen"
                onClick={() => {
                  setFilter((prev) => ({ ...prev, generatorMode: 'mashup_custom' }));
                  setActiveTab('problem_gen');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'problem_gen'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="leading-tight text-left">
                  <span className="block font-bold">Problem</span>
                  <span className="block text-[10px] opacity-80">Generator</span>
                </span>
              </button>

              <button
                type="button"
                id="nav-tab-checker"
                onClick={() => setActiveTab('checker')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'checker'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight text-left hidden md:inline">
                  <span className="block font-bold">Solve</span>
                  <span className="block text-[10px] opacity-80">Checker</span>
                </span>
              </button>

              <button
                type="button"
                id="nav-tab-users"
                onClick={() => setActiveTab('users')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative cursor-pointer shrink-0 ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight text-left hidden sm:inline">
                  <span className="block font-bold">Users</span>
                  <span className="block text-[10px] opacity-80">({users.length})</span>
                </span>
                {users.length > 0 && (
                  <span className="sm:hidden w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              {historySets.length > 0 && (
                <button
                  type="button"
                  id="nav-tab-history"
                  onClick={() => setActiveTab('history')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight text-left hidden md:inline">
                    <span className="block font-bold">Past</span>
                    <span className="block text-[10px] opacity-80">History</span>
                  </span>
                </button>
              )}
            </nav>

            {/* Day / Night Theme Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
              <button
                type="button"
                id="theme-btn-day"
                onClick={() => {
                  if (isDark) toggleTheme();
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Switch to Day Theme"
              >
                <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                <span className="text-[11px] hidden sm:inline">Day</span>
              </button>

              <button
                type="button"
                id="theme-btn-night"
                onClick={() => {
                  if (!isDark) toggleTheme();
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-blue-300 shadow-sm border border-slate-700 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Switch to Night Theme"
              >
                <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400 fill-blue-400/40' : 'text-slate-400'}`} />
                <span className="text-[11px] hidden sm:inline">Night</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Loading / Status Banner */}
        {isLoadingProblems && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/40 text-blue-800 dark:text-blue-200 flex items-center justify-between gap-3 text-xs font-mono animate-pulse">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span>{problemProgressMsg || 'Loading official Codeforces problem repository...'}</span>
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400/80 hidden sm:inline">Official CF API</span>
          </div>
        )}

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              id="dismiss-error-btn"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 dark:text-rose-400 hover:underline text-xs font-mono font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Generator Quick Launcher */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
                  filter.generatorMode === 'real_contest'
                    ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40'
                    : 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40'
                }`}>
                  <Trophy className="w-3.5 h-3.5" />
                  {filter.generatorMode === 'real_contest' ? `Official CF Contest (${(filter.contestTypeFilter || 'all').toUpperCase()})` : `Custom Mashup (${filter.problemCount} Pbs)`}
                </span>

                {filter.generatorMode !== 'real_contest' && (
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    Rating: <strong className="text-slate-900 dark:text-slate-200">{filter.minRating}–{filter.maxRating}</strong>
                  </span>
                )}

                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Age: <strong className="text-slate-900 dark:text-slate-200">{filter.ageFilter}</strong>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Unsolved for: <strong className="text-blue-600 dark:text-blue-400">{selectedUserHandles.length} user{selectedUserHandles.length !== 1 ? 's' : ''}</strong>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeTab === 'contest_gen'
                  ? 'Official Codeforces Contest Generator'
                  : activeTab === 'problem_gen'
                  ? 'Custom Problemset & Mashup Generator'
                  : 'Quick Generator Actions'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Choose between generating a complete official Codeforces Round or building a custom difficulty mashup.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                id="hero-contest-gen-btn"
                onClick={() => {
                  setFilter((prev) => ({ ...prev, generatorMode: 'real_contest' }));
                  setActiveTab('contest_gen');
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'contest_gen'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Contest Generator</span>
              </button>

              <button
                type="button"
                id="hero-problem-gen-btn"
                onClick={() => {
                  setFilter((prev) => ({ ...prev, generatorMode: 'mashup_custom' }));
                  setActiveTab('problem_gen');
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'problem_gen'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Problem Generator</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Active Contest & Problems View */}
        {activeTab === 'contest' && (
          <div className="space-y-6">
            {contestSet ? (
              <ContestView
                contestSet={contestSet}
                onToggleRevealTag={handleToggleRevealTag}
                onToggleRevealAllTags={handleToggleRevealAllTags}
                onRerollProblem={handleRerollProblem}
                onRerollAll={handleGenerateContest}
                onUpdateStatus={handleUpdateStatus}
                onCheckLiveSolves={handleCheckLiveSolves}
                isGenerating={isGenerating}
                rerollingProblemId={rerollingProblemId}
              />
            ) : (
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                <Trophy className="w-12 h-12 mx-auto text-blue-500/50 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Contest Generated Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                  Choose Contest Generator for an official virtual round or Problem Generator for a custom ladder!
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    id="empty-contest-gen-btn"
                    onClick={() => setActiveTab('contest_gen')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    Open Contest Generator
                  </button>
                  <button
                    type="button"
                    id="empty-prob-gen-btn"
                    onClick={() => setActiveTab('problem_gen')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Open Problem Generator
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Contest Generator Tab */}
        {activeTab === 'contest_gen' && (
          <div className="space-y-6">
            <ContestGeneratorView
              filter={filter}
              onChange={setFilter}
              onGenerate={handleGenerateOfficialContest}
              isGenerating={isGenerating}
              users={users}
              selectedUserHandles={selectedUserHandles}
            />
          </div>
        )}

        {/* Tab 3: Problem Generator Tab */}
        {activeTab === 'problem_gen' && (
          <div className="space-y-6">
            <ProblemGeneratorView
              filter={filter}
              onChange={setFilter}
              onGenerate={handleGenerateProblemSet}
              isGenerating={isGenerating}
              totalCandidatePool={eligiblePoolCount}
            />
          </div>
        )}

        {/* Tab 4: Problem Solver Status Lookup */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            <ProblemSolveChecker
              users={users}
              allProblems={allProblems}
              currentContestProblems={contestSet?.problems.map((p) => p.problem) || []}
              onAddUser={handleAddUser}
              isAddingUser={isAddingUser}
            />
          </div>
        )}

        {/* Tab 5: Users & Profiles */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserManagement
              users={users}
              selectedHandles={selectedUserHandles}
              onToggleUser={handleToggleUser}
              onSelectAll={handleSelectAllUsers}
              onDeselectAll={handleDeselectAllUsers}
              onAddUser={handleAddUser}
              onRefreshUser={handleRefreshUser}
              onRefreshAll={handleRefreshAllUsers}
              onRemoveUser={handleRemoveUser}
              isAdding={isAddingUser}
              refreshingHandle={refreshingHandle}
            />
          </div>
        )}

        {/* Tab 6: History */}
        {activeTab === 'history' && (
          <div id="history-section" className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contest History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Saved problem sets generated in previous sessions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="clear-history-btn"
                onClick={() => {
                  setHistorySets([]);
                  localStorage.removeItem(STORAGE_KEY_SAVED_HISTORY);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {historySets.map((hist, idx) => (
                <div
                  key={hist.id || idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                      <span>{new Date(hist.createdAt).toLocaleString()}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{hist.problems.length} problems</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{hist.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                      Ratings: {hist.filterUsed.minRating}–{hist.filterUsed.maxRating} &bull; Age: {hist.filterUsed.ageFilter}
                    </p>
                  </div>

                  <button
                    type="button"
                    id={`load-history-${idx}`}
                    onClick={() => {
                      setContestSet(hist);
                      setActiveTab('contest');
                    }}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Load This Contest</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/90 py-6 text-center text-xs text-slate-500 font-mono transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Powered by Codeforces Official API</span>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <a
              href="https://codeforces.com/problemset"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <span>Codeforces Problemset</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
