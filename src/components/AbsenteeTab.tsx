import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Printer } from 'lucide-react';
import type { BillState, Employee } from '../types/bill';
import {
  getDaysInMonth,
  getGroupIndex,
  getMonthKey,
  getRowsPerPage,
  getSchoolDetails,
  MONTHS,
} from '../utils/billHelpers';
import { EditableCell } from './EditableCell';

interface AbsenteeTabProps {
  state: BillState;
  absRef: React.RefObject<HTMLDivElement | null>;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  onApplyWorkingDays: (days: number) => void;
  onSetEmployeeCount: (count: number) => void;
  onAddEmployee: () => void;
  onDeleteLastEmployee: () => void;
  onChangeRowsPerPage: (kind: 'bill' | 'abs', value: number) => void;
  onClearBreaks: (kind: 'bill' | 'abs') => void;
  onMoveEmployee: (globalIndex: number, dir: -1 | 1) => void;
  onToggleBreak: (globalIndex: number, kind: 'bill' | 'abs') => void;
  onUpdateEmployeeField: (
    globalIndex: number,
    key: keyof Employee,
    value: string | number
  ) => void;
  onUpdateEmployeeAbsentee: (globalIndex: number, key: string, value: string) => void;
  onUpdateAbsenteeMeta: (key: string, value: string) => void;
  onPrint: () => void;
}

const ABS_COL_WIDTHS = [4, 20, 10, 6, 7, 10, 10, 6, 6, 5, 5, 5, 6];

export const AbsenteeTab: React.FC<AbsenteeTabProps> = ({
  state,
  absRef,
  onChangeMonth,
  onChangeYear,
  onApplyWorkingDays,
  onSetEmployeeCount,
  onAddEmployee,
  onDeleteLastEmployee,
  onChangeRowsPerPage,
  onClearBreaks,
  onMoveEmployee,
  onToggleBreak,
  onUpdateEmployeeField,
  onUpdateEmployeeAbsentee,
  onUpdateAbsenteeMeta,
  onPrint,
}) => {
  const daysInMonth = getDaysInMonth(state.y, state.m);
  const monthKey = getMonthKey(state);
  const savedWorkingDays = state.wdm?.[monthKey] ?? daysInMonth;

  const currentGroupIdx = getGroupIndex(state);
  const groupEmployeesWithIndex = useMemo(() => {
    const list: Array<{ emp: Employee; globalIndex: number }> = [];
    state.e.forEach((emp, globalIndex) => {
      if ((emp.g || 0) === currentGroupIdx) {
        list.push({ emp, globalIndex });
      }
    });
    return list;
  }, [state.e, currentGroupIdx]);

  const [workingDaysInput, setWorkingDaysInput] = useState<number>(savedWorkingDays);
  const [empCountInput, setEmpCountInput] = useState<number>(groupEmployeesWithIndex.length || 1);

  useEffect(() => {
    setWorkingDaysInput(savedWorkingDays);
  }, [savedWorkingDays]);

  useEffect(() => {
    setEmpCountInput(groupEmployeesWithIndex.length || 1);
  }, [groupEmployeesWithIndex.length]);

  const school = getSchoolDetails(state);
  const at = state.at || {};
  const rpa = getRowsPerPage(state, 'abs');

  const metaVal = (key: string, fallback: string) =>
    at[key] !== undefined ? String(at[key]) : fallback;

  return (
    <div className="space-y-4">
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Absentee Statement
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any cell on the statement to edit it. Names, designations, month, and year stay synced with the Pay Bill.
            </p>
          </div>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print (A4 Landscape)
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Month</span>
            <select
              value={state.m}
              onChange={(e) => onChangeMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Year</span>
            <input
              type="number"
              value={state.y}
              onChange={(e) => onChangeYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-22 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Working Days</span>
            <input
              type="number"
              min={0}
              value={workingDaysInput}
              onChange={(e) => setWorkingDaysInput(Math.max(0, Number(e.target.value) || 0))}
              className="w-22 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <button
            type="button"
            onClick={() => onApplyWorkingDays(workingDaysInput)}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Set Working Days
          </button>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>No. of Employees</span>
            <input
              type="number"
              min={1}
              max={30}
              value={empCountInput}
              onChange={(e) =>
                setEmpCountInput(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
              }
              className="w-22 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <button
            type="button"
            onClick={() => onSetEmployeeCount(empCountInput)}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={onAddEmployee}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Employee
          </button>

          <button
            type="button"
            onClick={onDeleteLastEmployee}
            disabled={groupEmployeesWithIndex.length <= 1}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            Last Employee
          </button>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Print: Rows / Page</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rpa}
              onChange={(e) => onChangeRowsPerPage('abs', Number(e.target.value) || 1)}
              className="w-22 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <button
            type="button"
            onClick={() => onClearBreaks('abs')}
            className="px-3 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clear Page Breaks
          </button>
        </div>
      </div>

      {/* Print-Ready Absentee Statement Preview */}
      <div className="pv-wrap pv-landscape overflow-x-auto bg-white rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div ref={absRef} id="absBill" className="ab">
          <div className="h1">
            <EditableCell
              value={metaVal('o1', `OFFICE OF THE HEADMASTER OF ${school.name}`)}
              onCommit={(next) => onUpdateAbsenteeMeta('o1', next)}
            />
          </div>
          <div className="h2">
            <EditableCell
              value={metaVal(
                'o2',
                `(AT:-${school.place}, BLOCK :- ${school.block}, DIST :- ${school.dist}, PIN ${school.pin}, WA/Contacts NO:-${school.wa})`
              )}
              onCommit={(next) => onUpdateAbsenteeMeta('o2', next)}
            />
          </div>
          <div className="h2">
            <b>
              <EditableCell
                value={metaVal('o3', `(Email ID :- ${school.email})`)}
                onCommit={(next) => onUpdateAbsenteeMeta('o3', next)}
              />
            </b>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
            <b>
              Letter No :-{' '}
              <EditableCell
                value={metaVal('ln', '________________')}
                onCommit={(next) => onUpdateAbsenteeMeta('ln', next)}
              />
            </b>
            <b>
              Dated :-{' '}
              <EditableCell
                value={metaVal('dt', '________________')}
                onCommit={(next) => onUpdateAbsenteeMeta('dt', next)}
              />
            </b>
          </div>

          <div className="tt">
            <EditableCell
              value={metaVal('ti', 'ABSENTEE STATEMENT OF TEACHERS AND NON TEACHING STAFF')}
              onCommit={(next) => onUpdateAbsenteeMeta('ti', next)}
            />
          </div>
          <div className="tt" style={{ textDecoration: 'none' }}>
            FOR THE MONTH OF {MONTHS[state.m]} - {state.y}
          </div>

          <table className="a" style={{ marginTop: '8px' }}>
            <colgroup>
              {ABS_COL_WIDTHS.map((w, idx) => (
                <col key={idx} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>SL NO</th>
                <th rowSpan={2}>NAME OF THE EMPLOYEES</th>
                <th rowSpan={2}>DESIGNATION</th>
                <th rowSpan={2}>No. Of Days in the Month</th>
                <th rowSpan={2}>Total No. of Working Days in the Month</th>
                <th colSpan={2}>C. L Taken</th>
                <th colSpan={2}>E. L Taken</th>
                <th colSpan={3}>NO. AUTHORIZED LEAVE</th>
                <th rowSpan={2}>Remarks if Any</th>
              </tr>
              <tr>
                <th>From /On</th>
                <th>To</th>
                <th>From</th>
                <th>To</th>
                <th>Present</th>
                <th>Previous</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupEmployeesWithIndex.map(({ emp, globalIndex }, idx) => {
                const ab = emp.ab || {};
                const cellVal = (k: string, fallback: string) =>
                  ab[k] !== undefined ? String(ab[k]) : fallback;

                const renderAbCell = (k: string, fallback: string) => (
                  <EditableCell
                    as="div"
                    value={cellVal(k, fallback)}
                    onCommit={(next) => onUpdateEmployeeAbsentee(globalIndex, k, next)}
                  />
                );

                return (
                  <tr key={globalIndex}>
                    <td>
                      {renderAbCell('sl', String(idx + 1))}
                      <div className="np">
                        <button
                          type="button"
                          title="Move up"
                          onClick={() => onMoveEmployee(globalIndex, -1)}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          title="Move down"
                          onClick={() => onMoveEmployee(globalIndex, 1)}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className={emp.abrk ? 'on' : ''}
                          title="Page break after this employee"
                          onClick={() => onToggleBreak(globalIndex, 'abs')}
                        >
                          ⏎
                        </button>
                      </div>
                    </td>
                    <td>
                      <EditableCell
                        as="div"
                        value={emp.n || ''}
                        onCommit={(next) => onUpdateEmployeeField(globalIndex, 'n', next)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        as="div"
                        value={emp.d || ''}
                        onCommit={(next) => onUpdateEmployeeField(globalIndex, 'd', next)}
                      />
                    </td>
                    <td>{renderAbCell('dm', `${daysInMonth} days`)}</td>
                    <td>{renderAbCell('wd', `${savedWorkingDays} days`)}</td>
                    <td className="ln" style={{ padding: 0 }}>
                      {[0, 1, 2, 3].map((n) => (
                        <React.Fragment key={n}>{renderAbCell(`cf${n}`, '')}</React.Fragment>
                      ))}
                    </td>
                    <td className="ln" style={{ padding: 0 }}>
                      {[0, 1, 2, 3].map((n) => (
                        <React.Fragment key={n}>{renderAbCell(`ct${n}`, '')}</React.Fragment>
                      ))}
                    </td>
                    <td>{renderAbCell('e1', 'NIL')}</td>
                    <td>{renderAbCell('e2', 'NIL')}</td>
                    <td>{renderAbCell('ap', '')}</td>
                    <td>{renderAbCell('apv', '')}</td>
                    <td>{renderAbCell('at', '')}</td>
                    <td>{renderAbCell('rem', '')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '12px' }}>
            <div>
              1.{' '}
              <EditableCell
                value={metaVal(
                  'f1',
                  "Certified that if any discrepancy arise future regarding the above incumbency i shall will be responsible for that's."
                )}
                onCommit={(next) => onUpdateAbsenteeMeta('f1', next)}
              />
            </div>
            <div>
              2.{' '}
              <EditableCell
                value={metaVal(
                  'f2',
                  "All the staff staying theirs Headquarters, Hence they may be kindly allowed theirs HRA of this month's"
                )}
                onCommit={(next) => onUpdateAbsenteeMeta('f2', next)}
              />
            </div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '28px' }}>
              [
              <EditableCell
                value={metaVal('sg', 'Seal and Signature Of the headmaster')}
                onCommit={(next) => onUpdateAbsenteeMeta('sg', next)}
              />
              ]
            </div>
            {school.pdev && (
              <div style={{ textAlign: 'right', fontSize: '9px', marginTop: '6px' }}>
                Developed by {school.dev}, {school.devd}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
