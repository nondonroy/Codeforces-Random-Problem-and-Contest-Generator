import { CFContestInfo, CFProblem, CFSubmission, CFUser, GeneratorFilter } from '../types';

const BASE_URL = 'https://codeforces.com/api';
const STORAGE_KEY_SAVED_USERS = 'cf_gen_saved_users_v2';
const STORAGE_KEY_PROBLEMSET_CACHE = 'cf_gen_problems_cache_v2';
const STORAGE_KEY_CONTESTS_CACHE = 'cf_gen_contests_cache_v2';
const CACHE_TTL_PROBLEMS = 1000 * 60 * 60 * 4; // 4 hours
const CACHE_TTL_USERS = 1000 * 60 * 15; // 15 minutes

interface CachedProblemData {
  timestamp: number;
  problems: CFProblem[];
}

interface CachedContestData {
  timestamp: number;
  contests: Record<number, CFContestInfo>;
}

// Memory fallback cache
let memoryProblems: CFProblem[] | null = null;
let memoryContestsMap: Map<number, CFContestInfo> | null = null;

export async function fetchCFUserInfo(handle: string): Promise<Partial<CFUser>> {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error('Handle cannot be empty');

  const res = await fetch(`${BASE_URL}/user.info?handles=${encodeURIComponent(trimmed)}`);
  if (!res.ok) {
    if (res.status === 400 || res.status === 404) {
      throw new Error(`User "${trimmed}" not found on Codeforces`);
    }
    throw new Error(`Failed to fetch user info (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  if (data.status !== 'OK' || !data.result || data.result.length === 0) {
    throw new Error(data.comment || `User "${trimmed}" not found`);
  }

  const raw = data.result[0];
  return {
    handle: raw.handle,
    rating: raw.rating,
    maxRating: raw.maxRating,
    rank: raw.rank,
    maxRank: raw.maxRank,
    avatar: raw.avatar?.startsWith('//') ? `https:${raw.avatar}` : raw.avatar,
    titlePhoto: raw.titlePhoto?.startsWith('//') ? `https:${raw.titlePhoto}` : raw.titlePhoto,
    contribution: raw.contribution,
    friendOfCount: raw.friendOfCount,
    registrationTimeSeconds: raw.registrationTimeSeconds,
    lastOnlineTimeSeconds: raw.lastOnlineTimeSeconds,
  };
}

export async function fetchCFUserSolved(handle: string): Promise<{ solvedIds: string[]; totalSolved: number }> {
  const trimmed = handle.trim();
  const res = await fetch(`${BASE_URL}/user.status?handle=${encodeURIComponent(trimmed)}&from=1&count=10000`);
  if (!res.ok) {
    throw new Error(`Failed to fetch submissions for "${trimmed}"`);
  }

  const data = await res.json();
  if (data.status !== 'OK' || !Array.isArray(data.result)) {
    throw new Error(data.comment || 'Failed to parse user submissions');
  }

  const solvedSet = new Set<string>();
  for (const sub of data.result as CFSubmission[]) {
    if (sub.verdict === 'OK' && sub.problem && sub.problem.contestId && sub.problem.index) {
      const pid = `${sub.problem.contestId}${sub.problem.index.toUpperCase()}`;
      solvedSet.add(pid);
    }
  }

  const solvedIds = Array.from(solvedSet);
  return {
    solvedIds,
    totalSolved: solvedIds.length,
  };
}

export async function loadFullUserProfile(handle: string): Promise<CFUser> {
  const info = await fetchCFUserInfo(handle);
  const solved = await fetchCFUserSolved(info.handle || handle);

  return {
    handle: info.handle || handle,
    rating: info.rating,
    maxRating: info.maxRating,
    rank: info.rank,
    maxRank: info.maxRank,
    avatar: info.avatar,
    titlePhoto: info.titlePhoto,
    contribution: info.contribution,
    friendOfCount: info.friendOfCount,
    registrationTimeSeconds: info.registrationTimeSeconds,
    lastOnlineTimeSeconds: info.lastOnlineTimeSeconds,
    solvedCount: solved.totalSolved,
    solvedProblemIds: solved.solvedIds,
    lastUpdated: Date.now(),
  };
}

export function getSavedUsers(): CFUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read saved users from localStorage', e);
    return [];
  }
}

export function saveUsersToStorage(users: CFUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
}

export async function fetchContestsList(): Promise<Map<number, CFContestInfo>> {
  if (memoryContestsMap && memoryContestsMap.size > 0) {
    return memoryContestsMap;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTESTS_CACHE);
    if (raw) {
      const cached: CachedContestData = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL_PROBLEMS && cached.contests) {
        const map = new Map<number, CFContestInfo>();
        for (const [id, contest] of Object.entries(cached.contests)) {
          map.set(Number(id), contest);
        }
        memoryContestsMap = map;
        return map;
      }
    }
  } catch (e) {
    console.warn('Error reading contest cache:', e);
  }

  try {
    const res = await fetch(`${BASE_URL}/contest.list?gym=false`);
    if (!res.ok) throw new Error('Contest list request failed');
    const data = await res.json();
    if (data.status === 'OK' && Array.isArray(data.result)) {
      const map = new Map<number, CFContestInfo>();
      const record: Record<number, CFContestInfo> = {};
      for (const c of data.result as CFContestInfo[]) {
        map.set(c.id, c);
        record[c.id] = c;
      }
      memoryContestsMap = map;
      try {
        localStorage.setItem(
          STORAGE_KEY_CONTESTS_CACHE,
          JSON.stringify({ timestamp: Date.now(), contests: record } as CachedContestData)
        );
      } catch (e) {
        // quota exceeded or ignore
      }
      return map;
    }
  } catch (e) {
    console.warn('Failed to fetch live contest list, proceeding with problemset fallback', e);
  }

  return memoryContestsMap || new Map<number, CFContestInfo>();
}

export async function fetchAllProblems(onProgress?: (msg: string) => void): Promise<CFProblem[]> {
  if (memoryProblems && memoryProblems.length > 0) {
    return memoryProblems;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROBLEMSET_CACHE);
    if (raw) {
      const cached: CachedProblemData = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL_PROBLEMS && Array.isArray(cached.problems) && cached.problems.length > 500) {
        memoryProblems = cached.problems;
        return cached.problems;
      }
    }
  } catch (e) {
    console.warn('Error reading problem cache:', e);
  }

  onProgress?.('Fetching official Codeforces problem repository (~9,000+ problems)...');
  const res = await fetch(`${BASE_URL}/problemset.problems`);
  if (!res.ok) {
    throw new Error(`Failed to load Codeforces problemset (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  if (data.status !== 'OK' || !data.result || !Array.isArray(data.result.problems)) {
    throw new Error(data.comment || 'Invalid problemset response from Codeforces');
  }

  const statMap = new Map<string, number>();
  if (Array.isArray(data.result.problemStatistics)) {
    for (const stat of data.result.problemStatistics) {
      if (stat.contestId && stat.index) {
        statMap.set(`${stat.contestId}${stat.index.toUpperCase()}`, stat.solvedCount || 0);
      }
    }
  }

  const problems: CFProblem[] = data.result.problems.map((p: CFProblem) => {
    const key = `${p.contestId}${p.index.toUpperCase()}`;
    return {
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      type: p.type,
      points: p.points,
      rating: p.rating,
      tags: Array.isArray(p.tags) ? p.tags : [],
      solvedCount: statMap.get(key) || 0,
    };
  });

  memoryProblems = problems;

  try {
    localStorage.setItem(
      STORAGE_KEY_PROBLEMSET_CACHE,
      JSON.stringify({ timestamp: Date.now(), problems } as CachedProblemData)
    );
  } catch (e) {
    console.warn('Failed to cache problems to localStorage (likely size limit, held in memory)');
  }

  return problems;
}

// Shuffles array randomly (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Filter and sample problems
export function generateRandomProblems(
  allProblems: CFProblem[],
  contestsMap: Map<number, CFContestInfo>,
  selectedUsers: CFUser[],
  filter: GeneratorFilter
): { selected: CFProblem[]; totalMatching: number; explanation: string } {
  // Build set of solved problem IDs across all selected users
  const globalSolvedSet = new Set<string>();
  for (const user of selectedUsers) {
    if (filter.selectedUserHandles.includes(user.handle)) {
      for (const id of user.solvedProblemIds) {
        globalSolvedSet.add(id.toUpperCase());
      }
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  // Filter candidate problem pool
  const matching = allProblems.filter((p) => {
    if (!p.contestId || !p.index) return false;
    const pid = `${p.contestId}${p.index.toUpperCase()}`;

    // 1. Unsolved for all selected users
    if (globalSolvedSet.has(pid)) {
      return false;
    }

    // 2. Rating Filter
    if (p.rating !== undefined) {
      if (p.rating < filter.minRating || p.rating > filter.maxRating) {
        return false;
      }
    } else {
      if (!filter.allowUnrated) return false;
    }

    // 3. Age filter
    if (filter.ageFilter !== 'all') {
      const contest = contestsMap.get(p.contestId);
      const contestStart = contest?.startTimeSeconds;

      if (filter.ageFilter === '6months') {
        const threshold = nowSeconds - 180 * 86400;
        if (contestStart && contestStart < threshold) return false;
        // Approximate fallback if contest date not in map
        if (!contestStart && p.contestId < 1950) return false;
      } else if (filter.ageFilter === '1year') {
        const threshold = nowSeconds - 365 * 86400;
        if (contestStart && contestStart < threshold) return false;
        if (!contestStart && p.contestId < 1900) return false;
      } else if (filter.ageFilter === '2years') {
        const threshold = nowSeconds - 2 * 365 * 86400;
        if (contestStart && contestStart < threshold) return false;
        if (!contestStart && p.contestId < 1750) return false;
      } else if (filter.ageFilter === '3years') {
        const threshold = nowSeconds - 3 * 365 * 86400;
        if (contestStart && contestStart < threshold) return false;
        if (!contestStart && p.contestId < 1600) return false;
      } else if (filter.ageFilter === '5years') {
        const threshold = nowSeconds - 5 * 365 * 86400;
        if (contestStart && contestStart < threshold) return false;
        if (!contestStart && p.contestId < 1300) return false;
      } else if (filter.ageFilter === 'modern') {
        // Modern era (Contest ID >= 1300, ~2020+)
        if (p.contestId < 1300) return false;
      } else if (filter.ageFilter === 'custom') {
        if (filter.customMinContestId && p.contestId < filter.customMinContestId) return false;
        if (filter.customMaxContestId && p.contestId > filter.customMaxContestId) return false;
      }
    }

    // 4. Tag filters
    if (filter.selectedTags.length > 0) {
      const pTags = p.tags || [];
      if (filter.tagMode === 'any') {
        const hasAny = filter.selectedTags.some((t) => pTags.includes(t));
        if (!hasAny) return false;
      } else if (filter.tagMode === 'all') {
        const hasAll = filter.selectedTags.every((t) => pTags.includes(t));
        if (!hasAll) return false;
      } else if (filter.tagMode === 'exclude') {
        const hasExcluded = filter.selectedTags.some((t) => pTags.includes(t));
        if (hasExcluded) return false;
      }
    }

    return true;
  });

  const totalMatching = matching.length;
  if (totalMatching === 0) {
    return {
      selected: [],
      totalMatching: 0,
      explanation: 'No problems matched your current criteria. Try widening the rating range, allowing older contests, or unchecking some users.',
    };
  }

  // Distribution selection: Progressive ladder vs Uniform random
  const count = Math.min(filter.problemCount, matching.length);
  let selectedProblems: CFProblem[] = [];

  if (filter.distributionMode === 'progressive' && count > 1 && filter.maxRating > filter.minRating) {
    // Generate an escalating difficulty curve (like a real contest: Div 3 / Div 2 / Div 1 ladder)
    const ratingStep = (filter.maxRating - filter.minRating) / count;
    const usedProblemIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      const slotMin = Math.round(filter.minRating + i * ratingStep);
      const slotMax = Math.round(filter.minRating + (i + 1) * ratingStep + (i === count - 1 ? 0 : -1));

      // Find candidate problems in this rating slice
      let slotCandidates = matching.filter((p) => {
        const pid = `${p.contestId}${p.index}`;
        if (usedProblemIds.has(pid)) return false;
        const r = p.rating || filter.minRating;
        return r >= slotMin - 50 && r <= slotMax + 50;
      });

      if (slotCandidates.length === 0) {
        // Fallback: pick any unused closest problem
        slotCandidates = matching.filter((p) => !usedProblemIds.has(`${p.contestId}${p.index}`));
      }

      if (slotCandidates.length > 0) {
        const shuffledSlot = shuffleArray(slotCandidates);
        const chosen = shuffledSlot[0];
        usedProblemIds.add(`${chosen.contestId}${chosen.index}`);
        selectedProblems.push(chosen);
      }
    }

    // Sort by rating ascending so Problem A is easiest, Problem B is harder, etc.
    selectedProblems.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  } else {
    // Uniform random selection
    const shuffled = shuffleArray(matching);
    selectedProblems = shuffled.slice(0, count);
  }

  return {
    selected: selectedProblems,
    totalMatching,
    explanation: `Found ${totalMatching} eligible unsolved problems matching all parameters. Selected ${selectedProblems.length} unique randomized problems.`,
  };
}

// Generate an entire Official Real Codeforces Contest for virtual participation
export function generateRealContest(
  allProblems: CFProblem[],
  contestsMap: Map<number, CFContestInfo>,
  selectedUsers: CFUser[],
  filter: GeneratorFilter
): {
  contest: CFContestInfo | null;
  problems: CFProblem[];
  totalEligibleContests: number;
  explanation: string;
} {
  // 1. Group all problems by contestId
  const contestProblemsMap = new Map<number, CFProblem[]>();
  for (const p of allProblems) {
    if (!p.contestId || !p.index) continue;
    if (!contestProblemsMap.has(p.contestId)) {
      contestProblemsMap.set(p.contestId, []);
    }
    contestProblemsMap.get(p.contestId)!.push(p);
  }

  // 2. Build global solved set
  const globalSolvedSet = new Set<string>();
  for (const user of selectedUsers) {
    if (filter.selectedUserHandles.includes(user.handle)) {
      for (const id of user.solvedProblemIds) {
        globalSolvedSet.add(id.toUpperCase());
      }
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const eligibleContests: { contest: CFContestInfo; problems: CFProblem[] }[] = [];

  for (const [contestId, pList] of contestProblemsMap.entries()) {
    // Only real contests with at least 3 problems
    if (pList.length < 3) continue;

    const contestInfo = contestsMap.get(contestId) || {
      id: contestId,
      name: `Codeforces Round #${contestId}`,
      type: 'CF',
      phase: 'FINISHED',
      frozen: false,
      durationSeconds: 7200,
    };

    // Filter by contest type if specified
    const cName = contestInfo.name.toLowerCase();
    if (filter.contestTypeFilter && filter.contestTypeFilter !== 'all') {
      if (filter.contestTypeFilter === 'div1' && !cName.includes('div. 1') && !cName.includes('div.1')) continue;
      if (filter.contestTypeFilter === 'div2' && !cName.includes('div. 2') && !cName.includes('div.2')) continue;
      if (filter.contestTypeFilter === 'div3' && !cName.includes('div. 3') && !cName.includes('div.3')) continue;
      if (filter.contestTypeFilter === 'div4' && !cName.includes('div. 4') && !cName.includes('div.4')) continue;
      if (filter.contestTypeFilter === 'educational' && !cName.includes('educational')) continue;
      if (filter.contestTypeFilter === 'global' && !cName.includes('global')) continue;
    }

    // Filter by age
    if (filter.ageFilter !== 'all') {
      const contestStart = contestInfo.startTimeSeconds;
      if (filter.ageFilter === '6months') {
        const threshold = nowSeconds - 180 * 86400;
        if (contestStart && contestStart < threshold) continue;
        if (!contestStart && contestId < 1950) continue;
      } else if (filter.ageFilter === '1year') {
        const threshold = nowSeconds - 365 * 86400;
        if (contestStart && contestStart < threshold) continue;
        if (!contestStart && contestId < 1900) continue;
      } else if (filter.ageFilter === '2years') {
        const threshold = nowSeconds - 2 * 365 * 86400;
        if (contestStart && contestStart < threshold) continue;
        if (!contestStart && contestId < 1750) continue;
      } else if (filter.ageFilter === '3years') {
        const threshold = nowSeconds - 3 * 365 * 86400;
        if (contestStart && contestStart < threshold) continue;
        if (!contestStart && contestId < 1600) continue;
      } else if (filter.ageFilter === '5years') {
        const threshold = nowSeconds - 5 * 365 * 86400;
        if (contestStart && contestStart < threshold) continue;
        if (!contestStart && contestId < 1300) continue;
      } else if (filter.ageFilter === 'modern') {
        if (contestId < 1300) continue;
      } else if (filter.ageFilter === 'custom') {
        if (filter.customMinContestId && contestId < filter.customMinContestId) continue;
        if (filter.customMaxContestId && contestId > filter.customMaxContestId) continue;
      }
    }

    // Check solved status of problems in contest
    const sortedProblems = [...pList].sort((a, b) => a.index.localeCompare(b.index));
    const solvedInThisContest = sortedProblems.filter((p) =>
      globalSolvedSet.has(`${p.contestId}${p.index.toUpperCase()}`)
    );

    // If requireAllUnsolved is set (or by default when users are selected), make sure 0 problems solved
    if (filter.requireAllUnsolved !== false && filter.selectedUserHandles.length > 0) {
      if (solvedInThisContest.length > 0) continue;
    }

    eligibleContests.push({
      contest: contestInfo,
      problems: sortedProblems,
    });
  }

  if (eligibleContests.length === 0) {
    return {
      contest: null,
      problems: [],
      totalEligibleContests: 0,
      explanation: 'No full official contests matched your criteria where all problems are unsolved. Try relaxing the division, age range, or unchecking some handles.',
    };
  }

  // Pick a random contest from eligible ones
  const chosen = eligibleContests[Math.floor(Math.random() * eligibleContests.length)];

  return {
    contest: chosen.contest,
    problems: chosen.problems,
    totalEligibleContests: eligibleContests.length,
    explanation: `Selected official contest: "${chosen.contest.name}" (Contest #${chosen.contest.id}) with ${chosen.problems.length} problems (all unsolved for selected users).`,
  };
}


export function parseProblemId(input: string): { contestId: number; index: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match full URL: e.g. https://codeforces.com/contest/2050/problem/A or https://codeforces.com/problemset/problem/2050/A
  const urlMatch = trimmed.match(/(?:contest|problemset\/problem)\/(\d+)(?:\/problem)?\/([a-zA-Z0-9]+)/i);
  if (urlMatch) {
    return {
      contestId: parseInt(urlMatch[1], 10),
      index: urlMatch[2].toUpperCase(),
    };
  }

  // Match slash or space format: "2050/A", "2050 A", "2050-A", "2050_A"
  const slashMatch = trimmed.match(/^(\d+)[\s\/\-_]([a-zA-Z0-9]+)$/i);
  if (slashMatch) {
    return {
      contestId: parseInt(slashMatch[1], 10),
      index: slashMatch[2].toUpperCase(),
    };
  }

  // Match direct code format: "2050A", "2224F", "1234D1", "4A", "1B"
  const directMatch = trimmed.match(/^(\d{1,6})([a-zA-Z][a-zA-Z0-9]*)$/i);
  if (directMatch) {
    return {
      contestId: parseInt(directMatch[1], 10),
      index: directMatch[2].toUpperCase(),
    };
  }

  return null;
}

export async function fetchProblemDetails(
  contestId: number,
  index: string,
  problemPool: CFProblem[] = []
): Promise<CFProblem | null> {
  const normIndex = index.toUpperCase();
  const found = problemPool.find(
    (p) => p.contestId === contestId && p.index.toUpperCase() === normIndex
  );
  if (found) return found;

  // If not found in pool, attempt to query contest standings/problemset
  try {
    const res = await fetch(`${BASE_URL}/contest.standings?contestId=${contestId}&from=1&count=1&showUnofficial=true`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.result && Array.isArray(data.result.problems)) {
        const match = data.result.problems.find(
          (p: any) => p.index.toUpperCase() === normIndex
        );
        if (match) {
          return {
            contestId: match.contestId,
            index: match.index,
            name: match.name,
            type: match.type,
            points: match.points,
            rating: match.rating,
            tags: Array.isArray(match.tags) ? match.tags : [],
          };
        }
      }
    }
  } catch (e) {
    console.warn('Contest query fallback failed:', e);
  }

  // Return basic placeholder metadata
  return {
    contestId,
    index: normIndex,
    name: `Problem ${contestId}${normIndex}`,
    tags: [],
  };
}

export async function fetchUserSubmissionsForProblem(
  handle: string,
  contestId: number,
  index: string
): Promise<CFSubmission[]> {
  const normIndex = index.toUpperCase();
  try {
    const res = await fetch(`${BASE_URL}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== 'OK' || !Array.isArray(data.result)) return [];

    const matchedSubs: CFSubmission[] = [];
    for (const sub of data.result) {
      if (
        sub.problem &&
        sub.problem.contestId === contestId &&
        sub.problem.index.toUpperCase() === normIndex
      ) {
        matchedSubs.push({
          id: sub.id,
          contestId: sub.contestId,
          creationTimeSeconds: sub.creationTimeSeconds,
          relativeTimeSeconds: sub.relativeTimeSeconds,
          problem: {
            contestId: sub.problem.contestId,
            index: sub.problem.index,
            name: sub.problem.name,
            rating: sub.problem.rating,
            tags: Array.isArray(sub.problem.tags) ? sub.problem.tags : [],
          },
          verdict: sub.verdict,
          programmingLanguage: sub.programmingLanguage,
          testset: sub.testset,
          passedTestCount: sub.passedTestCount,
          timeConsumedMillis: sub.timeConsumedMillis,
          memoryConsumedBytes: sub.memoryConsumedBytes,
        });
      }
    }

    // Sort latest first
    matchedSubs.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
    return matchedSubs;
  } catch (e) {
    console.warn(`Failed to fetch submissions for user ${handle}:`, e);
    return [];
  }
}

export const COMMON_CF_TAGS = [
  'implementation',
  'math',
  'greedy',
  'dp',
  'data structures',
  'brute force',
  'constructive algorithms',
  'graphs',
  'sortings',
  'binary search',
  'dfs and similar',
  'trees',
  'strings',
  'number theory',
  'combinatorics',
  'two pointers',
  'geometry',
  'bitmasks',
  'dsu',
  'shortest paths',
  'probabilities',
  'divide and conquer',
  'hashing',
  'games',
  'flows',
  'matrices',
  'string suffix structures',
  'interactive',
  'meet-in-the-middle',
  'ternary search',
  '2-sat',
];
