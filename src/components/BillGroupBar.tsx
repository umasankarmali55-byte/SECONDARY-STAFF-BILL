import React from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';
import type { BillState } from '../types/bill';
import { getGroupIndex, getGroupName } from '../utils/billHelpers';

interface BillGroupBarProps {
  state: BillState;
  onSelectGroup: (index: number) => void;
  onRenameGroup: (name: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: () => void;
}

export const BillGroupBar: React.FC<BillGroupBarProps> = ({
  state,
  onSelectGroup,
  onRenameGroup,
  onCreateGroup,
  onDeleteGroup,
}) => {
  const groups = state.g && state.g.length > 0 ? state.g : [{ n: 'PRAN STAFF' }];
  const currentIndex = getGroupIndex(state);
  const currentName = getGroupName(state);

  return (
    <section
      aria-label="Bill Staff Group Management"
      className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>Bill / Staff Group</span>
          <select
            value={currentIndex}
            onChange={(e) => onSelectGroup(Number(e.target.value))}
            className="min-w-[180px] px-2.5 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          >
            {groups.map((g, idx) => {
              const count = state.e.filter((emp) => (emp.g || 0) === idx).length;
              return (
                <option key={idx} value={idx}>
                  {g.n} ({count})
                </option>
              );
            })}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>Group Name</span>
          <input
            type="text"
            value={currentName}
            onChange={(e) => onRenameGroup(e.target.value)}
            className="w-56 px-2.5 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          />
        </label>

        <button
          type="button"
          onClick={onCreateGroup}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          New Bill
        </button>

        <button
          type="button"
          onClick={onDeleteGroup}
          disabled={groups.length < 2}
          title={groups.length < 2 ? 'At least one bill group is required' : 'Delete this bill group'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete This Bill
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
        Each bill has its own employees. Pick a bill here and the Pay Bill and Absentee Statement show only its employees. Use the &ldquo;Bill&rdquo; column in the employee table to move an employee to another bill. Deleting a bill moves its employees to the first bill.
      </p>
    </section>
  );
};
