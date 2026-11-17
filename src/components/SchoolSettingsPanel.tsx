import React, { useRef } from 'react';
import { Download, Upload, X } from 'lucide-react';
import type { BillState, SchoolDetails } from '../types/bill';
import { getSchoolDetails, normalizeState } from '../utils/billHelpers';

interface SchoolSettingsPanelProps {
  state: BillState;
  onUpdateSchool: (key: keyof SchoolDetails, value: string | boolean) => void;
  onImportState: (nextState: BillState) => void;
  onClose: () => void;
}

const SCHOOL_FIELDS: Array<{
  key: keyof SchoolDetails;
  label: string;
  wide?: boolean;
}> = [
  { key: 'name', label: 'School Name', wide: true },
  { key: 'place', label: 'Place / Village' },
  { key: 'block', label: 'Block' },
  { key: 'dist', label: 'District' },
  { key: 'pin', label: 'PIN Code' },
  { key: 'email', label: 'Email ID', wide: true },
  { key: 'wa', label: 'WhatsApp / Contact No.' },
  { key: 'bse', label: 'BSE Code' },
  { key: 'udise', label: 'UDISE Code' },
  { key: 'lname', label: 'Letterhead School Name', wide: true },
  { key: 'dev', label: 'Developer Name' },
  { key: 'devd', label: 'Developer Designation & School', wide: true },
];

export const SchoolSettingsPanel: React.FC<SchoolSettingsPanelProps> = ({
  state,
  onUpdateSchool,
  onImportState,
  onClose,
}) => {
  const school = getSchoolDetails(state);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-bills-backup-${state.y}-${String(state.m + 1).padStart(2, '0')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        onImportState(normalizeState(parsed));
      } catch {
        // Ignore invalid JSON file
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section
      aria-label="School Details Configuration"
      className="no-print bg-white/95 dark:bg-slate-900/95 border border-indigo-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden mb-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-teal-50/70 dark:from-indigo-950/50 dark:via-slate-900 dark:to-teal-950/30 border-b border-indigo-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-100">
            School Details &amp; Backup
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            These details appear automatically in the Pay Bill, Absentee Statement, and Covering Letter headings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Restore Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportJson}
            className="hidden"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close school details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SCHOOL_FIELDS.map((field) => (
            <label
              key={field.key}
              className={`flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 ${
                field.wide ? 'sm:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <span>{field.label}</span>
              <input
                type="text"
                value={String(school[field.key] ?? '')}
                onChange={(e) => onUpdateSchool(field.key, e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-lg border border-indigo-200/80 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-indigo-100 dark:border-slate-800">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(school.pdev)}
              onChange={(e) => onUpdateSchool('pdev', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-600"
            />
            <span>Print developer name on sheets</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(school.lhtxt)}
              onChange={(e) => onUpdateSchool('lhtxt', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-600"
            />
            <span>
              Letter: use text letterhead (follows the details above) instead of the original letterhead image
            </span>
          </label>
        </div>
      </div>
    </section>
  );
};
