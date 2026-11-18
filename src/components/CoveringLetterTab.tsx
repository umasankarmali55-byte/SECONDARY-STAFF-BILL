import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import type { BillState } from '../types/bill';
import { getGroupName, getSchoolDetails, MONTHS, titleCase } from '../utils/billHelpers';
import { EditableCell } from './EditableCell';

const SCHOOL_LOGO_SRC = '/assets/aistudio/Gemini_Generated_Image_aceoqwaceoqwaceo_8978e281.png';

interface CoveringLetterTabProps {
  state: BillState;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  onUpdateLetterText: (key: string, value: string) => void;
  onPrint: () => void;
}

export const CoveringLetterTab: React.FC<CoveringLetterTabProps> = ({
  state,
  onChangeMonth,
  onChangeYear,
  onUpdateLetterText,
  onPrint,
}) => {
  const letterRef = useRef<HTMLDivElement | null>(null);
  const school = getSchoolDetails(state);
  const mon = MONTHS[state.m];
  const district = titleCase(school.dist);
  const groupName = getGroupName(state);
  const at = state.at || {};

  const val = (key: string, fallback: string) =>
    at[`l_${key}`] !== undefined ? String(at[`l_${key}`]) : fallback;

  const commit = (key: string) => (next: string) => {
    onUpdateLetterText(`l_${key}`, next);
  };

  const legacySubj =
    at.l_s1 !== undefined || at.l_s2 !== undefined
      ? [
          val(
            's1',
            'Sub :-Submission of Monthly Claim-cum-Absentee statement of Secondary Assistant'
          ),
          val(
            's2',
            `Teachers(${groupName})of this mentioned institutions for the month of`
          ),
        ].join(' ')
      : `Sub :-Submission of Monthly Claim-cum-Absentee statement of Secondary Assistant Teachers(${groupName})of this mentioned institutions for the month of`;

  const legacyBodyA =
    at.l_p1 !== undefined ||
    at.l_p2 !== undefined ||
    at.l_p3 !== undefined ||
    at.l_p4 !== undefined
      ? [
          val('p1', 'In inviting to kind reference to the subject cited above, I the'),
          val(
            'p2',
            `Headmaster of ${titleCase(school.name)} under your jurisdiction submitting the`
          ),
          val('p3', 'Monthly claim-cum- absentees statement of Secondary Assistant Teachers (PRAN'),
          val('p4', 'STAFF) of this school for the month of'),
        ].join(' ')
      : `In inviting to kind reference to the subject cited above, I the Headmaster of ${titleCase(school.name)} under your jurisdiction submitting the Monthly claim-cum- absentees statement of Secondary Assistant Teachers (PRAN STAFF) of this school for the month of`;

  const legacyBodyB =
    at.l_p5 !== undefined ||
    at.l_p6 !== undefined ||
    at.l_p7 !== undefined ||
    at.l_p8 !== undefined
      ? [
          val('p5', 'All the particulars provided in the given Proforma of Claim-cum- absentees'),
          val('p6', 'statement of the Assistant teachers of this school are true to the best of my'),
          val('p7', 'knowledge and Self-belief as per performance of the teachers for this month and'),
          val('p8', 'official record of this school.'),
        ].join(' ')
      : 'All the particulars provided in the given Proforma of Claim-cum- absentees statement of the Assistant teachers of this school are true to the best of my knowledge and Self-belief as per performance of the teachers for this month and official record of this school.';

  return (
    <div className="space-y-4">
      <div className="no-print bg-white/95 dark:bg-slate-900/95 border border-indigo-200/80 dark:border-slate-800 rounded-xl shadow-xs p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-display font-bold text-indigo-950 dark:text-indigo-100">
              Covering Letter (A4 Portrait)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Click any line of the letter to edit it. School details come from the School Details panel. Month and year stay synced across all tabs.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span>Month</span>
              <select
                value={state.m}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 text-sm rounded-lg border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span>Year</span>
              <input
                type="number"
                value={state.y}
                onChange={(e) => onChangeYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-24 px-2.5 py-1.5 text-sm tabular-nums rounded-lg border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print (A4 Portrait)
            </button>
          </div>
        </div>
      </div>

      <div className="pv-wrap pv-portrait overflow-x-auto bg-gradient-to-b from-indigo-100/60 to-sky-100/50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-6 rounded-xl border border-indigo-200/80 dark:border-slate-800">
        <div className="no-print mb-2.5 flex items-center justify-between text-xs font-medium text-indigo-900/80 dark:text-indigo-200/80 max-w-[210mm] mx-auto">
          <span>Printable Document Preview · A4 Portrait</span>
          <span>Click any line on the letter to edit</span>
        </div>

        <div ref={letterRef} id="ltr" className="lt shadow-lg">
          {/* Center Circular School Crest Watermark */}
          <img
            className="lt-wmk"
            src={SCHOOL_LOGO_SRC}
            alt="School emblem watermark"
            referrerPolicy="no-referrer"
          />

          {/* Top Gradient Pill Accent Bar */}
          <div className="lt-top-bar" />

          {/* Ornamental Center Divider */}
          <div className="lt-ornament" aria-hidden="true">
            <span className="lt-ornament-core">
              <span className="lt-ornament-line" />
              <span className="lt-ornament-dot" />
              <span className="lt-ornament-diamond" />
              <span className="lt-ornament-dot" />
              <span className="lt-ornament-line" />
            </span>
          </div>

          {/* Letterhead Logo + School Heading */}
          <div className="lt-header">
            <img
              className="lt-logo"
              src={SCHOOL_LOGO_SRC}
              alt="School crest logo"
              referrerPolicy="no-referrer"
            />
            <div className="lt-header-text">
              <div className="lt-h1">
                <EditableCell
                  value={val('h1', 'THE OFFICE OF THE HEADMASTER')}
                  onCommit={commit('h1')}
                />
              </div>
              <div className="lt-h2">{school.lname}</div>
              <div className="lt-h3">
                AT/PO-{school.place},BLOCK-{school.block},DIST-{school.dist},PIN-{school.pin}
              </div>
            </div>
          </div>

          {/* Purple School Contact / Codes Bar */}
          <div className="lt-purple-bar">
            <div className="lt-purple-cell">
              <u>Email-{school.email}</u>
            </div>
            <div className="lt-purple-cell">BSE CODE-{school.bse}</div>
            <div className="lt-purple-cell">UDISE CODE-{school.udise}</div>
          </div>

          {/* Red Letter No. & Dated Row */}
          <div className="lt-ref-row">
            <div className="lt-ref-field">
              <span>Letter No. : -</span>
              <EditableCell
                as="span"
                className="lt-red-line"
                value={val('ln', '')}
                onCommit={commit('ln')}
              />
            </div>
            <div className="lt-ref-field">
              <span>Dated: -</span>
              <EditableCell
                as="span"
                className="lt-red-line"
                value={val('dt', '')}
                onCommit={commit('dt')}
              />
            </div>
          </div>

          {/* Letter Body (Exact Existing Writing Preserved, Scaled to Match Screenshot) */}
          <div className="lt-body">
            <div>
              <EditableCell value={val('to0', 'To')} onCommit={commit('to0')} />
            </div>

            <div style={{ marginLeft: '3mm', marginTop: '1mm' }}>
              <div>
                <EditableCell
                  value={val('to1', `The District Education officer of ${district},`)}
                  onCommit={commit('to1')}
                />
              </div>
              <div>
                <EditableCell value={val('to2', `${district},Odisha.`)} onCommit={commit('to2')} />
              </div>
            </div>

            <div style={{ marginTop: '4.5mm', textAlign: 'justify' }}>
              <EditableCell value={val('subj', legacySubj)} onCommit={commit('subj')} />{' '}
              <span className="lt-month-slot">{mon}</span> and Year of {state.y}.
            </div>

            <div style={{ marginTop: '4.5mm' }}>
              <EditableCell
                value={val('hon', 'Highly Esteemed sir,')}
                onCommit={commit('hon')}
              />
            </div>

            <div style={{ marginTop: '4mm', textAlign: 'justify', textIndent: '28mm' }}>
              <EditableCell value={val('bodyA', legacyBodyA)} onCommit={commit('bodyA')} />{' '}
              <span className="lt-month-slot">{mon}</span> of {state.y} .{' '}
              <EditableCell value={val('bodyB', legacyBodyB)} onCommit={commit('bodyB')} />
            </div>

            <div style={{ marginTop: '4.5mm', textAlign: 'center' }}>
              <EditableCell
                value={val(
                  'b3',
                  'This is Favor of your kind information and further necessary action.'
                )}
                onCommit={commit('b3')}
              />
            </div>

            <div style={{ marginTop: '11mm', textAlign: 'right', paddingRight: '20mm' }}>
              <EditableCell
                value={val('yf', '\u201cYours Faithfully\u201d')}
                onCommit={commit('yf')}
              />
            </div>

            <div style={{ marginTop: '14mm', textAlign: 'right', paddingRight: '3mm' }}>
              <EditableCell
                value={val('sg', '(Seal & Signature Of Headmaster)')}
                onCommit={commit('sg')}
              />
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '10.5mm',
              right: '10.5mm',
              bottom: '8.5mm',
              fontSize: '11pt',
              fontWeight: 700,
              fontStyle: 'italic',
              zIndex: 1,
            }}
          >
            <EditableCell
              value={val(
                'nb',
                'N*B :- Bill-cum-Absentee Proforma of the teachers attached herewith.'
              )}
              onCommit={commit('nb')}
            />
          </div>

          {school.pdev && (
            <div
              style={{
                position: 'absolute',
                right: '9mm',
                bottom: '3.5mm',
                fontSize: '6.5pt',
                fontWeight: 400,
                lineHeight: 1.2,
                zIndex: 1,
              }}
            >
              Developed by {school.dev}, {school.devd}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
