import React, { useState, useMemo, useRef, useEffect } from "react";
import { Worker } from "../types";
import { 
  Palmtree, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  Printer, 
  Calculator, 
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserMinus,
  ChevronRight,
  Download
} from "lucide-react";

interface VacacionesTruncasProps {
  workers: Worker[];
}

interface CustomConcept {
  name: string;
  amount: number;
}

interface VacationPeriod {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  days: number;
}

// Utility to parse DD/MM/YYYY into a Date object
function parseDmyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

// Utility to format Date back to DD/MM/YYYY
function formatDmyDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Utility to convert DD/MM/YYYY to YYYY-MM-DD (for HTML input date fields)
function dmyToYmd(dmy: string): string {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
}

// Utility to convert YYYY-MM-DD to DD/MM/YYYY
function ymdToDmy(ymd: string): string {
  if (!ymd) return "";
  const parts = ymd.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Utility to calculate months and days between two dates
function calculateMonthsAndDays(start: Date, end: Date): { months: number; days: number; totalDays: number } {
  if (start > end) return { months: 0, days: 0, totalDays: 0 };
  
  const endInclusive = new Date(end.getTime());
  endInclusive.setDate(endInclusive.getDate() + 1);

  let years = endInclusive.getFullYear() - start.getFullYear();
  let months = endInclusive.getMonth() - start.getMonth();
  let days = endInclusive.getDate() - start.getDate();

  if (days < 0) {
    const tempDate = new Date(endInclusive.getFullYear(), endInclusive.getMonth(), 0);
    days += tempDate.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalMonths = (years * 12) + months;
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    months: totalMonths,
    days,
    totalDays
  };
}

export default function VacacionesTruncas({ workers }: VacacionesTruncasProps) {
  // Navigation inside the tab
  const [activeSubView, setActiveSubView] = useState<"list" | "detail">("list");
  
  // Filtering & searching in the summary table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegimen, setFilterRegimen] = useState<"todos" | "cas" | "dl276" | "dl728">("todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | "cesados" | "activos">("todos");

  // Selection state for active worker detail
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  
  // Custom manual calculation fields (when a worker is selected, these are populated with their data)
  const [workerName, setWorkerName] = useState("");
  const [workerApellidos, setWorkerApellidos] = useState("");
  const [workerDni, setWorkerDni] = useState("");
  const [workerCargo, setWorkerCargo] = useState("");
  const [workerEstablecimiento, setWorkerEstablecimiento] = useState("");
  const [regimenLaboral, setRegimenLaboral] = useState("CAS (Decreto Leg. 1057)");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [basicRemuneration, setBasicRemuneration] = useState<number>(0);
  const [pensionSystem, setPensionSystem] = useState<"onp" | "afp" | "ninguno">("onp");
  
  // Extra regular/fixed concepts for active worker
  const [customConcepts, setCustomConcepts] = useState<CustomConcept[]>([]);
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptAmount, setNewConceptAmount] = useState<number>(0);

  // States for taken vacations and custom calculation cutoff
  const [globalCutOffDate, setGlobalCutOffDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [workersTakenVacations, setWorkersTakenVacations] = useState<Record<string, VacationPeriod[]>>({});
  const [manualDeductedDays, setManualDeductedDays] = useState<Record<string, number>>({});
  
  // Temp inputs for adding vacation periods
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  // Helper to resolve worker basic salary and extra fixed concepts from their master template
  const getWorkerBasics = (worker: Worker) => {
    // Basic income matches typical IDs
    const basicIncome = worker.defaultIncomes.find(i => 
      ["M_CAS", "CAS", "RM", "RE_MEN", "Remuneración Mensual"].includes(i.id) || 
      i.name.toLowerCase().includes("básic") || 
      i.name.toLowerCase().includes("mensual")
    );
    const basic = basicIncome ? basicIncome.amount : (worker.defaultIncomes[0]?.amount || 0);

    // Other fixed regular concepts
    const otherFixed = worker.defaultIncomes
      .filter(i => i.amount > 0 && i.id !== basicIncome?.id)
      .map(i => ({ name: i.name, amount: i.amount }));

    // Infer pension system
    let pen: "onp" | "afp" | "ninguno" = "onp";
    if (worker.regimenPensionario.toUpperCase().includes("ONP") || worker.regimenPensionario.toUpperCase().includes("19990")) {
      pen = "onp";
    } else if (worker.regimenPensionario.toUpperCase().includes("AFP") || worker.regimenPensionario.toUpperCase().includes("INTEGRA") || worker.regimenPensionario.toUpperCase().includes("PRIMA") || worker.regimenPensionario.toUpperCase().includes("PROFUTURO") || worker.regimenPensionario.toUpperCase().includes("HABITAT")) {
      pen = "afp";
    } else {
      pen = "ninguno";
    }

    return { basic, otherFixed, pen };
  };

  // Pre-calculate vacations truncas for ALL workers instantly
  const preCalculatedList = useMemo(() => {
    const defaultCutOffStr = ymdToDmy(globalCutOffDate);

    return workers.map(w => {
      const { basic, otherFixed, pen } = getWorkerBasics(w);
      const isCese = !w.isHabilitado;
      
      const startStr = w.fechaIngreso || "01/01/2026";
      const endStr = isCese 
        ? (w.fechaTermino || defaultCutOffStr || formatDmyDate(new Date())) 
        : (defaultCutOffStr || formatDmyDate(new Date()));

      const start = parseDmyDate(startStr) || new Date(2026, 0, 1);
      const end = parseDmyDate(endStr) || new Date();

      // Calculation of months and days using our robust function
      const diff = calculateMonthsAndDays(start, end);
      const months = diff.months;
      const days = diff.days;
      const totalDays = diff.totalDays;

      // Computable Remuneration (RC)
      const extraSum = otherFixed.reduce((sum, c) => sum + c.amount, 0);
      const computableRc = basic + extraSum;

      // Accrued Vacation Pay: (RC / 12 * meses) + (RC / 360 * dias)
      const portionMonths = (computableRc / 12) * months;
      const portionDays = (computableRc / 360) * days;
      const accruedGross = portionMonths + portionDays;

      // Accrued vacation days: (months * 2.5) + (days * (30/360))
      const accruedDays = (months * 2.5) + (days / 12);

      // Taken vacations
      const customPeriods = workersTakenVacations[w.id] || [];
      const periodDays = customPeriods.reduce((acc, p) => acc + p.days, 0);
      const manualDays = manualDeductedDays[w.id] || 0;
      const totalTakenDays = Math.max(periodDays, manualDays);

      // Deducted value: each taken day is valued at RC / 30
      const deductionValue = totalTakenDays * (computableRc / 30);
      const grossVac = Math.max(0, accruedGross - deductionValue);

      // Pension deduction
      const pensionRate = pen === "onp" ? 0.13 : (pen === "afp" ? 0.1185 : 0.0);
      const pensionDeduction = grossVac * pensionRate;
      const netVac = grossVac - pensionDeduction;

      return {
        worker: w,
        isCese,
        startDate: start,
        endDate: end,
        months,
        days,
        totalDays,
        accruedDays,
        totalTakenDays,
        deductionValue,
        basic,
        otherFixed,
        computableRc,
        extraSum,
        grossVac,
        pen,
        pensionDeduction,
        netVac
      };
    });
  }, [workers, globalCutOffDate, workersTakenVacations, manualDeductedDays]);

  // Filtered workers list
  const filteredCalculations = useMemo(() => {
    return preCalculatedList.filter(item => {
      // search filter
      const fullName = `${item.worker.apellidos} ${item.worker.nombres}`.toLowerCase();
      const matchSearch = fullName.includes(searchTerm.toLowerCase()) || item.worker.dni.includes(searchTerm);
      
      // regimen filter
      let matchRegimen = true;
      const regUpper = item.worker.regimenLaboral.toUpperCase();
      if (filterRegimen === "cas") {
        matchRegimen = regUpper.includes("1057") || regUpper.includes("CAS");
      } else if (filterRegimen === "dl276") {
        matchRegimen = regUpper.includes("276");
      } else if (filterRegimen === "dl728") {
        matchRegimen = regUpper.includes("728");
      }

      // status filter
      let matchStatus = true;
      if (filterStatus === "cesados") {
        matchStatus = item.isCese;
      } else if (filterStatus === "activos") {
        matchStatus = !item.isCese;
      }

      return matchSearch && matchRegimen && matchStatus;
    });
  }, [preCalculatedList, searchTerm, filterRegimen, filterStatus]);

  // Automatically select the first precalculated worker details on mount
  useEffect(() => {
    if (preCalculatedList.length > 0 && !selectedWorkerId) {
      handleLoadWorkerDetails(preCalculatedList[0].worker.id);
    }
  }, [preCalculatedList]);

  // Load a specific worker's values into the detailed form
  const handleLoadWorkerDetails = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const item = preCalculatedList.find(i => i.worker.id === workerId);
    if (item) {
      setWorkerName(item.worker.nombres);
      setWorkerApellidos(item.worker.apellidos);
      setWorkerDni(item.worker.dni);
      setWorkerCargo(item.worker.cargo);
      setWorkerEstablecimiento(item.worker.establecimiento);
      
      // Format regimen nicely
      if (item.worker.regimenLaboral.toUpperCase().includes("1057") || item.worker.regimenLaboral.toUpperCase().includes("CAS")) {
        setRegimenLaboral("CAS (Decreto Leg. 1057)");
      } else if (item.worker.regimenLaboral.toUpperCase().includes("276")) {
        setRegimenLaboral("D.L. 276 (Carrera Administrativa)");
      } else {
        setRegimenLaboral("D.L. 728 (Régimen Privado)");
      }

      setStartDateStr(dmyToYmd(item.worker.fechaIngreso || "01/01/2026"));
      setEndDateStr(item.worker.isHabilitado 
        ? globalCutOffDate 
        : dmyToYmd(item.worker.fechaTermino || formatDmyDate(new Date())));
      setBasicRemuneration(item.basic);
      setCustomConcepts(item.otherFixed);
      setPensionSystem(item.pen);
    }
  };

  // Perform detailed live calculation for the selected worker
  const activeCalculations = useMemo(() => {
    if (!startDateStr || !endDateStr) return null;
    const start = new Date(startDateStr + "T12:00:00");
    const end = new Date(endDateStr + "T12:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return null;
    }

    const diff = calculateMonthsAndDays(start, end);
    const totalMonths = diff.months;
    const daysDiff = diff.days;
    const totalDays = diff.totalDays;

    const extraConceptsSum = customConcepts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const computableRemuneration = Number(basicRemuneration) + extraConceptsSum;

    // Accrued Vacation Pay: (RC / 12 * meses) + (RC / 360 * días)
    const portionMonths = (computableRemuneration / 12) * totalMonths;
    const portionDays = (computableRemuneration / 360) * daysDiff;
    const accruedGross = portionMonths + portionDays;

    const accruedDays = (totalMonths * 2.5) + (daysDiff / 12);

    // Taken vacations for this specific worker
    const customPeriods = workersTakenVacations[selectedWorkerId] || [];
    const periodDays = customPeriods.reduce((acc, p) => acc + p.days, 0);
    const manualDays = manualDeductedDays[selectedWorkerId] || 0;
    const totalTakenDays = Math.max(periodDays, manualDays);

    const deductionValue = totalTakenDays * (computableRemuneration / 30);
    const totalGross = Math.max(0, accruedGross - deductionValue);

    let pensionName = "";
    let pensionRate = 0;
    if (pensionSystem === "onp") {
      pensionName = "Aporte Obligatorio ONP (13.00%)";
      pensionRate = 0.13;
    } else if (pensionSystem === "afp") {
      pensionName = "Aporte Obligatorio AFP (11.85%)";
      pensionRate = 0.1185;
    } else {
      pensionName = "Sin Deducción de Pensión (0.00%)";
      pensionRate = 0.0;
    }

    const pensionDeduction = totalGross * pensionRate;
    const totalNet = totalGross - pensionDeduction;

    return {
      months: totalMonths,
      days: daysDiff,
      totalDays: totalDays,
      accruedDays,
      totalTakenDays,
      deductionValue,
      accruedGross,
      computableRemuneration,
      extraConceptsSum,
      portionMonths,
      portionDays,
      totalGross,
      pensionName,
      pensionDeduction,
      totalNet
    };
  }, [startDateStr, endDateStr, basicRemuneration, customConcepts, pensionSystem, selectedWorkerId, workersTakenVacations, manualDeductedDays]);

  const handleAddConcept = () => {
    if (!newConceptName.trim()) return;
    setCustomConcepts([...customConcepts, { name: newConceptName.trim(), amount: Number(newConceptAmount) }]);
    setNewConceptName("");
    setNewConceptAmount(0);
  };

  const handleRemoveConcept = (index: number) => {
    setCustomConcepts(customConcepts.filter((_, idx) => idx !== index));
  };

  const handleUpdateConceptAmount = (index: number, amount: number) => {
    const updated = [...customConcepts];
    updated[index].amount = amount;
    setCustomConcepts(updated);
  };

  const handleAddVacationPeriod = () => {
    if (!vacationStart || !vacationEnd) return;
    const start = new Date(vacationStart + "T12:00:00");
    const end = new Date(vacationEnd + "T12:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      alert("La fecha de término no puede ser anterior a la de inicio.");
      return;
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const newPeriod: VacationPeriod = { start: vacationStart, end: vacationEnd, days };

    const currentPeriods = workersTakenVacations[selectedWorkerId] || [];
    setWorkersTakenVacations({
      ...workersTakenVacations,
      [selectedWorkerId]: [...currentPeriods, newPeriod]
    });
    setVacationStart("");
    setVacationEnd("");
  };

  const handleRemoveVacationPeriod = (index: number) => {
    const currentPeriods = workersTakenVacations[selectedWorkerId] || [];
    const updated = currentPeriods.filter((_, idx) => idx !== index);
    setWorkersTakenVacations({
      ...workersTakenVacations,
      [selectedWorkerId]: updated
    });
  };

  const handleUpdateManualDays = (days: number) => {
    setManualDeductedDays({
      ...manualDeductedDays,
      [selectedWorkerId]: Math.max(0, days)
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("No se pudo abrir la ventana de impresión. Verifique el bloqueador de ventanas emergentes.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Liquidación de Vacaciones Truncas</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              color: #111827;
              background: #ffffff;
            }
            .modern-boleta {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-print {
              display: flex;
              justify-content: space-between;
              padding-bottom: 12px;
              margin-bottom: 20px;
              border-bottom: 2px solid #4f46e5;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .print-table th {
              background: #f3f4f6;
              padding: 8px;
              text-align: left;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #4b5563;
              border-bottom: 1px solid #e5e7eb;
            }
            .print-table td {
              padding: 8px;
              font-size: 11px;
              border-bottom: 1px solid #f3f4f6;
            }
            .print-signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-around;
            }
            .sig-box {
              border-top: 1px dashed #9ca3af;
              width: 220px;
              text-align: center;
              padding-top: 8px;
              font-size: 10px;
              color: #4b5563;
            }
            .stamp-box {
              border: 1px solid #9ca3af;
              width: 90px;
              height: 110px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .text-right {
              text-align: right;
            }
            .font-mono {
              font-family: 'JetBrains Mono', monospace;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="vacaciones-truncas-tab">
      {/* Top Status Header Cards */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-emerald-600" /> Planilla General de Vacaciones Truncas
          </h2>
          <p className="text-xs text-gray-500">
            Cálculos realizados en tiempo real para todo el personal. Seleccione un trabajador para ver los detalles de la fórmula y generar su boleta oficial.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="bg-gray-100 p-1 rounded-xl flex self-start md:self-auto shrink-0 border border-gray-150">
          <button
            onClick={() => setActiveSubView("list")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "list" 
                ? "bg-white text-indigo-700 shadow-xs" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            📋 Listado de Cálculos ({filteredCalculations.length})
          </button>
          <button
            onClick={() => setActiveSubView("detail")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "detail" 
                ? "bg-white text-indigo-700 shadow-xs" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🎫 Ajustes y Boleta Individual
          </button>
        </div>
      </div>

      {/* Main View Switcher */}
      {activeSubView === "list" ? (
        <div className="space-y-4">
          {/* Filters & search panel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por DNI o apellidos..."
                className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white pl-9 pr-3 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Regimen Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-150 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={filterRegimen}
                  onChange={(e) => setFilterRegimen(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="todos">Todos los Regímenes</option>
                  <option value="cas">CAS (DL 1057)</option>
                  <option value="dl276">D.L. 276</option>
                  <option value="dl728">D.L. 728</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-150 text-xs">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="cesados">Solo personal cesado</option>
                  <option value="activos">Solo personal activo (proyectado)</option>
                </select>
              </div>

              {/* Global Cut-Off Date Selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-150 text-xs">
                <span className="font-semibold text-gray-400">Fecha de Corte:</span>
                <input
                  type="date"
                  value={globalCutOffDate}
                  onChange={(e) => setGlobalCutOffDate(e.target.value)}
                  className="bg-transparent font-bold text-gray-700 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Liquidaciones</span>
                <span className="text-xl font-black text-indigo-950 font-mono">S/. {filteredCalculations.reduce((acc, item) => acc + item.grossVac, 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Descuento Estimado ONP/AFP</span>
                <span className="text-xl font-black text-rose-950 font-mono">S/. {filteredCalculations.reduce((acc, item) => acc + item.pensionDeduction, 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <UserMinus className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Neto a Desembolsar</span>
                <span className="text-xl font-black text-emerald-950 font-mono">S/. {filteredCalculations.reduce((acc, item) => acc + item.netVac, 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">DNI</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trabajador</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Régimen</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha Ingr - Cese</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiempo Trunco</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">R. Computable (RC)</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Vac. Trunca Gross</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Neto a Recibir</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Boleta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredCalculations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-gray-400 italic">
                        No se encontraron resultados que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredCalculations.map((item) => (
                      <tr 
                        key={item.worker.id}
                        className={`hover:bg-gray-50 transition-colors ${selectedWorkerId === item.worker.id ? "bg-indigo-50/30" : ""}`}
                      >
                        <td className="p-4 font-mono text-gray-500 font-semibold">{item.worker.dni}</td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900 leading-tight">{item.worker.apellidos}, {item.worker.nombres}</p>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{item.worker.cargo}</p>
                        </td>
                        <td className="p-4 font-semibold text-gray-600">
                          {item.worker.regimenLaboral.includes("1057") || item.worker.regimenLaboral.toUpperCase().includes("CAS") ? "CAS" : "DL 276"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono font-medium text-gray-600">{item.worker.fechaIngreso || "01/01/2026"}</span>
                          <span className="text-gray-300 mx-1">→</span>
                          {item.isCese ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px]">
                                {item.worker.fechaTermino}
                              </span>
                              {item.worker.motivoCese && (
                                <span className="text-[9px] text-rose-600 font-semibold leading-none italic" title={item.worker.motivoCese}>
                                  {item.worker.motivoCese}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px]" title="Sigue contratado actualmente. Cálculo hecho a la fecha seleccionada.">
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <p className="font-bold text-indigo-900 leading-tight">
                            {item.months}m {item.days}d
                          </p>
                          {item.totalTakenDays > 0 ? (
                            <p className="text-[10px] text-rose-600 font-bold leading-none mt-0.5" title="Días de vacaciones tomadas que restan al cálculo">
                              {item.totalTakenDays} d. gozados
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Sobre {item.totalDays} días</p>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-gray-600">
                          S/. {item.computableRc.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-indigo-950">
                          S/. {item.grossVac.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                            S/. {item.netVac.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              handleLoadWorkerDetails(item.worker.id);
                              setActiveSubView("detail");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 mx-auto cursor-pointer"
                            title="Ver Boleta de Liquidación"
                          >
                            Boleta <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed interactive calculation view with live overrides */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left parameters adjusting column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" /> Parámetros e Ingresos
                </h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Id: {selectedWorkerId || "Custom"}
                </span>
              </div>

              {/* Personal details info displays */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">DNI</label>
                    <p className="font-bold text-gray-800 font-mono">{workerDni}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Trabajador</label>
                    <p className="font-bold text-indigo-950 truncate">{workerApellidos}, {workerName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-2">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Cargo</label>
                    <p className="font-medium text-gray-700 truncate">{workerCargo}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Establecimiento</label>
                    <p className="font-medium text-gray-700 truncate">{workerEstablecimiento}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-2">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Estado</label>
                    <div className="mt-0.5">
                      {(() => {
                        const originalWorker = workers.find(w => w.id === selectedWorkerId);
                        const isCese = originalWorker ? !originalWorker.isHabilitado : false;
                        return isCese ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center">
                            Cesado (Inactivo)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center">
                            Activo (Habilitado)
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {(() => {
                    const originalWorker = workers.find(w => w.id === selectedWorkerId);
                    if (originalWorker && !originalWorker.isHabilitado && originalWorker.motivoCese) {
                      return (
                        <div>
                          <label className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wide">Motivo de Cese</label>
                          <p className="font-bold text-rose-700 truncate" title={originalWorker.motivoCese}>
                            {originalWorker.motivoCese}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Form overriders */}
              <div className="space-y-4">
                {/* Regimen */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Régimen Laboral
                  </label>
                  <select
                    value={regimenLaboral}
                    onChange={(e) => setRegimenLaboral(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="CAS (Decreto Leg. 1057)">CAS (Decreto Leg. 1057)</option>
                    <option value="D.L. 276 (Carrera Administrativa)">D.L. 276 (Carrera Administrativa)</option>
                    <option value="D.L. 728 (Régimen Privado)">D.L. 728 (Régimen Privado)</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> F. Inicio
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> F. Cese
                    </label>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700"
                    />
                  </div>
                </div>

                {/* Remuneración Básica */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Básica Mensual
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={basicRemuneration || ""}
                      onChange={(e) => setBasicRemuneration(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white pl-8 pr-3 py-2 rounded-xl text-xs font-bold font-mono text-gray-700"
                    />
                  </div>
                </div>

                {/* Pension Select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Régimen de Pensión
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPensionSystem("onp")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        pensionSystem === "onp" 
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      ONP (13%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPensionSystem("afp")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        pensionSystem === "afp" 
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      AFP (~11.85%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPensionSystem("ninguno")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        pensionSystem === "ninguno" 
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Ninguno (0%)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Concepts regular fixed additions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Plus className="w-4 h-4 text-indigo-600" /> Otros Conceptos Fijos/Regulares
              </h3>

              <div className="space-y-3">
                {customConcepts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">No hay otros conceptos fijos agregados.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {customConcepts.map((concept, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-700 flex-1">{concept.name}</span>
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">S/.</span>
                          <input
                            type="number"
                            step="0.01"
                            value={concept.amount || ""}
                            onChange={(e) => handleUpdateConceptAmount(idx, Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 focus:border-indigo-500 pl-7 pr-2 py-1 rounded-lg text-xs font-mono text-right"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveConcept(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Eliminar concepto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Row form */}
                <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nuevo concepto..."
                    value={newConceptName}
                    onChange={(e) => setNewConceptName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs text-gray-700 flex-1 focus:outline-hidden"
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    value={newConceptAmount || ""}
                    onChange={(e) => setNewConceptAmount(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs text-gray-700 font-mono w-20 text-right focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddConcept}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vacaciones Gozadas / Tomadas (Para Deducir del Cálculo) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Palmtree className="w-4 h-4 text-emerald-600" /> Vacaciones Gozadas (Deducir)
              </h3>

              <div className="space-y-4">
                {/* Manual Override Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Días de Vacaciones Tomadas (Manual)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ingrese días ya gozados a descontar..."
                    value={manualDeductedDays[selectedWorkerId] || 0}
                    onChange={(e) => handleUpdateManualDays(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-2 rounded-xl text-xs font-bold font-mono text-gray-700 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400">
                    O ingrese periodos específicos a continuación para sumar los días de forma automática:
                  </p>
                </div>

                {/* Period List */}
                {(!workersTakenVacations[selectedWorkerId] || workersTakenVacations[selectedWorkerId].length === 0) ? (
                  <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
                    No se han registrado periodos de vacaciones.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(workersTakenVacations[selectedWorkerId] || []).map((period, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-700">Periodo #{idx + 1}</p>
                          <p className="font-mono text-[10px] text-gray-500">
                            {ymdToDmy(period.start)} - {ymdToDmy(period.end)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[10px]">
                            {period.days} días
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVacationPeriod(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Eliminar periodo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Period Fields */}
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                    Agregar Periodo de Vacaciones:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Inicio</span>
                      <input
                        type="date"
                        value={vacationStart}
                        onChange={(e) => setVacationStart(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-700 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Término</span>
                      <input
                        type="date"
                        value={vacationEnd}
                        onChange={(e) => setVacationEnd(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-700 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVacationPeriod}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Periodo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Detailed Output column */}
          <div className="lg:col-span-7 space-y-6">
            {!activeCalculations ? (
              <div className="bg-rose-50 border border-dashed border-rose-200 p-12 rounded-3xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="font-bold text-rose-900 text-sm">Fechas Inválidas</h4>
                <p className="text-xs text-rose-700/80 max-w-xs mx-auto">
                  La fecha de término o cese no puede ser anterior a la fecha de ingreso. Verifique los parámetros para calcular.
                </p>
              </div>
            ) : (
              <>
                {/* Math breakdown Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-5">
                  <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
                    <Calculator className="w-4 h-4 text-indigo-600" /> Desglose Matemático del Cálculo
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meses Computables</span>
                      <p className="text-lg font-black text-indigo-900 font-mono mt-0.5">
                        {activeCalculations.months} <span className="text-xs font-normal">meses</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Días Computables</span>
                      <p className="text-lg font-black text-indigo-900 font-mono mt-0.5">
                        {activeCalculations.days} <span className="text-xs font-normal">días</span>
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Periodo de Cálculo</span>
                      <p className="text-[10px] font-bold text-emerald-800 mt-1 leading-tight">
                        Desde: {startDateStr ? ymdToDmy(startDateStr) : "--"}<br />
                        Hasta: {endDateStr ? ymdToDmy(endDateStr) : "--"}
                      </p>
                    </div>
                  </div>

                  {/* Math details */}
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-800">Definir Remuneración Computable (RC)</p>
                        <p className="text-gray-500 font-mono">
                          Básica (S/. {basicRemuneration.toFixed(2)}) + Conceptos fijos (S/. {activeCalculations.extraConceptsSum.toFixed(2)}) = <strong>S/. {activeCalculations.computableRemuneration.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-800">Fórmula por Meses Completos</p>
                        <p className="text-gray-500 font-mono">
                          (RC / 12 * meses) = ({activeCalculations.computableRemuneration.toFixed(2)} / 12) * {activeCalculations.months} = <strong>S/. {activeCalculations.portionMonths.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-800">Fórmula por Días Excedentes</p>
                        <p className="text-gray-500 font-mono">
                          (RC / 360 * días) = ({activeCalculations.computableRemuneration.toFixed(2)} / 360) * {activeCalculations.days} = <strong>S/. {activeCalculations.portionDays.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                      <div className="w-5 h-5 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</div>
                      <div className="space-y-0.5 flex-1">
                        <p className="font-bold text-gray-800">Deducción de Vacaciones Gozadas (Tomadas)</p>
                        <div className="flex items-center justify-between text-gray-500 font-mono mt-0.5">
                          <span>Días tomados: {activeCalculations.totalTakenDays} d. (Valorizados a S/. { (activeCalculations.computableRemuneration / 30).toFixed(4) } por día)</span>
                          <span className="font-bold text-rose-700">- S/. {activeCalculations.deductionValue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 text-indigo-950 p-4 rounded-xl border border-indigo-100 flex justify-between items-center font-mono">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[10px] uppercase text-indigo-600 tracking-wider">Total Bruto Proporcional Neto</p>
                        <p className="text-[11px] font-semibold text-indigo-900/80">(Bruto Acumulado - Gozadas)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-950 block">
                          S/. {activeCalculations.totalGross.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-500">
                          {activeCalculations.accruedDays.toFixed(2)} d. acumulados - {activeCalculations.totalTakenDays} d. gozados
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print button & Boleta container */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveSubView("list")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    ← Volver a la Lista
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Boleta de Vacaciones
                  </button>
                </div>

                {/* Print Ref containing the Pay Slip */}
                <div 
                  ref={printRef}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg relative overflow-hidden"
                  id="printable-boleta-vacaciones"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-800"></div>
                  
                  <div className="modern-boleta space-y-6 pt-3">
                    {/* Employer header */}
                    <div className="header-print flex items-start justify-between border-b border-gray-100 pb-4">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">SISTEMA INTEGRADO DE PLANILLAS CAS</h3>
                        <p className="text-[9px] text-gray-400 font-mono">RUC: 10{workerDni || "00000000"}-282001</p>
                        <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                          BOLETA DE LIQUIDACIÓN DE BENEFICIOS SOCIALES
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-700">VACACIONES TRUNCAS</p>
                        <p className="text-[9px] text-gray-400 font-mono">Reg. Lab: {regimenLaboral}</p>
                      </div>
                    </div>

                    {/* Employee Grid */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <p className="text-gray-500">Apellidos y Nombres:</p>
                        <p className="font-bold text-gray-800">
                          {workerApellidos || "TRABAJADOR"}, {workerName || "NUEVO"}
                        </p>
                        
                        <p className="text-gray-500">Documento de Identidad:</p>
                        <p className="font-bold font-mono text-gray-800">{workerDni || "DNI OMITIDO"}</p>

                        <p className="text-gray-500">Establecimiento:</p>
                        <p className="font-semibold text-gray-700">{workerEstablecimiento || "SEDE ADMINISTRATIVA"}</p>
                      </div>

                      <div className="space-y-1.5 border-l border-gray-150 pl-4">
                        <p className="text-gray-500">Cargo del Trabajador:</p>
                        <p className="font-bold text-indigo-950">{workerCargo || "SERVIDORES PUBLICOS GENERAL"}</p>

                        <p className="text-gray-500">Periodo Computable:</p>
                        <p className="font-bold text-gray-800">
                          {startDateStr ? ymdToDmy(startDateStr) : "DD/MM/AAAA"} al {endDateStr ? ymdToDmy(endDateStr) : "DD/MM/AAAA"}
                        </p>

                        <p className="text-gray-500">Tiempo Computado Trunco:</p>
                        <p className="font-bold text-indigo-700 font-mono">
                          {activeCalculations.months} meses y {activeCalculations.days} días ({activeCalculations.totalDays} días totales)
                        </p>
                      </div>
                    </div>

                    {/* Breakdown pay table */}
                    <table className="print-table w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left font-bold text-gray-400 text-[10px] uppercase">Concepto Remunerativo Computable</th>
                          <th className="py-2 text-right font-bold text-gray-400 text-[10px] uppercase w-28">Monto de Referencia</th>
                          <th className="py-2 text-right font-bold text-gray-400 text-[10px] uppercase w-28">Ingresos (Bruto)</th>
                          <th className="py-2 text-right font-bold text-gray-400 text-[10px] uppercase w-28">Egresos (Deducción)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-mono">
                        <tr>
                          <td className="py-2.5 text-gray-700">Remuneración Básica Mensual</td>
                          <td className="py-2.5 text-right text-gray-500">S/. {basicRemuneration.toFixed(2)}</td>
                          <td className="py-2.5 text-right"></td>
                          <td className="py-2.5 text-right"></td>
                        </tr>

                        {customConcepts.filter(c => Number(c.amount) > 0).map((concept, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 text-gray-700">{concept.name}</td>
                            <td className="py-2.5 text-right text-gray-500">S/. {Number(concept.amount).toFixed(2)}</td>
                            <td className="py-2.5 text-right"></td>
                            <td className="py-2.5 text-right"></td>
                          </tr>
                        ))}

                        <tr className="bg-gray-50/50 font-bold">
                          <td className="py-2 text-indigo-900 pl-2">SUMA REMUNERACIÓN COMPUTABLE (RC)</td>
                          <td className="py-2 text-right text-indigo-900 pr-2">S/. {activeCalculations.computableRemuneration.toFixed(2)}</td>
                          <td></td>
                          <td></td>
                        </tr>

                        <tr>
                          <td className="py-2.5 font-bold text-gray-800">
                            Vacaciones Devengadas/Acumuladas ({activeCalculations.months}m, {activeCalculations.days}d)
                          </td>
                          <td className="py-2.5 text-right text-gray-400">—</td>
                          <td className="py-2.5 text-right font-bold text-gray-900">S/. {activeCalculations.accruedGross.toFixed(2)}</td>
                          <td className="py-2.5 text-right"></td>
                        </tr>

                        {activeCalculations.totalTakenDays > 0 && (
                          <tr>
                            <td className="py-2.5 text-rose-700 font-bold">
                              Dcto. Vacaciones Gozadas ({activeCalculations.totalTakenDays} días gozados)
                            </td>
                            <td className="py-2.5 text-right text-gray-400">S/. {(activeCalculations.computableRemuneration / 30).toFixed(2)} / día</td>
                            <td className="py-2.5 text-right"></td>
                            <td className="py-2.5 text-right text-rose-700 font-bold">S/. {activeCalculations.deductionValue.toFixed(2)}</td>
                          </tr>
                        )}

                        <tr className="bg-gray-50/50 font-bold">
                          <td className="py-2 text-indigo-950 pl-2">TOTAL BRUTO VACACIONES TRUNCAS</td>
                          <td className="py-2 text-right text-gray-400">—</td>
                          <td className="py-2 text-right text-indigo-950">S/. {activeCalculations.totalGross.toFixed(2)}</td>
                          <td className="py-2.5 text-right"></td>
                        </tr>

                        {activeCalculations.pensionDeduction > 0 && (
                          <tr>
                            <td className="py-2.5 text-red-600 font-semibold">{activeCalculations.pensionName}</td>
                            <td className="py-2.5 text-right text-gray-400">—</td>
                            <td className="py-2.5 text-right"></td>
                            <td className="py-2.5 text-right text-red-600 font-bold">S/. {activeCalculations.pensionDeduction.toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Totals panel */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Fórmula Aplicada</p>
                        <p className="text-xs text-indigo-900 leading-relaxed max-w-sm">
                          (S/. {activeCalculations.computableRemuneration.toFixed(2)} / 12 * {activeCalculations.months} meses) + (S/. {activeCalculations.computableRemuneration.toFixed(2)} / 360 * {activeCalculations.days} días)
                        </p>
                      </div>

                      <div className="flex gap-4 font-mono text-xs border-t sm:border-t-0 sm:border-l border-indigo-200/50 pt-2 sm:pt-0 sm:pl-4 w-full sm:w-auto shrink-0 justify-around sm:justify-start">
                        <div className="space-y-1 text-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Bruto</span>
                          <span className="font-bold text-gray-700 text-sm">S/. {activeCalculations.totalGross.toFixed(2)}</span>
                        </div>
                        
                        {activeCalculations.pensionDeduction > 0 && (
                          <div className="space-y-1 text-center">
                            <span className="text-[9px] font-bold text-red-400 uppercase block">Total Descto.</span>
                            <span className="font-bold text-red-600 text-sm">S/. {activeCalculations.pensionDeduction.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="space-y-1 text-center">
                          <span className="text-[9px] font-bold text-indigo-600 uppercase block">Neto a Pagar</span>
                          <span className="font-black text-indigo-900 text-base">S/. {activeCalculations.totalNet.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="print-signatures flex flex-col sm:flex-row items-center justify-around gap-12 pt-12">
                      <div className="sig-box border-t border-dashed border-gray-400 text-center pt-2 text-[10px] text-gray-500 w-48">
                        Firma de Concesión<br />
                        Responsable de Planillas
                      </div>

                      <div className="stamp-box border border-dashed border-gray-300 text-gray-300 text-[10px] w-24 h-24 flex items-center justify-center rounded">
                        Sello de la<br />Institución
                      </div>

                      <div className="sig-box border-t border-dashed border-gray-400 text-center pt-2 text-[10px] text-gray-500 w-48">
                        Firma del Beneficiario<br />
                        DNI: {workerDni || "........"}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
