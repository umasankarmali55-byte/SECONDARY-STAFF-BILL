export type TabKey = 'pay' | 'abs' | 'lt';

export interface EmployeeOverrides {
  da?: string | number;
  hra?: string | number;
  tot?: string | number;
  pr?: string | number;
  ded?: string | number;
  net?: string | number;
}

export interface AbsenteeFields {
  [key: string]: string | undefined;
}

export interface Employee {
  n: string;
  d: string;
  pay: number;
  ac: string;
  ifsc: string;
  pran: string;
  pan: string;
  hrms: string;
  mob: string;
  lic: number;
  gis: number;
  fa: number;
  it: number;
  pt: number;
  g?: number;
  sl?: string;
  sig?: string;
  brk?: boolean;
  abrk?: boolean;
  ov?: EmployeeOverrides;
  ab?: AbsenteeFields;
}

export interface BillGroup {
  n: string;
}

export interface SchoolDetails {
  name: string;
  place: string;
  block: string;
  dist: string;
  pin: string;
  email: string;
  wa: string;
  bse: string;
  udise: string;
  lname: string;
  dev: string;
  devd: string;
  pdev: boolean;
  lhtxt: boolean;
  logo?: string;
}

export interface PrintRowsPerPage {
  bill?: number;
  abs?: number;
}

export interface TotalOverrides {
  [key: string]: string | undefined;
}

export interface BillState {
  m: number;
  y: number;
  da: number;
  hra: number;
  pr: number;
  e: Employee[];
  g?: BillGroup[];
  cg?: number;
  sc?: Partial<SchoolDetails>;
  at?: Record<string, string | undefined>;
  tov?: TotalOverrides;
  wdm?: Record<string, number>;
  rpp?: PrintRowsPerPage;
}

export interface CalculatedPay {
  pay: number;
  da: number;
  hra: number;
  tot: number;
  pr: number;
  ded: number;
  net: number;
}

export interface PayTotals {
  pay: number;
  da: number;
  hra: number;
  tot: number;
  pr: number;
  lic: number;
  gis: number;
  fa: number;
  it: number;
  pt: number;
  ded: number;
  net: number;
}
