export enum RegimenPensionario {
  AFP_HABITAT = "AFP HABITAT",
  AFP_PRIMA = "AFP PRIMA",
  AFP_INTEGRA = "AFP INTEGRA",
  AFP_PROFUTURO = "AFP PROFUTURO",
  LEY_19990 = "LEY 19990",
  SNP_ONP = "Ley 19990 (ONP)"
}

export interface Concept {
  id: string; // e.g. "RM", "DS311", "DS313", "SPP", "COOP_SCB", "TARDANZA", "SUBCAFAE"
  name: string; // e.g. "Remuneración Mensual", "D.S. 311", "Comisión/Aporte AFP"
  type: "ingreso" | "egreso";
  amount: number;
}

export interface Worker {
  id: string; // DNI as primary unique key
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string;
  ruc: string;
  establecimiento: string;
  cargo: string;
  tipoServidor: string; // e.g. "CONTRATADO"
  regimenLaboral: string; // e.g. "12-Ley Nro 1057"
  nivelMag: string; // Niv.Mag./G.Ocup./Horas/HrsAdd e.g. "A/0-0/40/0"
  tiempoServicio: string; // e.g. "--"
  essalud: string; // e.g. "9308291PESTA008"
  fechaIngreso: string; // Ingr: DD/MM/YYYY
  fechaTermino: string; // Termino: DD/MM/YYYY
  ctaAhorro: string; // Bank account
  leyendaPermanente: string;
  leyendaMensual: string;
  regimenPensionario: string;
  isHabilitado: boolean;
  motivoCese?: string; // Reason for termination (e.g. Renuncia, Despido, etc.)
  
  // Default recurring concepts for this worker
  defaultIncomes: Concept[];
  defaultDeductions: Concept[];
}

// Represents a historical record for a specific worker in a specific month
export interface PayrollRecordItem {
  workerId: string;
  workerDni: string;
  workerFullName: string;
  workerCargo: string;
  workerEstablecimiento: string;
  workerRegimenPensionario: string;
  leyendaMensual: string;
  
  incomes: Concept[];
  deductions: Concept[];
  
  tRemun: number; // Sum of incomes
  tDscto: number; // Sum of deductions
  tLiqui: number; // tRemun - tDscto
  mImponible: number; // Imponible amount
}

export interface PayrollPeriod {
  id: string; // format "YYYY-MM" (e.g. "2026-06")
  year: number; // e.g. 2026
  month: number; // 1-12 (e.g. 6)
  label: string; // e.g. "JUNIO - 2026"
  isClosed: boolean;
  records: PayrollRecordItem[];
}

export interface ConceptTypeConfig {
  id: string;
  name: string;
  type: "ingreso" | "egreso";
  isSystem?: boolean; // If true, can't be easily deleted, only edited
}
