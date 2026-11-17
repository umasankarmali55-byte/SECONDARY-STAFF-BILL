import type {
  BillState,
  CalculatedPay,
  Employee,
  PayTotals,
  SchoolDetails,
} from '../types/bill';

export const STORAGE_KEY = 'pranbill';

export const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const;

export const DEFAULT_SCHOOL_DETAILS: SchoolDetails = {
  name: 'GOVT. U.G HIGH SCHOOL MALDA',
  place: 'MALDA',
  block: 'BORIGUMMA',
  dist: 'KORAPUT',
  pin: '764056',
  email: 'ughschoolmalda123@gmail.com',
  wa: '8342807702',
  bse: '216FA',
  udise: '21290310201',
  lname: 'GOVERNMENT UPGRADED HIGH SCHOOL MALDA',
  dev: 'UMA SANKAR MALI',
  devd: 'Assistant Teacher, Govt. UGHS Malda',
  pdev: false,
  lhtxt: false,
};

type SampleTuple = [string, string, number, string, string, string, string, string, string];

const SAMPLE_ROWS: SampleTuple[] = [
  ['KEDAR NATH SETHI', 'TGT (PCM)', 46200, '30626469059', 'SBIN0003088', '110156257133', 'GZDPS9021M', '96297352', '9937236882'],
  ['ANITA PATEL', 'TGT (ARTS)', 46200, '32782533543', 'SBIN0009290', '110186257154', 'BZMPP7515F', '96261307', '8018065565'],
  ['DUMAR BHATRA', 'TGT (CBZ)', 38700, '41180814393', 'SBIN0002030', '110128291362', 'ECCPB9627L', '91372811', '8280233973'],
  ['GAYATRI MOHANTY', 'CLASSICAL TEACHER', 46200, '32933380642', 'SBIN0002030', '110126257160', 'CDPPM5596K', '96297354', '9178018775'],
  ['HIRALAL NAYAK', 'HINDI TEACHER', 36500, '34195886376', 'SBIN0009290', '110201128514', 'AVMPN0906F', '91423080', '8249445482'],
  ['HRUDANANDA NAYAK', 'PET', 38100, '31982059332', 'SBIN0003108', '110147489170', 'BBUPN3961M', '96281590', '9178905628'],
  ['TARINI PRASAD DASH', 'JUNIOR ASSISTANT', 25200, '30901907240', 'SBIN0012099', '110053479882', 'AYMPD2651C', '91113281', '9438578577'],
];

export function createSampleEmployees(): Employee[] {
  return SAMPLE_ROWS.map((a) => ({
    n: a[0],
    d: a[1],
    pay: a[2],
    ac: a[3],
    ifsc: a[4],
    pran: a[5],
    pan: a[6],
    hrms: a[7],
    mob: a[8],
    lic: 0,
    gis: 0,
    fa: 0,
    it: 0,
    pt: 200,
    g: 0,
  }));
}

export function createEmptyEmployee(groupIndex = 0): Employee {
  return {
    n: '',
    d: '',
    pay: 0,
    ac: '',
    ifsc: '',
    pran: '',
    pan: '',
    hrms: '',
    mob: '',
    lic: 0,
    gis: 0,
    fa: 0,
    it: 0,
    pt: 200,
    g: groupIndex,
  };
}

export function getDefaultState(): BillState {
  const now = new Date();
  return {
    m: now.getMonth(),
    y: now.getFullYear(),
    da: 60,
    hra: 4,
    pr: 10,
    e: createSampleEmployees(),
    g: [{ n: 'PRAN STAFF' }],
    cg: 0,
  };
}

export function normalizeState(raw: unknown): BillState {
  if (!raw || typeof raw !== 'object') return getDefaultState();
  const s = raw as Partial<BillState>;
  if (!Array.isArray(s.e)) return getDefaultState();
  const groups = Array.isArray(s.g) && s.g.length > 0 ? s.g : [{ n: 'PRAN STAFF' }];
  const cg = Math.max(0, Math.min(Number(s.cg) || 0, groups.length - 1));
  return {
    m: typeof s.m === 'number' && s.m >= 0 && s.m <= 11 ? s.m : new Date().getMonth(),
    y: typeof s.y === 'number' && s.y > 1900 ? s.y : new Date().getFullYear(),
    da: Number.isFinite(Number(s.da)) ? Number(s.da) : 60,
    hra: Number.isFinite(Number(s.hra)) ? Number(s.hra) : 4,
    pr: Number.isFinite(Number(s.pr)) ? Number(s.pr) : 10,
    e: s.e,
    g: groups,
    cg,
    sc: s.sc || {},
    at: s.at || {},
    tov: s.tov || {},
    wdm: s.wdm || {},
    rpp: s.rpp || {},
  };
}

export function loadState(): BillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: BillState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function getSchoolDetails(state: BillState): SchoolDetails {
  return { ...DEFAULT_SCHOOL_DETAILS, ...(state.sc || {}) };
}

export function getGroupIndex(state: BillState): number {
  const len = state.g?.length || 1;
  return Math.max(0, Math.min(state.cg || 0, len - 1));
}

export function getGroupName(state: BillState): string {
  const groups = state.g && state.g.length > 0 ? state.g : [{ n: 'PRAN STAFF' }];
  return groups[getGroupIndex(state)]?.n ?? 'PRAN STAFF';
}

export function getMonthKey(state: BillState): string {
  return `${state.y}-${state.m}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getRowsPerPage(state: BillState, kind: 'bill' | 'abs'): number {
  const raw = state.rpp?.[kind];
  const fallback = kind === 'bill' ? 4 : 5;
  return Math.max(1, Math.min(20, Number(raw) || fallback));
}

export function formatIndianNumber(v: number | string | undefined | null): string {
  const num = Number(v);
  return num ? num.toLocaleString('en-IN') : '';
}

export function titleCase(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function numberToIndianWords(input: number): string {
  let n = Math.floor(Math.max(0, Number(input) || 0));
  if (n === 0) return 'Zero';
  const o = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const two = (x: number) => (x < 20 ? o[x] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + o[x % 10] : ''));
  const three = (x: number) =>
    (x >= 100 ? o[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') +
    (x % 100 ? two(x % 100) : '');

  const r: string[] = [];
  const c = Math.floor(n / 1e7);
  n %= 1e7;
  const l = Math.floor(n / 1e5);
  n %= 1e5;
  const th = Math.floor(n / 1e3);
  n %= 1e3;
  if (c) r.push(two(c) + ' Crore');
  if (l) r.push(two(l) + ' Lakh');
  if (th) r.push(two(th) + ' Thousand');
  if (n) r.push(three(n));
  return r.join(' ');
}

export function calculateEmployeePay(emp: Employee, state: BillState): CalculatedPay {
  const overrideOr = (k: keyof NonNullable<Employee['ov']>, v: number): number => {
    const x = emp.ov?.[k];
    return x === undefined || x === '' ? v : Number(String(x).replace(/,/g, '')) || 0;
  };
  const pay = Number(emp.pay) || 0;
  const da = overrideOr('da', Math.round((pay * state.da) / 100));
  const hra = overrideOr('hra', Math.round((pay * state.hra) / 100));
  const tot = overrideOr('tot', pay + da + hra);
  const pr = overrideOr('pr', Math.round(((pay + da) * state.pr) / 100));
  const ded = overrideOr(
    'ded',
    pr +
      (Number(emp.lic) || 0) +
      (Number(emp.gis) || 0) +
      (Number(emp.fa) || 0) +
      (Number(emp.it) || 0) +
      (Number(emp.pt) || 0)
  );
  const net = overrideOr('net', tot - ded);
  return { pay, da, hra, tot, pr, ded, net };
}

export function calculateGroupTotals(employees: Employee[], state: BillState): PayTotals {
  const T: PayTotals = {
    pay: 0,
    da: 0,
    hra: 0,
    tot: 0,
    pr: 0,
    lic: 0,
    gis: 0,
    fa: 0,
    it: 0,
    pt: 0,
    ded: 0,
    net: 0,
  };
  employees.forEach((emp) => {
    const c = calculateEmployeePay(emp, state);
    T.pay += c.pay;
    T.da += c.da;
    T.hra += c.hra;
    T.tot += c.tot;
    T.pr += c.pr;
    T.ded += c.ded;
    T.net += c.net;
    T.lic += Number(emp.lic) || 0;
    T.gis += Number(emp.gis) || 0;
    T.fa += Number(emp.fa) || 0;
    T.it += Number(emp.it) || 0;
    T.pt += Number(emp.pt) || 0;
  });
  return T;
}

export function mmx(x: number): string {
  return ((x * 210) / 655).toFixed(2) + 'mm';
}

export function mmy(y: number): string {
  return ((y * 297) / 923).toFixed(2) + 'mm';
}

export function fitLetterLines(container: HTMLElement | null): void {
  if (!container) return;
  const lines = container.querySelectorAll<HTMLElement>('.fl');
  for (let i = 0; i < lines.length; i++) {
    const el = lines[i];
    if (!el.offsetParent) continue;
    let ls = 1.8;
    let g = 0;
    el.style.letterSpacing = ls + 'px';
    while (el.scrollWidth > el.clientWidth + 0.5 && ls > -0.8 && g < 60) {
      ls -= 0.1;
      el.style.letterSpacing = ls + 'px';
      g++;
    }
  }
}

const PRINT_PAGE_HEIGHT = 694;

type PaginatedElement = HTMLElement & { _origHtml?: string };

export function paginateForPrint(
  root: PaginatedElement | null,
  rpp: number,
  breaks: boolean[]
): void {
  if (!root || root.offsetParent === null || root._origHtml !== undefined) return;
  const tbl = root.querySelector('table');
  if (!tbl) return;

  root._origHtml = root.innerHTML;
  root.style.width = '1020px';
  root.style.position = 'relative';

  const kids = Array.from(root.children);
  const ti = kids.indexOf(tbl);
  const pre = kids.slice(0, ti);
  const post = kids.slice(ti + 1);

  const trs = Array.from(tbl.rows);
  const heads = trs.filter((r) => r.querySelector('th'));
  const rest = trs.filter((r) => !r.querySelector('th'));
  const tot = rest.find((r) => r.classList.contains('tot'));
  const data = rest.filter((r) => r !== tot);

  let hh = 0;
  heads.forEach((r) => {
    hh += r.offsetHeight;
  });
  const preH = tbl.offsetTop;
  const postH = root.offsetHeight - tbl.offsetTop - tbl.offsetHeight;
  const totH = tot ? tot.offsetHeight : 0;
  const rh = data.map((r) => r.offsetHeight);

  const sum = (p: number[]) => p.reduce((acc, idx) => acc + (rh[idx] || 0), 0);

  const pages: number[][] = [[]];
  data.forEach((_, i) => {
    const p = pages[pages.length - 1];
    if (p.length && (p.length >= rpp || breaks[i - 1])) {
      pages.push([i]);
    } else {
      p.push(i);
    }
  });

  root.innerHTML = '';
  pages.forEach((p, pi) => {
    const pg = document.createElement('div');
    pg.className = 'pg';
    if (pi === 0) pre.forEach((n) => pg.appendChild(n.cloneNode(true)));

    const t = tbl.cloneNode(false) as HTMLTableElement;
    const cg = tbl.querySelector('colgroup');
    if (cg) t.appendChild(cg.cloneNode(true));

    const tb = document.createElement('tbody');
    heads.forEach((r) => tb.appendChild(r.cloneNode(true)));
    p.forEach((i) => tb.appendChild(data[i].cloneNode(true)));

    const last = pi === pages.length - 1;
    if (last && tot) tb.appendChild(tot.cloneNode(true));
    t.appendChild(tb);
    pg.appendChild(t);

    if (last) post.forEach((n) => pg.appendChild(n.cloneNode(true)));

    const need = (pi === 0 ? preH : 0) + hh + sum(p) + (last ? totH + postH : 0) + 6;
    let z = Math.min(1, PRINT_PAGE_HEIGHT / need);
    if (z < 1) {
      z = Math.max(z, 0.35);
      (pg.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(z);
      pg.style.width = 1020 / z + 'px';
    }
    root.appendChild(pg);
  });
}

export function unpaginateAfterPrint(root: PaginatedElement | null): void {
  if (root && root._origHtml !== undefined) {
    root.innerHTML = root._origHtml;
    delete root._origHtml;
    root.style.width = '';
    root.style.position = '';
  }
}

export function exportGroupCsv(
  employees: Employee[],
  state: BillState,
  groupName: string
): void {
  const headers = [
    'SL NO',
    'Name',
    'Designation',
    'Pay',
    'DA',
    'HRA',
    'Gross Total',
    'PRAN',
    'LIC',
    'GIS',
    'FA',
    'IT',
    'PT',
    'Total Deduction',
    'Net Payable',
    'SBI A/C No',
    'IFSC',
    'PRAN No',
    'PAN',
    'HRMS ID',
    'Mobile',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const rows = employees.map((emp, idx) => {
    const c = calculateEmployeePay(emp, state);
    return [
      emp.sl != null ? emp.sl : idx + 1,
      emp.n,
      emp.d,
      c.pay,
      c.da,
      c.hra,
      c.tot,
      c.pr,
      emp.lic || 0,
      emp.gis || 0,
      emp.fa || 0,
      emp.it || 0,
      emp.pt || 0,
      c.ded,
      c.net,
      emp.ac,
      emp.ifsc,
      emp.pran,
      emp.pan,
      emp.hrms,
      emp.mob,
    ].map(escapeCsv);
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeGroup = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = url;
  a.download = `${safeGroup}-${MONTHS[state.m].toLowerCase()}-${state.y}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
