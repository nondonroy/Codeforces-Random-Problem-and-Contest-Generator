import React from 'react';
import { CFUser } from '../types';
import { formatHandle, getRankInfo } from '../utils/cfColors';
import { useTheme } from '../context/ThemeContext';
import { Check, RefreshCw, Trash2, ExternalLink, CheckCircle2, User as UserIcon } from 'lucide-react';

interface UserCardProps {
  user: CFUser;
  isSelected: boolean;
  onToggleSelect: (handle: string) => void;
  onRefresh: (handle: string) => void;
  onRemove: (handle: string) => void;
  isRefreshing?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected,
  onToggleSelect,
  onRefresh,
  onRemove,
  isRefreshing = false,
}) => {
  const { isDark } = useTheme();
  const rank = getRankInfo(user.rating, !isDark);
  const formattedHandle = formatHandle(user.handle, user.rating, !isDark);

  return (
    <div
      id={`user-card-${user.handle}`}
      className={`group relative rounded-xl transition-all duration-200 border ${
        isSelected
          ? 'bg-white dark:bg-slate-900/90 border-blue-400 dark:border-blue-500/50 shadow-md shadow-blue-500/5 ring-1 ring-blue-400/40 dark:ring-blue-500/30'
          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100'
      }`}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        {/* User Checkbox & DP */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            id={`toggle-user-${user.handle}`}
            onClick={() => onToggleSelect(user.handle)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${
              isSelected
                ? 'bg-blue-600 text-white font-bold'
                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
            title={isSelected ? 'Deselect user' : 'Select user to filter unsolved'}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Profile Avatar */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.handle}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg';
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900"
              style={{ backgroundColor: isDark ? rank.textColor : rank.lightTextColor }}
              title={rank.name}
            />
          </div>

          {/* Handle & Rating Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`https://codeforces.com/profile/${user.handle}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-bold text-sm sm:text-base hover:underline flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors"
                style={{ color: isDark ? rank.textColor : rank.lightTextColor }}
              >
                {formattedHandle.isLegendary ? (
                  <span>
                    <span className="text-white bg-slate-900 px-0.5 rounded-sm">{formattedHandle.firstChar}</span>
                    <span style={{ color: isDark ? rank.textColor : rank.lightTextColor }}>{formattedHandle.restChars}</span>
                  </span>
                ) : (
                  user.handle
                )}
                <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500 inline opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                  isDark ? rank.badgeBg : rank.lightBadgeBg
                }`}
                style={{ color: isDark ? rank.textColor : rank.lightTextColor }}
              >
                {rank.name}
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {user.rating !== undefined ? user.rating : 'Unrated'}
              </span>
              {user.maxRating !== undefined && user.maxRating > (user.rating || 0) && (
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]" title="Max Rating">
                  (max: {user.maxRating})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions (Refresh & Remove) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            id={`refresh-user-${user.handle}`}
            onClick={() => onRefresh(user.handle)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors disabled:opacity-50"
            title="Refresh submissions & profile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
          <button
            type="button"
            id={`remove-user-${user.handle}`}
            onClick={() => onRemove(user.handle)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Remove user"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Stats Banner */}
      <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-950/50 rounded-b-xl border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{user.solvedCount.toLocaleString()} solved</span>
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {new Date(user.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
