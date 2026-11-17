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
      className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            School Details & Backup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            These details appear automatically in the Pay Bill, Absentee Statement, and Covering Letter headings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCHOOL_FIELDS.map((field) => (
          <label
            key={field.key}
            className={`flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 ${
              field.wide ? 'sm:col-span-2 lg:col-span-2' : ''
            }`}
          >
            <span>{field.label}</span>
            <input
              type="text"
              value={String(school[field.key] ?? '')}
              onChange={(e) => onUpdateSchool(field.key, e.target.value)}
              className="px-2.5 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(school.pdev)}
            onChange={(e) => onUpdateSchool('pdev', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span>Print developer name on sheets</span>
        </label>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(school.lhtxt)}
            onChange={(e) => onUpdateSchool('lhtxt', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span>
            Letter: use text letterhead (follows the details above) instead of the original letterhead image
          </span>
        </label>
      </div>
    </section>
  );
};
