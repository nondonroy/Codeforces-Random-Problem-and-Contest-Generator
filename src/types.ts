export interface CFUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution?: number;
  friendOfCount?: number;
  registrationTimeSeconds?: number;
  lastOnlineTimeSeconds?: number;
  solvedCount: number;
  solvedProblemIds: string[]; // Set of "contestId+index" e.g., "1800A"
  lastUpdated: number;
}

export interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  type?: string;
  points?: number;
  rating?: number;
  tags: string[];
  solvedCount?: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
  verdict?: string; // "OK", "WRONG_ANSWER", etc.
  programmingLanguage?: string;
  testset?: string;
  passedTestCount?: number;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
}

export interface UserProblemSolveResult {
  user: CFUser;
  isSolved: boolean;
  hasAttempted: boolean;
  submissionsCount: number;
  bestVerdict?: string;
  firstSolvedTimeSeconds?: number;
  lastAttemptTimeSeconds?: number;
  latestLanguage?: string;
  submissions: CFSubmission[];
}

export interface CFContestInfo {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
}

export type AgeFilterOption =
  | 'all'
  | '6months'
  | '1year'
  | '2years'
  | '3years'
  | '5years'
  | 'modern' // contestId >= 1300 (~2020+)
  | 'custom';

export type ContestDistributionMode = 'uniform' | 'progressive' | 'custom_slots';

export type GeneratorMode = 'mashup_custom' | 'real_contest';

export interface GeneratorFilter {
  generatorMode?: GeneratorMode; // 'mashup_custom' (curated ladder/random problems) or 'real_contest' (an actual official CF contest)
  problemCount: number; // default 10
  minRating: number;    // e.g. 800
  maxRating: number;    // e.g. 2000
  ageFilter: AgeFilterOption;
  customMinContestId?: number;
  customMaxContestId?: number;
  distributionMode: ContestDistributionMode;
  selectedTags: string[];
  tagMode: 'any' | 'all' | 'exclude';
  allowUnrated: boolean;
  selectedUserHandles: string[];
  // Real Contest Filters
  contestTypeFilter?: 'all' | 'div1' | 'div2' | 'div3' | 'div4' | 'educational' | 'global';
  requireAllUnsolved?: boolean; // Ensure 100% of problems in the contest are unsolved by selected users
}

export interface GeneratedProblemItem {
  id: string; // `${contestId}${index}`
  problem: CFProblem;
  tagsRevealed: boolean;
  status: 'unsolved' | 'solved' | 'attempted';
  notes?: string;
  assignedSlot?: string; // e.g. 'Problem A (1200)', 'Problem B (1400)'
}

export interface GeneratedContestSet {
  id: string;
  createdAt: number;
  title: string;
  filterUsed: GeneratorFilter;
  problems: GeneratedProblemItem[];
  allTagsRevealed: boolean;
  isRealContest?: boolean;
  originalContestId?: number;
  originalContestName?: string;
}
