import React, { useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import {
  CREST_DATA_URI,
  LETTERHEAD_DATA_URI,
  WATERMARK_DATA_URI,
} from '../data/letterAssets';
import type { BillState } from '../types/bill';
import {
  fitLetterLines,
  getGroupName,
  getSchoolDetails,
  mmx,
  mmy,
  MONTHS,
  titleCase,
} from '../utils/billHelpers';
import { EditableCell } from './EditableCell';

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

  useEffect(() => {
    const runFit = () => fitLetterLines(letterRef.current);
    runFit();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(runFit);
    }
    const onBeforePrint = () => runFit();
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, [state]);

  const boxStyle = (x: number, y: number, x2: number): React.CSSProperties => ({
    left: mmx(x),
    top: mmy(y - 8.85),
    width: mmx(x2 - x),
  });

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
          <img
            className="wmk"
            src={WATERMARK_DATA_URI}
            alt="Official school watermark"
            referrerPolicy="no-referrer"
            style={{
              left: mmx(48),
              top: mmy(192),
              width: mmx(560),
              height: mmy(535),
            }}
          />

          {school.lhtxt ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: mmx(8),
                  top: mmy(3),
                  width: mmx(633),
                  height: mmy(197),
                }}
              >
                <div className="bar" />
                <div className="lh">
                  <img
                    src={CREST_DATA_URI}
                    alt="Government school emblem"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hc">
                    <div className="q1">
                      <EditableCell
                        value={val('h1', 'THE OFFICE OF THE HEADMASTER')}
                        onCommit={commit('h1')}
                      />
                    </div>
                    <div className="q2">{school.lname}</div>
                    <div className="q3">
                      AT/PO-{school.place},BLOCK-{school.block},DIST-{school.dist},PIN-{school.pin}
                    </div>
                  </div>
                </div>
                <div className="pb">
                  <u>Email-{school.email}</u>
                  <span>BSE CODE-{school.bse}</span>
                  <span>UDISE CODE-{school.udise}</span>
                </div>
              </div>
              <div
                className="fn lx"
                style={{ left: mmx(12), top: mmy(167), width: mmx(260) }}
              >
                Letter No.:-{' '}
                <EditableCell
                  value={val('ln', '______________')}
                  onCommit={commit('ln')}
                />
              </div>
              <div
                className="fn lx"
                style={{
                  left: mmx(400),
                  top: mmy(167),
                  width: mmx(232),
                  textAlign: 'right',
                }}
              >
                Dated:-{' '}
                <EditableCell
                  value={val('dt', '______________')}
                  onCommit={commit('dt')}
                />
              </div>
            </>
          ) : (
            <>
              <img
                className="lhimg"
                src={LETTERHEAD_DATA_URI}
                alt="School letterhead"
                referrerPolicy="no-referrer"
                style={{
                  left: mmx(8),
                  top: mmy(3),
                  width: mmx(633),
                  height: mmy(197),
                }}
              />
              <div
                className="fn lx"
                style={{ left: mmx(84), top: mmy(166), width: mmx(104) }}
              >
                <EditableCell value={val('ln', '')} onCommit={commit('ln')} />
              </div>
              <div
                className="fn lx"
                style={{ left: mmx(518), top: mmy(166), width: mmx(112) }}
              >
                <EditableCell value={val('dt', '')} onCommit={commit('dt')} />
              </div>
            </>
          )}

          <div className="fn" style={boxStyle(45, 212, 300)}>
            <EditableCell value={val('to0', 'To')} onCommit={commit('to0')} />
          </div>
          <div className="fn" style={boxStyle(48, 238, 520)}>
            <EditableCell
              value={val('to1', `The District Education officer of ${district},`)}
              onCommit={commit('to1')}
            />
          </div>
          <div className="fn" style={boxStyle(48, 265, 300)}>
            <EditableCell value={val('to2', `${district},Odisha.`)} onCommit={commit('to2')} />
          </div>

          <div className="fl" style={boxStyle(45, 291, 613)}>
            <EditableCell
              value={val(
                's1',
                'Sub :-Submission of Monthly Claim-cum-Absentee statement of Secondary Assistant'
              )}
              onCommit={commit('s1')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 310, 613)}>
            <EditableCell
              value={val(
                's2',
                `Teachers(${groupName})of this mentioned institutions for the month of`
              )}
              onCommit={commit('s2')}
            />
          </div>
          <div className="fn" style={boxStyle(45, 328, 613)}>
            <b>
              <u>&nbsp;{mon}&nbsp;</u>
            </b>{' '}
            and Year of {state.y}.
          </div>

          <div className="fn" style={boxStyle(45, 353, 300)}>
            <EditableCell
              value={val('hon', 'Highly Esteemed sir,')}
              onCommit={commit('hon')}
            />
          </div>

          <div className="fl" style={boxStyle(165, 379, 613)}>
            <EditableCell
              value={val(
                'p1',
                'In inviting to kind reference to the subject cited above, I the'
              )}
              onCommit={commit('p1')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 397, 613)}>
            <EditableCell
              value={val(
                'p2',
                `Headmaster of ${titleCase(school.name)} under your jurisdiction submitting the`
              )}
              onCommit={commit('p2')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 414, 613)}>
            <EditableCell
              value={val(
                'p3',
                'Monthly claim-cum- absentees statement of Secondary Assistant Teachers (PRAN'
              )}
              onCommit={commit('p3')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 432, 613)}>
            <EditableCell
              value={val('p4', 'STAFF) of this school for the month of')}
              onCommit={commit('p4')}
            />{' '}
            <b>
              <u>&nbsp;{mon}&nbsp;</u>
            </b>{' '}
            of {state.y} .
          </div>

          <div className="fl" style={boxStyle(45, 449, 613)}>
            <EditableCell
              value={val(
                'p5',
                'All the particulars provided in the given Proforma of Claim-cum- absentees'
              )}
              onCommit={commit('p5')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 467, 613)}>
            <EditableCell
              value={val(
                'p6',
                'statement of the Assistant teachers of this school are true to the best of my'
              )}
              onCommit={commit('p6')}
            />
          </div>
          <div className="fl" style={boxStyle(45, 485, 613)}>
            <EditableCell
              value={val(
                'p7',
                'knowledge and Self-belief as per performance of the teachers for this month and'
              )}
              onCommit={commit('p7')}
            />
          </div>
          <div className="fn" style={boxStyle(45, 502, 450)}>
            <EditableCell
              value={val('p8', 'official record of this school.')}
              onCommit={commit('p8')}
            />
          </div>

          <div className="fl" style={boxStyle(125, 530, 592)}>
            <EditableCell
              value={val(
                'b3',
                'This is Favor of your kind information and further necessary action.'
              )}
              onCommit={commit('b3')}
            />
          </div>

          <div className="fn" style={boxStyle(413, 555, 560)}>
            <EditableCell
              value={val('yf', '\u201cYours Faithfully\u201d')}
              onCommit={commit('yf')}
            />
          </div>

          <div className="fn" style={boxStyle(357, 595, 613)}>
            <EditableCell
              value={val('sg', '(Seal & Signature Of Headmaster)')}
              onCommit={commit('sg')}
            />
          </div>

          <div className="fn" style={boxStyle(45, 688, 613)}>
            <i>
              <EditableCell
                value={val(
                  'nb',
                  'N*B :- Bill-cum-Absentee Proforma of the teachers attached herewith.'
                )}
                onCommit={commit('nb')}
              />
            </i>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              top: mmy(768),
              textAlign: 'center',
              fontSize: '30pt',
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            ⚛
          </div>

          {school.pdev && (
            <div
              style={{
                position: 'absolute',
                right: '8mm',
                bottom: '5mm',
                fontSize: '6.5pt',
                fontWeight: 400,
                lineHeight: 1.2,
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
