export interface RankInfo {
  name: string;
  colorClass: string;
  textColor: string;
  lightTextColor: string;
  badgeBg: string;
  lightBadgeBg: string;
  isLegendary?: boolean;
}

export function getRankInfo(rating?: number, isLightMode = false): RankInfo {
  if (rating === undefined || rating === null) {
    return {
      name: 'Unrated',
      colorClass: 'text-slate-400 dark:text-slate-400',
      textColor: '#94a3b8',
      lightTextColor: '#64748b',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      lightBadgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  if (rating < 1200) {
    return {
      name: 'Newbie',
      colorClass: 'text-zinc-500 dark:text-zinc-400',
      textColor: isLightMode ? '#52525b' : '#a1a1aa',
      lightTextColor: '#52525b',
      badgeBg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
      lightBadgeBg: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    };
  }
  if (rating < 1400) {
    return {
      name: 'Pupil',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      textColor: isLightMode ? '#059669' : '#34d399',
      lightTextColor: '#059669',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
      lightBadgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  }
  if (rating < 1600) {
    return {
      name: 'Specialist',
      colorClass: 'text-cyan-700 dark:text-cyan-400',
      textColor: isLightMode ? '#0891b2' : '#22d3ee',
      lightTextColor: '#0891b2',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
      lightBadgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    };
  }
  if (rating < 1900) {
    return {
      name: 'Expert',
      colorClass: 'text-blue-600 dark:text-blue-400',
      textColor: isLightMode ? '#2563eb' : '#60a5fa',
      lightTextColor: '#2563eb',
      badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      lightBadgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
    };
  }
  if (rating < 2200) {
    return {
      name: 'Candidate Master',
      colorClass: 'text-purple-700 dark:text-purple-400',
      textColor: isLightMode ? '#7e22ce' : '#c084fc',
      lightTextColor: '#7e22ce',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
      lightBadgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
    };
  }
  if (rating < 2300) {
    return {
      name: 'Master',
      colorClass: 'text-amber-600 dark:text-amber-400',
      textColor: isLightMode ? '#d97706' : '#fbbf24',
      lightTextColor: '#d97706',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
      lightBadgeBg: 'bg-amber-50 text-amber-700 border-amber-300',
    };
  }
  if (rating < 2400) {
    return {
      name: 'International Master',
      colorClass: 'text-amber-700 dark:text-amber-500',
      textColor: isLightMode ? '#b45309' : '#f59e0b',
      lightTextColor: '#b45309',
      badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-700/80',
      lightBadgeBg: 'bg-amber-100 text-amber-800 border-amber-400',
    };
  }
  if (rating < 2600) {
    return {
      name: 'Grandmaster',
      colorClass: 'text-red-600 dark:text-red-500',
      textColor: isLightMode ? '#dc2626' : '#ef4444',
      lightTextColor: '#dc2626',
      badgeBg: 'bg-red-950/80 text-red-300 border-red-800/80',
      lightBadgeBg: 'bg-red-50 text-red-700 border-red-300',
    };
  }
  if (rating < 3000) {
    return {
      name: 'International Grandmaster',
      colorClass: 'text-red-700 dark:text-red-600',
      textColor: isLightMode ? '#b91c1c' : '#dc2626',
      lightTextColor: '#b91c1c',
      badgeBg: 'bg-red-950/90 text-red-200 border-red-700',
      lightBadgeBg: 'bg-red-100 text-red-800 border-red-400',
    };
  }

  // >= 3000 Legendary Grandmaster
  return {
    name: 'Legendary Grandmaster',
    colorClass: 'text-red-600 dark:text-red-500 font-bold',
    textColor: isLightMode ? '#b91c1c' : '#ef4444',
    lightTextColor: '#b91c1c',
    badgeBg: 'bg-red-950 text-red-100 border-red-600',
    lightBadgeBg: 'bg-red-100 text-red-900 border-red-500 font-bold',
    isLegendary: true,
  };
}

export function formatHandle(handle: string, rating?: number, isLightMode = false) {
  const rank = getRankInfo(rating, isLightMode);
  if (rank.isLegendary && handle.length > 0) {
    return {
      firstChar: handle[0],
      restChars: handle.slice(1),
      isLegendary: true,
      rank,
    };
  }
  return {
    firstChar: '',
    restChars: handle,
    isLegendary: false,
    rank,
  };
}
