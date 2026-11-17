import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import type { BillState, Employee, EmployeeOverrides } from '../types/bill';
import {
  calculateEmployeePay,
  calculateGroupTotals,
  exportGroupCsv,
  formatIndianNumber,
  getGroupIndex,
  getGroupName,
  getRowsPerPage,
  getSchoolDetails,
  MONTHS,
  numberToIndianWords,
  titleCase,
} from '../utils/billHelpers';
import { EditableCell } from './EditableCell';

interface PayBillTabProps {
  state: BillState;
  billRef: React.RefObject<HTMLDivElement | null>;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  onChangeRate: (key: 'da' | 'hra' | 'pr', value: number) => void;
  onChangeRowsPerPage: (kind: 'bill' | 'abs', value: number) => void;
  onClearBreaks: (kind: 'bill' | 'abs') => void;
  onAddEmployee: () => void;
  onDeleteEmployee: (globalIndex: number) => void;
  onMoveEmployee: (globalIndex: number, dir: -1 | 1) => void;
  onToggleBreak: (globalIndex: number, kind: 'bill' | 'abs') => void;
  onUpdateEmployeeField: (
    globalIndex: number,
    key: keyof Employee,
    value: string | number
  ) => void;
  onUpdateEmployeeOverride: (
    globalIndex: number,
    key: keyof EmployeeOverrides,
    value: string
  ) => void;
  onUpdateTotalOverride: (key: string, value: string) => void;
  onResetSample: () => void;
  onPrint: () => void;
}

const EDITOR_FIELDS: Array<{
  key: keyof Employee;
  label: string;
  wide?: boolean;
  numeric?: boolean;
}> = [
  { key: 'n', label: 'Name', wide: true },
  { key: 'd', label: 'Designation', wide: true },
  { key: 'pay', label: 'Pay', numeric: true },
  { key: 'ac', label: 'SBI A/C No', wide: true },
  { key: 'ifsc', label: 'IFSC' },
  { key: 'pran', label: 'PRAN No', wide: true },
  { key: 'pan', label: 'PAN' },
  { key: 'hrms', label: 'HRMS ID' },
  { key: 'mob', label: 'Mobile' },
  { key: 'lic', label: 'LIC', numeric: true },
  { key: 'gis', label: 'GIS', numeric: true },
  { key: 'fa', label: 'F.A', numeric: true },
  { key: 'it', label: 'I.T', numeric: true },
  { key: 'pt', label: 'P.TAX', numeric: true },
];

const COL_WIDTHS = [4, 22, 4.6, 4.6, 4.2, 4.8, 4.2, 3.6, 3.6, 3.6, 3.6, 4.2, 4.8, 4.8, 23.4];

const DETAIL_PAIRS: Array<[string, keyof Employee]> = [
  ['NAME :-', 'n'],
  ['DESIGNATION :-', 'd'],
  ['SBI,A/C NO :-', 'ac'],
  ['IFSC CODE :-', 'ifsc'],
  ['PRAN NO :-', 'pran'],
  ['PAN NO :-', 'pan'],
  ['HRMS ID :-', 'hrms'],
  ['MOBILE NO :-', 'mob'],
];

const TOTAL_KEYS = [
  'pay',
  'da',
  'hra',
  'tot',
  'pr',
  'lic',
  'gis',
  'fa',
  'it',
  'pt',
  'ded',
  'net',
] as const;

export const PayBillTab: React.FC<PayBillTabProps> = ({
  state,
  billRef,
  onChangeMonth,
  onChangeYear,
  onChangeRate,
  onChangeRowsPerPage,
  onClearBreaks,
  onAddEmployee,
  onDeleteEmployee,
  onMoveEmployee,
  onToggleBreak,
  onUpdateEmployeeField,
  onUpdateEmployeeOverride,
  onUpdateTotalOverride,
  onResetSample,
  onPrint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const currentGroupIdx = getGroupIndex(state);
  const currentGroupName = getGroupName(state);
  const groups = state.g && state.g.length > 0 ? state.g : [{ n: 'PRAN STAFF' }];
  const school = getSchoolDetails(state);
  const rpb = getRowsPerPage(state, 'bill');

  const groupEmployeesWithIndex = useMemo(() => {
    const list: Array<{ emp: Employee; globalIndex: number }> = [];
    state.e.forEach((emp, globalIndex) => {
      if ((emp.g || 0) === currentGroupIdx) {
        list.push({ emp, globalIndex });
      }
    });
    return list;
  }, [state.e, currentGroupIdx]);

  const filteredEditorRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const all = state.e.map((emp, globalIndex) => ({ emp, globalIndex }));
    if (!q) return all;
    return all.filter(({ emp }) =>
      [emp.n, emp.d, emp.pran, emp.pan, emp.hrms, emp.mob, emp.ac]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [state.e, searchQuery]);

  const groupTotals = useMemo(
    () =>
      calculateGroupTotals(
        groupEmployeesWithIndex.map((x) => x.emp),
        state
      ),
    [groupEmployeesWithIndex, state]
  );

  const tov = state.tov || {};
  const passedNet =
    tov.net !== undefined && tov.net !== ''
      ? Number(String(tov.net).replace(/,/g, '')) || 0
      : groupTotals.net;

  const formatTotalDisplay = (key: (typeof TOTAL_KEYS)[number]): string => {
    const d = tov[key];
    if (d === undefined) {
      return groupTotals[key] ? formatIndianNumber(groupTotals[key]) : '0';
    }
    const numericVal = Number(String(d).replace(/,/g, ''));
    if (Number.isNaN(numericVal)) return d;
    return formatIndianNumber(numericVal) || '0';
  };

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {currentGroupName} Monthly Pay Bill
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              <span>
                Staff: <strong className="text-slate-900 dark:text-slate-100">{groupEmployeesWithIndex.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Gross: <strong className="text-slate-900 dark:text-slate-100">₹{formatIndianNumber(groupTotals.tot) || '0'}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Deductions: <strong className="text-slate-900 dark:text-slate-100">₹{formatIndianNumber(groupTotals.ded) || '0'}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Net Payable: <strong className="text-emerald-700 dark:text-emerald-400">₹{formatIndianNumber(passedNet) || '0'}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddEmployee}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Employee
            </button>

            <button
              type="button"
              onClick={() =>
                exportGroupCsv(
                  groupEmployeesWithIndex.map((x) => x.emp),
                  state,
                  currentGroupName
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {confirmReset ? (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetSample();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-2 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Sample Data
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print (A4 Landscape)
            </button>
          </div>
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
            <span>D.A %</span>
            <input
              type="number"
              step="1"
              value={state.da}
              onChange={(e) => onChangeRate('da', Number(e.target.value) || 0)}
              className="w-20 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>H.R.A %</span>
            <input
              type="number"
              step="0.1"
              value={state.hra}
              onChange={(e) => onChangeRate('hra', Number(e.target.value) || 0)}
              className="w-20 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>PRAN % (of Pay+DA)</span>
            <input
              type="number"
              step="0.1"
              value={state.pr}
              onChange={(e) => onChangeRate('pr', Number(e.target.value) || 0)}
              className="w-28 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Print: Rows / Page</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rpb}
              onChange={(e) => onChangeRowsPerPage('bill', Number(e.target.value) || 1)}
              className="w-24 px-2.5 py-1.5 text-sm tabular-nums rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>

          <button
            type="button"
            onClick={() => onClearBreaks('bill')}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clear Page Breaks
          </button>

          <div className="ml-auto relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, PRAN, HRMS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Staff Editor Data Grid */}
      <div className="no-print bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1560px] text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                <th className="px-2 py-2.5 text-center font-semibold border-r border-slate-400 dark:border-slate-600 w-9">
                  #
                </th>
                {EDITOR_FIELDS.map((f) => (
                  <th
                    key={f.key}
                    className={`px-2 py-2.5 font-semibold border-r border-slate-400 dark:border-slate-600 ${
                      f.numeric ? 'text-right' : 'text-left'
                    }`}
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-2 py-2.5 text-left font-semibold border-r border-slate-400 dark:border-slate-600">
                  Bill
                </th>
                <th className="px-2 py-2.5 text-right font-semibold border-r border-slate-400 dark:border-slate-600">
                  D.A adj
                </th>
                <th className="px-2 py-2.5 text-right font-semibold border-r border-slate-400 dark:border-slate-600">
                  H.R.A adj
                </th>
                <th className="px-2 py-2.5 text-right font-semibold border-r border-slate-400 dark:border-slate-600">
                  PRAN adj
                </th>
                <th className="px-2 py-2.5 text-center font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400 dark:divide-slate-600">
              {filteredEditorRows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    {searchQuery ? (
                      <div className="space-y-2">
                        <p>No employees match &ldquo;{searchQuery}&rdquo;.</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>No employees added yet.</p>
                        <button
                          type="button"
                          onClick={onAddEmployee}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 cursor-pointer"
                        >
                          + Add First Employee
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEditorRows.map(({ emp, globalIndex }) => {
                  const basePay = Number(emp.pay) || 0;
                  const daPh = Math.round((basePay * state.da) / 100);
                  const hraPh = Math.round((basePay * state.hra) / 100);
                  const prPh = Math.round(((basePay + daPh) * state.pr) / 100);
                  const adjPlaceholders = { da: daPh, hra: hraPh, pr: prPh };

                  return (
                    <tr
                      key={globalIndex}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        (emp.g || 0) === currentGroupIdx
                          ? ''
                          : 'opacity-65 bg-slate-50/40 dark:bg-slate-900/40'
                      }`}
                    >
                      <td className="px-2 py-1 text-center tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-400 dark:border-slate-600">
                        {globalIndex + 1}
                      </td>
                      {EDITOR_FIELDS.map((f) => (
                        <td
                          key={f.key}
                          className="p-0.5 border-r border-slate-400 dark:border-slate-600"
                        >
                          <input
                            type="text"
                            value={String(emp[f.key] ?? '')}
                            onChange={(e) =>
                              onUpdateEmployeeField(
                                globalIndex,
                                f.key,
                                f.numeric
                                  ? e.target.value === ''
                                    ? 0
                                    : Number(e.target.value.replace(/,/g, '')) || 0
                                  : e.target.value
                              )
                            }
                            className={`w-full px-1.5 py-1 text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-blue-50/70 dark:focus:bg-blue-950/50 rounded ${
                              f.wide ? 'min-w-[140px]' : 'min-w-[68px]'
                            } ${f.numeric ? 'text-right tabular-nums font-mono' : ''}`}
                          />
                        </td>
                      ))}

                      <td className="p-0.5 border-r border-slate-400 dark:border-slate-600">
                        <select
                          value={emp.g || 0}
                          onChange={(e) =>
                            onUpdateEmployeeField(globalIndex, 'g', Number(e.target.value))
                          }
                          className="px-1.5 py-1 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded focus:outline-none"
                        >
                          {groups.map((g, k) => (
                            <option key={k} value={k}>
                              {g.n}
                            </option>
                          ))}
                        </select>
                      </td>

                      {(['da', 'hra', 'pr'] as const).map((k) => {
                        const ovVal = emp.ov?.[k] !== undefined ? String(emp.ov[k]) : '';
                        return (
                          <td
                            key={k}
                            className="p-0.5 border-r border-slate-400 dark:border-slate-600"
                          >
                            <input
                              type="text"
                              value={ovVal}
                              placeholder={String(adjPlaceholders[k])}
                              onChange={(e) =>
                                onUpdateEmployeeOverride(globalIndex, k, e.target.value)
                              }
                              className="w-full min-w-[64px] px-1.5 py-1 text-xs text-right tabular-nums font-mono bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50/70 dark:focus:bg-amber-950/30 rounded"
                            />
                          </td>
                        );
                      })}

                      <td className="px-1.5 py-1 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title="Move up"
                            onClick={() => onMoveEmployee(globalIndex, -1)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            onClick={() => onMoveEmployee(globalIndex, 1)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete employee"
                            onClick={() => onDeleteEmployee(globalIndex)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print-Ready Pay Bill Preview */}
      <div className="pv-wrap pv-landscape overflow-x-auto bg-white rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div ref={billRef} id="bill" className="bill">
          <div className="t1">
            {school.name}, BLOCK - {school.block}, DIST-{school.dist}
          </div>
          <div className="t2">
            MONTHLY PAY BILL OF {currentGroupName} FOR THE MONTH OF {MONTHS[state.m]} - {state.y}
          </div>

          <table className="b">
            <colgroup>
              {COL_WIDTHS.map((w, idx) => (
                <col key={idx} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>SL NO</th>
                <th>NAME OF THE EMPLOYEES WITH DESIGNATIONS AND DETAILS</th>
                <th>
                  <div className="vh">PAY</div>
                </th>
                <th>
                  <div className="vh">D.A @{state.da}%</div>
                </th>
                <th>
                  <div className="vh">H.R.A</div>
                </th>
                <th>
                  <div className="vh">TOTAL</div>
                </th>
                <th>
                  <div className="vh">PRAN</div>
                </th>
                <th>
                  <div className="vh">LIC</div>
                </th>
                <th>
                  <div className="vh">GIS</div>
                </th>
                <th>
                  <div className="vh">F.A</div>
                </th>
                <th>
                  <div className="vh">I.T</div>
                </th>
                <th>
                  <div className="vh">P.TAX</div>
                </th>
                <th>
                  <div className="vh">TOTAL DEDUCTION</div>
                </th>
                <th>
                  <div className="vh">NET PAYABLE</div>
                </th>
                <th>SIGNATURES OF EMPLOYEES</th>
              </tr>
            </thead>
            <tbody>
              {groupEmployeesWithIndex.map(({ emp, globalIndex }, idx) => {
                const c = calculateEmployeePay(emp, state);
                const slDisplay = emp.sl != null ? emp.sl : String(idx + 1);

                const renderVerticalCell = (
                  key: string,
                  val: number,
                  blankIfZero = false,
                  isOverride = false
                ) => {
                  const text = blankIfZero && !val ? '' : val ? formatIndianNumber(val) : '0';
                  return (
                    <td className="n">
                      <EditableCell
                        as="div"
                        className="v"
                        numeric
                        value={text}
                        onCommit={(next) => {
                          if (isOverride) {
                            onUpdateEmployeeOverride(
                              globalIndex,
                              key as keyof EmployeeOverrides,
                              next
                            );
                          } else {
                            onUpdateEmployeeField(
                              globalIndex,
                              key as keyof Employee,
                              next === '' ? 0 : Number(next) || 0
                            );
                          }
                        }}
                      />
                    </td>
                  );
                };

                return (
                  <tr key={globalIndex}>
                    <td style={{ textAlign: 'center', fontSize: '11px' }}>
                      <EditableCell
                        as="div"
                        value={slDisplay}
                        onCommit={(next) => onUpdateEmployeeField(globalIndex, 'sl', next)}
                      />
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
                          className={emp.brk ? 'on' : ''}
                          title="Page break after this employee"
                          onClick={() => onToggleBreak(globalIndex, 'bill')}
                        >
                          ⏎
                        </button>
                      </div>
                    </td>

                    <td className="nm" style={{ verticalAlign: 'top' }}>
                      {DETAIL_PAIRS.map(([label, fieldKey]) => (
                        <div key={fieldKey}>
                          {label}{' '}
                          <EditableCell
                            value={String(emp[fieldKey] ?? '')}
                            onCommit={(next) =>
                              onUpdateEmployeeField(globalIndex, fieldKey, next)
                            }
                          />
                        </div>
                      ))}
                    </td>

                    {renderVerticalCell('pay', c.pay, false, false)}
                    {renderVerticalCell('da', c.da, false, true)}
                    {renderVerticalCell('hra', c.hra, false, true)}
                    {renderVerticalCell('tot', c.tot, false, true)}
                    {renderVerticalCell('pr', c.pr, false, true)}
                    {renderVerticalCell('lic', Number(emp.lic) || 0, true, false)}
                    {renderVerticalCell('gis', Number(emp.gis) || 0, true, false)}
                    {renderVerticalCell('fa', Number(emp.fa) || 0, false, false)}
                    {renderVerticalCell('it', Number(emp.it) || 0, true, false)}
                    {renderVerticalCell('pt', Number(emp.pt) || 0, false, false)}
                    {renderVerticalCell('ded', c.ded, false, true)}
                    {renderVerticalCell('net', c.net, false, true)}

                    <td style={{ verticalAlign: 'top' }}>
                      <EditableCell
                        as="div"
                        value={emp.sig || ''}
                        onCommit={(next) => onUpdateEmployeeField(globalIndex, 'sig', next)}
                        style={{
                          height: '130px',
                          padding: '4px',
                          fontSize: '11px',
                          wordBreak: 'break-word',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}

              <tr className="tot">
                <td colSpan={2} style={{ textAlign: 'right', paddingRight: '6px' }}>
                  TOTAL:-
                </td>
                {TOTAL_KEYS.map((k) => (
                  <td key={k} style={{ fontSize: '10px' }}>
                    <EditableCell
                      as="div"
                      numeric
                      value={formatTotalDisplay(k)}
                      onCommit={(next) => onUpdateTotalOverride(k, next)}
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>

          <div className="ft">
            <div className="l">
              <span>
                <b>BILL NO :- ________________</b>
              </span>
              <span />
            </div>
            <div className="l">
              <b>Passed for: {formatIndianNumber(passedNet) || '0'}</b>
              <b>(Rupees:- {numberToIndianWords(passedNet)} Only)</b>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', margin: '14px 0 6px' }}>
              (Signature Of Headmaster)
            </div>
            <p>
              1. Certified that the bill has been prepared according to Attendance Register and what they salary claimed in this bill has been verified and found correct best of my knowledge.
            </p>
            <p>
              2. Certified that the salary claimed in this bill has not been drawn previously.
            </p>
            <p>
              3. Certified that the employees whose salary claimed in this bill are staying in 8 km of head quarters.
            </p>
            <p>
              4. Certified that if any excess or double draw detect in future in favour of any employee, it will be recovered party concerned.
            </p>
            <div className="u">
              THE OFFICE OF THE HEADMASTER OF {school.name}, BLOCK:- {school.block}, DISTRICT :-{' '}
              {school.dist}
            </div>
            <div className="l">
              <b>Letter No :- ________________</b>
              <b>Dated :- ________________</b>
            </div>
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              Copy submitted to the District Education Officer Of {titleCase(school.dist)} for his information and necessary action.
            </div>
            <div className="l" style={{ marginTop: '18px' }}>
              <b>Signature of District Education Officer, {titleCase(school.dist)}</b>
              <b>(Signature Of the Headmaster)</b>
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
