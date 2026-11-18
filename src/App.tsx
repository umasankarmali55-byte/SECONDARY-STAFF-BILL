import { useCallback, useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Moon, Printer, Settings, Sun } from 'lucide-react';
import { AbsenteeTab } from './components/AbsenteeTab';
import { BillGroupBar } from './components/BillGroupBar';
import { CoveringLetterTab } from './components/CoveringLetterTab';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PayBillTab } from './components/PayBillTab';
import { SchoolSettingsPanel } from './components/SchoolSettingsPanel';
import type {
  BillState,
  Employee,
  EmployeeOverrides,
  SchoolDetails,
  TabKey,
} from './types/bill';
import {
  createEmptyEmployee,
  getDefaultState,
  getGroupIndex,
  getMonthKey,
  getRowsPerPage,
  getSchoolDetails,
  loadState,
  paginateForPrint,
  saveState,
  unpaginateAfterPrint,
} from './utils/billHelpers';

export default function App() {
  const [state, setState] = useState<BillState>(() => loadState());
  const [activeTab, setActiveTab] = useState<TabKey>('pay');
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('school_bills_theme');
      if (saved === 'dark') return true;
      return false;
    } catch {
      return false;
    }
  });

  const billRef = useRef<HTMLDivElement | null>(null);
  const absRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('school_bills_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [isDark]);

  // Dynamic @page size matching active tab (A4 landscape for Pay Bill & Absentee, A4 portrait for Covering Letter)
  useEffect(() => {
    const styleId = 'dynamic-print-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent =
      activeTab === 'lt'
        ? '@media print { @page { size: A4 portrait; margin: 0; } }'
        : '@media print { @page { size: A4 landscape; margin: 0; } }';
  }, [activeTab]);

  // Print pagination lifecycle for Pay Bill & Absentee Statement
  useEffect(() => {
    const handleBeforePrint = () => {
      const gIdx = getGroupIndex(state);
      const groupEmployees = state.e.filter((e) => (e.g || 0) === gIdx);
      if (activeTab === 'pay') {
        paginateForPrint(
          billRef.current,
          getRowsPerPage(state, 'bill'),
          groupEmployees.map((e) => Boolean(e.brk))
        );
      } else if (activeTab === 'abs') {
        paginateForPrint(
          absRef.current,
          getRowsPerPage(state, 'abs'),
          groupEmployees.map((e) => Boolean(e.abrk))
        );
      }
    };

    const handleAfterPrint = () => {
      unpaginateAfterPrint(billRef.current);
      unpaginateAfterPrint(absRef.current);
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [state, activeTab]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const updateState = useCallback((updater: (prev: BillState) => BillState) => {
    setState((prev) => updater(prev));
  }, []);

  const handleUpdateSchool = useCallback(
    (key: keyof SchoolDetails, value: string | boolean) => {
      updateState((prev) => {
        const nextAt = { ...(prev.at || {}) };
        if (key !== 'logo' && key !== 'pdev' && key !== 'lhtxt') {
          delete nextAt.o1;
          delete nextAt.o2;
          delete nextAt.o3;
          delete nextAt.l_p2;
          delete nextAt.l_to1;
          delete nextAt.l_to2;
        }
        return {
          ...prev,
          sc: { ...(prev.sc || {}), [key]: value },
          at: nextAt,
        };
      });
    },
    [updateState]
  );

  const handleSelectGroup = useCallback(
    (index: number) => {
      updateState((prev) => ({ ...prev, cg: index }));
    },
    [updateState]
  );

  const handleRenameGroup = useCallback(
    (name: string) => {
      updateState((prev) => {
        const groups = [...(prev.g && prev.g.length ? prev.g : [{ n: 'PRAN STAFF' }])];
        const idx = getGroupIndex(prev);
        groups[idx] = { n: name };
        return { ...prev, g: groups };
      });
    },
    [updateState]
  );

  const handleCreateGroup = useCallback(() => {
    updateState((prev) => {
      const groups = [...(prev.g && prev.g.length ? prev.g : [{ n: 'PRAN STAFF' }])];
      groups.push({ n: `BILL ${groups.length + 1}` });
      return { ...prev, g: groups, cg: groups.length - 1 };
    });
  }, [updateState]);

  const handleDeleteGroup = useCallback(() => {
    updateState((prev) => {
      const groups = [...(prev.g && prev.g.length ? prev.g : [{ n: 'PRAN STAFF' }])];
      if (groups.length < 2) return prev;
      const d = getGroupIndex(prev);
      const nextEmployees = prev.e.map((emp) => {
        const g = emp.g || 0;
        if (g === d) return { ...emp, g: 0 };
        if (g > d) return { ...emp, g: g - 1 };
        return emp;
      });
      groups.splice(d, 1);
      return { ...prev, g: groups, cg: 0, e: nextEmployees };
    });
  }, [updateState]);

  const handleAddEmployee = useCallback(() => {
    updateState((prev) => {
      const gIdx = getGroupIndex(prev);
      return {
        ...prev,
        e: [...prev.e, createEmptyEmployee(gIdx)],
      };
    });
  }, [updateState]);

  const handleDeleteEmployee = useCallback(
    (globalIndex: number) => {
      updateState((prev) => ({
        ...prev,
        e: prev.e.filter((_, idx) => idx !== globalIndex),
      }));
    },
    [updateState]
  );

  const handleDeleteLastEmployee = useCallback(() => {
    updateState((prev) => {
      const gIdx = getGroupIndex(prev);
      const indices: number[] = [];
      prev.e.forEach((emp, i) => {
        if ((emp.g || 0) === gIdx) indices.push(i);
      });
      if (indices.length <= 1) return prev;
      const target = indices[indices.length - 1];
      return {
        ...prev,
        e: prev.e.filter((_, i) => i !== target),
      };
    });
  }, [updateState]);

  const handleSetEmployeeCount = useCallback(
    (count: number) => {
      const n = Math.max(1, Math.min(30, count || 1));
      updateState((prev) => {
        const gIdx = getGroupIndex(prev);
        const nextE = [...prev.e];
        const indices: number[] = [];
        nextE.forEach((emp, i) => {
          if ((emp.g || 0) === gIdx) indices.push(i);
        });
        while (indices.length < n) {
          nextE.push(createEmptyEmployee(gIdx));
          indices.push(nextE.length - 1);
        }
        while (indices.length > n) {
          const popIdx = indices.pop();
          if (popIdx !== undefined) nextE.splice(popIdx, 1);
        }
        return { ...prev, e: nextE };
      });
    },
    [updateState]
  );

  const handleMoveEmployee = useCallback(
    (globalIndex: number, dir: -1 | 1) => {
      updateState((prev) => {
        const arr = [...prev.e];
        const current = arr[globalIndex];
        if (!current) return prev;
        const g = current.g || 0;
        let j = globalIndex + dir;
        while (j >= 0 && j < arr.length && (arr[j].g || 0) !== g) {
          j += dir;
        }
        if (j < 0 || j >= arr.length) return prev;
        const temp = arr[globalIndex];
        arr[globalIndex] = arr[j];
        arr[j] = temp;
        return { ...prev, e: arr };
      });
    },
    [updateState]
  );

  const handleToggleBreak = useCallback(
    (globalIndex: number, kind: 'bill' | 'abs') => {
      updateState((prev) => {
        const field = kind === 'abs' ? 'abrk' : 'brk';
        return {
          ...prev,
          e: prev.e.map((emp, idx) =>
            idx === globalIndex ? { ...emp, [field]: !emp[field] } : emp
          ),
        };
      });
    },
    [updateState]
  );

  const handleClearBreaks = useCallback(
    (kind: 'bill' | 'abs') => {
      updateState((prev) => {
        const field = kind === 'abs' ? 'abrk' : 'brk';
        return {
          ...prev,
          e: prev.e.map((emp) => {
            const copy = { ...emp };
            delete copy[field];
            return copy;
          }),
        };
      });
    },
    [updateState]
  );

  const handleUpdateEmployeeField = useCallback(
    (globalIndex: number, key: keyof Employee, value: string | number) => {
      updateState((prev) => ({
        ...prev,
        e: prev.e.map((emp, idx) => (idx === globalIndex ? { ...emp, [key]: value } : emp)),
      }));
    },
    [updateState]
  );

  const handleUpdateEmployeeOverride = useCallback(
    (globalIndex: number, key: keyof EmployeeOverrides, value: string) => {
      const clean = value.replace(/,/g, '').trim();
      updateState((prev) => ({
        ...prev,
        e: prev.e.map((emp, idx) => {
          if (idx !== globalIndex) return emp;
          const nextOv = { ...(emp.ov || {}) };
          if (clean === '') delete nextOv[key];
          else nextOv[key] = clean;
          return { ...emp, ov: nextOv };
        }),
      }));
    },
    [updateState]
  );

  const handleUpdateTotalOverride = useCallback(
    (key: string, value: string) => {
      const clean = value.replace(/,/g, '').trim();
      updateState((prev) => {
        const nextTov = { ...(prev.tov || {}) };
        if (clean === '') delete nextTov[key];
        else nextTov[key] = clean;
        return { ...prev, tov: nextTov };
      });
    },
    [updateState]
  );

  const handleApplyWorkingDays = useCallback(
    (days: number) => {
      const n = Math.max(0, days || 0);
      updateState((prev) => ({
        ...prev,
        wdm: { ...(prev.wdm || {}), [getMonthKey(prev)]: n },
        e: prev.e.map((emp) => {
          if (!emp.ab) return emp;
          const nextAb = { ...emp.ab };
          delete nextAb.wd;
          return { ...emp, ab: nextAb };
        }),
      }));
    },
    [updateState]
  );

  const handleUpdateEmployeeAbsentee = useCallback(
    (globalIndex: number, key: string, value: string) => {
      updateState((prev) => ({
        ...prev,
        e: prev.e.map((emp, idx) => {
          if (idx !== globalIndex) return emp;
          return {
            ...emp,
            ab: { ...(emp.ab || {}), [key]: value },
          };
        }),
      }));
    },
    [updateState]
  );

  const handleUpdateMetaText = useCallback(
    (key: string, value: string) => {
      updateState((prev) => ({
        ...prev,
        at: { ...(prev.at || {}), [key]: value },
      }));
    },
    [updateState]
  );

  const handleChangeRowsPerPage = useCallback(
    (kind: 'bill' | 'abs', value: number) => {
      const clamped = Math.max(1, Math.min(20, value || 1));
      updateState((prev) => ({
        ...prev,
        rpp: { ...(prev.rpp || {}), [kind]: clamped },
      }));
    },
    [updateState]
  );

  const handleResetSample = useCallback(() => {
    setState(getDefaultState());
  }, []);

  const school = getSchoolDetails(state);

  return (
    <div className="app-shell min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50/70 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-indigo-200/80 dark:border-slate-800 shadow-xs">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <div className="inline-flex items-center gap-2.5 font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <span>School Bills</span>
          </div>

          <nav aria-label="Document Sections" className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-lg bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700/70">
            {(
              [
                { id: 'pay', label: 'Pay Bill' },
                { id: 'abs', label: 'Absentee Statement' },
                { id: 'lt', label: 'Covering Letter' },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              aria-expanded={showSettings}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showSettings
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">School Details</span>
            </button>

            <div
              role="group"
              aria-label="Color theme"
              className="inline-flex items-center p-0.5 rounded-lg border border-indigo-200 dark:border-slate-700 bg-indigo-50/70 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setIsDark(false)}
                aria-pressed={!isDark}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !isDark
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDark(true)}
                aria-pressed={isDark}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isDark
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-indigo-500 dark:to-blue-500 text-white hover:from-slate-800 hover:to-indigo-900 dark:hover:from-indigo-400 dark:hover:to-blue-400 transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
        {/* School Identity Banner */}
        <div className="no-print mb-4 rounded-xl bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-700 dark:from-indigo-900/90 dark:via-blue-900/90 dark:to-teal-900/80 dark:border dark:border-indigo-700/40 px-5 py-3.5 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base sm:text-lg font-display font-bold tracking-tight text-white">
              {school.name}
            </div>
            <div className="text-xs text-sky-100 mt-0.5">
              Pay Bill &amp; Absentee Statement · Block {school.block} · Dist. {school.dist} · UDISE {school.udise}
            </div>
          </div>
          <div className="text-xs font-medium text-teal-100">
            All changes auto-save locally in your browser
          </div>
        </div>

        {showSettings && (
          <SchoolSettingsPanel
            state={state}
            onUpdateSchool={handleUpdateSchool}
            onImportState={(nextState) => setState(nextState)}
            onClose={() => setShowSettings(false)}
          />
        )}

        {activeTab !== 'lt' && (
          <BillGroupBar
            state={state}
            onSelectGroup={handleSelectGroup}
            onRenameGroup={handleRenameGroup}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {activeTab === 'pay' && (
          <PayBillTab
            state={state}
            billRef={billRef}
            onChangeMonth={(m) => updateState((p) => ({ ...p, m }))}
            onChangeYear={(y) => updateState((p) => ({ ...p, y }))}
            onChangeRate={(k, v) => updateState((p) => ({ ...p, [k]: v }))}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            onClearBreaks={handleClearBreaks}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onMoveEmployee={handleMoveEmployee}
            onToggleBreak={handleToggleBreak}
            onUpdateEmployeeField={handleUpdateEmployeeField}
            onUpdateEmployeeOverride={handleUpdateEmployeeOverride}
            onUpdateTotalOverride={handleUpdateTotalOverride}
            onResetSample={handleResetSample}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'abs' && (
          <AbsenteeTab
            state={state}
            absRef={absRef}
            onChangeMonth={(m) => updateState((p) => ({ ...p, m }))}
            onChangeYear={(y) => updateState((p) => ({ ...p, y }))}
            onApplyWorkingDays={handleApplyWorkingDays}
            onSetEmployeeCount={handleSetEmployeeCount}
            onAddEmployee={handleAddEmployee}
            onDeleteLastEmployee={handleDeleteLastEmployee}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            onClearBreaks={handleClearBreaks}
            onMoveEmployee={handleMoveEmployee}
            onToggleBreak={handleToggleBreak}
            onUpdateEmployeeField={handleUpdateEmployeeField}
            onUpdateEmployeeAbsentee={handleUpdateEmployeeAbsentee}
            onUpdateAbsenteeMeta={handleUpdateMetaText}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'lt' && (
          <CoveringLetterTab
            state={state}
            onChangeMonth={(m) => updateState((p) => ({ ...p, m }))}
            onChangeYear={(y) => updateState((p) => ({ ...p, y }))}
            onUpdateLetterText={handleUpdateMetaText}
            onUpdateSchool={handleUpdateSchool}
            onPrint={handlePrint}
          />
        )}
      </main>
      <OfflineIndicator />
    </div>
  );
}
