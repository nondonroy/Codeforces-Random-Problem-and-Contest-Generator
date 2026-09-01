import React, { useState } from 'react';
import { CFUser } from '../types';
import { UserCard } from './UserCard';
import {
  UserPlus,
  Users,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface UserManagementProps {
  users: CFUser[];
  selectedHandles: string[];
  onToggleUser: (handle: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddUser: (handle: string) => Promise<void>;
  onRefreshUser: (handle: string) => Promise<void>;
  onRefreshAll: () => Promise<void>;
  onRemoveUser: (handle: string) => void;
  isAdding: boolean;
  refreshingHandle: string | null;
}

const PRESET_HANDLES = ['tourist', 'Benq', 'Errichto', 'ecnerwala', 'Um_nik'];

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  selectedHandles,
  onToggleUser,
  onSelectAll,
  onDeselectAll,
  onAddUser,
  onRefreshUser,
  onRefreshAll,
  onRemoveUser,
  isAdding,
  refreshingHandle,
}) => {
  const [inputHandle, setInputHandle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    setErrorMsg(null);

    const rawHandles = inputHandle
      .split(/[\s,;]+/)
      .map((h) => h.trim())
      .filter(Boolean);

    if (rawHandles.length === 0) return;

    try {
      for (const h of rawHandles) {
        await onAddUser(h);
      }
      setInputHandle('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add user');
    }
  };

  const handleQuickAdd = async (preset: string) => {
    setErrorMsg(null);
    try {
      await onAddUser(preset);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add user');
    }
  };

  const uniqueExcludedCount = React.useMemo(() => {
    const set = new Set<string>();
    for (const u of users) {
      if (selectedHandles.includes(u.handle)) {
        for (const pid of u.solvedProblemIds) {
          set.add(pid);
        }
      }
    }
    return set.size;
  }, [users, selectedHandles]);

  return (
    <div id="user-management-section" className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-xl transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              Contestants &amp; Users Filter
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${
                selectedHandles.length === users.length && users.length > 0
                  ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {selectedHandles.length} of {users.length} active ({selectedHandles.length === users.length && users.length > 0 ? 'ALL FILTERED' : 'Custom Filter'})
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Problems solved by <strong className="text-blue-600 dark:text-blue-300">any active user</strong> will be excluded so nobody gets problems they already solved.
            </p>
          </div>
        </div>

        {/* Global actions */}
        {users.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="select-all-users-btn"
              onClick={selectedHandles.length === users.length ? onDeselectAll : onSelectAll}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border font-semibold ${
                selectedHandles.length === users.length
                  ? 'bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-500/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
              }`}
            >
              {selectedHandles.length === users.length ? (
                <>
                  <Square className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                  <span>Deselect All Users</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                  <span>Filter by ALL Users ({users.length})</span>
                </>
              )}
            </button>
            <button
              type="button"
              id="refresh-all-users-btn"
              onClick={onRefreshAll}
              disabled={refreshingHandle !== null}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/80 disabled:opacity-50"
              title="Refresh submissions for all saved users"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingHandle === '__ALL__' ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              Refresh Solves
            </button>
          </div>
        )}
      </div>

      {/* Add User Form */}
      <form onSubmit={handleAddSubmit} className="mt-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <UserPlus className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="cf-handle-input"
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
              placeholder="Enter Codeforces handle (e.g., tourist, Benq, or comma-separated)"
              disabled={isAdding}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/90 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            id="add-user-btn"
            disabled={isAdding || !inputHandle.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isAdding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching CF Profile...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Add Presets */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Sparkles className="w-3 h-3 text-blue-500" /> Popular presets:
          </span>
          {PRESET_HANDLES.map((preset) => {
            const alreadyAdded = users.some((u) => u.handle.toLowerCase() === preset.toLowerCase());
            return (
              <button
                key={preset}
                type="button"
                id={`quick-add-${preset}`}
                onClick={() => handleQuickAdd(preset)}
                disabled={isAdding || alreadyAdded}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors border ${
                  alreadyAdded
                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-default'
                    : 'bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                +{preset}
              </button>
            );
          })}
        </div>
      </form>

      {/* Users Grid */}
      <div className="mt-5">
        {users.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <Users className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users added yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Add your Codeforces handle (and your team/friends' handles) above to view their DP, rating, and filter out any problems solved by any contestant!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((user) => (
              <UserCard
                key={user.handle}
                user={user}
                isSelected={selectedHandles.includes(user.handle)}
                onToggleSelect={onToggleUser}
                onRefresh={onRefreshUser}
                onRemove={onRemoveUser}
                isRefreshing={refreshingHandle === user.handle || refreshingHandle === '__ALL__'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Solved exclusion banner */}
      {selectedHandles.length > 0 && uniqueExcludedCount > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Excluding <strong className="text-blue-600 dark:text-blue-300 font-mono font-semibold">{uniqueExcludedCount.toLocaleString()}</strong> unique solved problems across {selectedHandles.length} contestant{selectedHandles.length > 1 ? 's' : ''}.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-500" /> Fast cached lookups
          </span>
        </div>
      )}
    </div>
  );
};
