import { useState, useMemo } from "react";
import { Worker, PayrollPeriod, PayrollRecordItem, Concept } from "../types";
import { 
  Calendar,
  Lock,
  Unlock,
  Plus,
  Trash,
  Sliders,
  Check,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertTriangle,
  UserCheck,
  FileCheck,
  FileEdit,
  Building,
  Briefcase,
  HelpCircle,
  Search,
  Download
} from "lucide-react";

interface PayrollManagerProps {
  workers: Worker[];
  periods: PayrollPeriod[];
  currentPeriodId: string;
  onSetCurrentPeriodId: (id: string) => void;
  onUpdatePeriodRecords: (periodId: string, records: PayrollRecordItem[]) => void;
  onLockPeriod: (periodId: string, isLocked: boolean) => void;
  onCreateNewPeriod: (year: number, month: number) => void;
  onAddMasterConcept?: (workerId: string, concept: Concept) => void;
  onRemoveMasterConcept?: (workerId: string, conceptId: string, type: "ingreso" | "egreso") => void;
}

const MONTH_LABELS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const STANDARD_CONCEPT_TYPES = [
  { id: "RM", name: "Remuneración Mensual (RM)", type: "ingreso" },
  { id: "DS311", name: "D.S. 311", type: "ingreso" },
  { id: "DS313", name: "D.S. 313", type: "ingreso" },
  { id: "DS265", name: "D.S. 265", type: "ingreso" },
  { id: "DS279", name: "D.S. 279", type: "ingreso" },
  { id: "DS317", name: "D.S. 317", type: "ingreso" },
  { id: "DS327", name: "D.S. 327", type: "ingreso" },
  { id: "Reintegro", name: "Reintegro", type: "ingreso" },
  { id: "Bono_Especial", name: "Bono Especial", type: "ingreso" },
  { id: "Otros_Ingresos", name: "Otros Ingresos (Escribir nombre personalizado...)", type: "ingreso" },
  
  { id: "SPP", name: "AFP SPP Pensión", type: "egreso" },
  { id: "SNP", name: "SNP Ley 19990 Pensión", type: "egreso" },
  { id: "COOP_SCB", name: "Coop S.C.B.", type: "egreso" },
  { id: "TARDANZA", name: "Tardanzas / Desc. Horas", type: "egreso" },
  { id: "SUBCAFAE", name: "Sub Cafae", type: "egreso" },
  { id: "COPAC_SAN", name: "Copac San Martín", type: "egreso" },
  { id: "FALTAS", name: "Faltas / Inasistencias", type: "egreso" },
  { id: "Otros_Descuentos", name: "Otros Descuentos (Escribir nombre personalizado...)", type: "egreso" }
];

export default function PayrollManager({
  workers,
  periods,
  currentPeriodId,
  onSetCurrentPeriodId,
  onUpdatePeriodRecords,
  onLockPeriod,
  onCreateNewPeriod,
  onAddMasterConcept,
  onRemoveMasterConcept
}: PayrollManagerProps) {
  // Selector states
  const [selectYear, setFormYear] = useState(2026);
  const [selectMonth, setFormMonth] = useState(6); // default to June (6)
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);

  // Auto-suggest next sequential period
  const latestPeriod = useMemo(() => {
    if (!periods || periods.length === 0) return { year: 2026, month: 6 };
    return periods.reduce((latest, current) => {
      if (current.year > latest.year) return current;
      if (current.year === latest.year && current.month > latest.month) return current;
      return latest;
    }, periods[0]);
  }, [periods]);

  const nextSuggestedMonthYear = useMemo(() => {
    let m = latestPeriod.month + 1;
    let y = latestPeriod.year;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    return { month: m, year: y };
  }, [latestPeriod]);

  const handleOpenCreatePeriodModal = () => {
    setFormMonth(nextSuggestedMonthYear.month);
    setFormYear(nextSuggestedMonthYear.year);
    setIsCreatePeriodModalOpen(true);
  };
  
  // Search state inside spreadsheet
  const [gridSearch, setGridSearch] = useState("");

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<PayrollRecordItem | null>(null);
  const [adjIncomes, setAdjIncomes] = useState<Concept[]>([]);
  const [adjDeductions, setAdjDeductions] = useState<Concept[]>([]);
  const [adjLeyendaMensual, setAdjLeyendaMensual] = useState("");

  // New Custom Concept form states (inside adjustment modal)
  const [newConceptId, setNewConceptId] = useState("");
  const [customConceptName, setCustomConceptName] = useState("");
  const [newConceptAmount, setNewConceptAmount] = useState(0);
  const [newConceptIsConstant, setNewConceptIsConstant] = useState(false); // default to false (temporal)

  // Active worker's master template helper
  const masterWorker = useMemo(() => {
    if (!activeRecord) return null;
    return workers.find(w => w.id === activeRecord.workerId) || null;
  }, [workers, activeRecord]);

  // Helper to determine if a concept is constant in the master template
  const isMasterConcept = (conceptId: string, type: "ingreso" | "egreso") => {
    if (!masterWorker) return false;
    if (type === "ingreso") {
      return masterWorker.defaultIncomes.some(i => i.id === conceptId);
    } else {
      return masterWorker.defaultDeductions.some(d => d.id === conceptId);
    }
  };

  // Active period object
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === currentPeriodId) || periods[0];
  }, [periods, currentPeriodId]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!activePeriod) return { totalRemun: 0, totalDscto: 0, totalLiqui: 0 };
    const r = activePeriod.records;
    return {
      totalRemun: r.reduce((sum, item) => sum + item.tRemun, 0),
      totalDscto: r.reduce((sum, item) => sum + item.tDscto, 0),
      totalLiqui: r.reduce((sum, item) => sum + item.tLiqui, 0)
    };
  }, [activePeriod]);

  // Filtered record items for the spreadsheet grid
  const filteredRecords = useMemo(() => {
    if (!activePeriod) return [];
    if (!gridSearch) return activePeriod.records;
    const query = gridSearch.toLowerCase();
    return activePeriod.records.filter(r => 
      r.workerFullName.toLowerCase().includes(query) || 
      r.workerDni.includes(query) || 
      r.workerCargo.toLowerCase().includes(query)
    );
  }, [activePeriod, gridSearch]);

  // Handle opening adjust modal
  const handleOpenAdjust = (rec: PayrollRecordItem) => {
    if (activePeriod.isClosed) {
      alert("La planilla de este periodo está CERRADA. Desbloquee la planilla para poder realizar ajustes.");
      return;
    }
    setActiveRecord(rec);
    setAdjIncomes([...rec.incomes]);
    setAdjDeductions([...rec.deductions]);
    setAdjLeyendaMensual(rec.leyendaMensual || "");
    setNewConceptId("");
    setCustomConceptName("");
    setNewConceptAmount(0);
    setNewConceptIsConstant(false);
    setIsAdjustModalOpen(true);
  };

  // Add custom concept to worker active record
  const handleAddConcept = () => {
    if (!newConceptId || newConceptAmount <= 0) {
      alert("Seleccione un concepto válido y asigne un monto mayor a 0.");
      return;
    }

    const config = STANDARD_CONCEPT_TYPES.find(c => c.id === newConceptId);
    if (!config) return;

    let conceptId = config.id;
    let conceptName = config.name;

    if (newConceptId === "Otros_Ingresos" || newConceptId === "Otros_Descuentos") {
      const cleanName = customConceptName.trim();
      if (!cleanName) {
        alert("Por favor ingrese el nombre personalizado para el concepto.");
        return;
      }
      conceptId = newConceptId + "_" + cleanName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      conceptName = cleanName;
    }

    const newConcept: Concept = {
      id: conceptId,
      name: conceptName,
      type: config.type as "ingreso" | "egreso",
      amount: Number(newConceptAmount)
    };

    if (config.type === "ingreso") {
      // Check if duplicate
      if (adjIncomes.some(i => i.id === conceptId)) {
        setAdjIncomes(adjIncomes.map(i => i.id === conceptId ? { ...i, amount: i.amount + newConcept.amount } : i));
      } else {
        setAdjIncomes([...adjIncomes, newConcept]);
      }
    } else {
      // Check if duplicate
      if (adjDeductions.some(d => d.id === conceptId)) {
        setAdjDeductions(adjDeductions.map(d => d.id === conceptId ? { ...d, amount: d.amount + newConcept.amount } : d));
      } else {
        setAdjDeductions([...adjDeductions, newConcept]);
      }
    }

    // If marked as constant, immediately add/update in master template
    if (newConceptIsConstant && activeRecord) {
      onAddMasterConcept?.(activeRecord.workerId, newConcept);
    }

    // Reset fields
    setNewConceptId("");
    setNewConceptAmount(0);
    setNewConceptIsConstant(false);
    setCustomConceptName("");
  };

  // Delete concept from active edit list
  const handleDeleteConcept = (conceptId: string, type: "ingreso" | "egreso") => {
    if (type === "ingreso") {
      setAdjIncomes(adjIncomes.filter(i => i.id !== conceptId));
    } else {
      setAdjDeductions(adjDeductions.filter(d => d.id !== conceptId));
    }
  };

  // Edit inline amount of an edited concept
  const handleUpdateConceptAmount = (conceptId: string, type: "ingreso" | "egreso", amount: number) => {
    let updatedConcept: Concept | null = null;
    if (type === "ingreso") {
      setAdjIncomes(adjIncomes.map(i => {
        if (i.id === conceptId) {
          updatedConcept = { ...i, amount: Number(amount) };
          return updatedConcept;
        }
        return i;
      }));
    } else {
      setAdjDeductions(adjDeductions.map(d => {
        if (d.id === conceptId) {
          updatedConcept = { ...d, amount: Number(amount) };
          return updatedConcept;
        }
        return d;
      }));
    }

    // If it is a constant concept, also update its amount in the master template
    if (updatedConcept && isMasterConcept(conceptId, type) && activeRecord) {
      onAddMasterConcept?.(activeRecord.workerId, updatedConcept);
    }
  };

  // Save adjustments to current period records
  const handleSaveAdjustments = () => {
    if (!activeRecord || !activePeriod) return;

    // Recalculate Totals
    const tRemun = adjIncomes.reduce((sum, i) => sum + i.amount, 0);
    const tDscto = adjDeductions.reduce((sum, d) => sum + d.amount, 0);
    const tLiqui = tRemun - tDscto;
    const mImponible = tRemun;

    const updatedRecords = activePeriod.records.map(r => {
      if (r.workerId === activeRecord.workerId) {
        return {
          ...r,
          incomes: adjIncomes,
          deductions: adjDeductions,
          leyendaMensual: adjLeyendaMensual,
          tRemun: Math.round(tRemun * 100) / 100,
          tDscto: Math.round(tDscto * 100) / 100,
          tLiqui: Math.round(tLiqui * 100) / 100,
          mImponible: Math.round(mImponible * 100) / 100
        };
      }
      return r;
    });

    onUpdatePeriodRecords(activePeriod.id, updatedRecords);
    setIsAdjustModalOpen(false);
    setActiveRecord(null);
  };

  // Add Worker who was added in the Directory to the active monthly payroll
  const handleAddMissingWorkers = () => {
    if (!activePeriod) return;

    // Find workers in Directory who are NOT in the active month records
    const existingDnis = new Set(activePeriod.records.map(r => r.workerId));
    const missingWorkers = workers.filter(w => w.isHabilitado && !existingDnis.has(w.id));

    if (missingWorkers.length === 0) {
      alert("Todos los trabajadores habilitados del directorio ya están incluidos en esta planilla.");
      return;
    }

    const newRecords: PayrollRecordItem[] = missingWorkers.map(w => {
      const rmVal = w.defaultIncomes.find(i => i.id === "RM")?.amount || 0;
      const tRemun = w.defaultIncomes.reduce((sum, i) => sum + i.amount, 0);
      const tDscto = w.defaultDeductions.reduce((sum, d) => sum + d.amount, 0);
      return {
        workerId: w.id,
        workerDni: w.dni,
        workerFullName: `${w.apellidos}, ${w.nombres}`,
        workerCargo: w.cargo,
        workerEstablecimiento: w.establecimiento,
        workerRegimenPensionario: w.regimenPensionario,
        leyendaMensual: "",
        incomes: [...w.defaultIncomes],
        deductions: [...w.defaultDeductions],
        tRemun,
        tDscto,
        tLiqui: tRemun - tDscto,
        mImponible: tRemun
      };
    });

    const updatedRecords = [...activePeriod.records, ...newRecords];
    onUpdatePeriodRecords(activePeriod.id, updatedRecords);
    alert(`Se agregaron con éxito ${missingWorkers.length} trabajadores nuevos a la planilla del mes.`);
  };

  // Remove worker from the current month's payroll
  const handleRemoveWorkerFromMonth = (workerId: string, name: string) => {
    if (activePeriod.isClosed) return;
    if (confirm(`¿Desea excluir temporalmente a ${name} de la planilla de este mes? (Su ficha seguirá en el directorio master)`)) {
      const updatedRecords = activePeriod.records.filter(r => r.workerId !== workerId);
      onUpdatePeriodRecords(activePeriod.id, updatedRecords);
    }
  };

  // Handle open a completely new period
  const handleCreateNewPeriodClick = () => {
    const periodId = `${selectYear}-${selectMonth.toString().padStart(2, "0")}`;
    if (periods.some(p => p.id === periodId)) {
      alert(`La planilla para el periodo ${MONTH_LABELS[selectMonth-1]} ${selectYear} ya existe. Selecciónela en el menú lateral.`);
      return;
    }

    onCreateNewPeriod(selectYear, selectMonth);
    onSetCurrentPeriodId(periodId);
    alert(`Se ha inicializado con éxito la planilla para: ${MONTH_LABELS[selectMonth-1]} - ${selectYear}`);
  };

  // Format currency helper
  const formatPen = (val: number) => {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);
  };

  // Export payroll to CSV format
  const handleDownloadPayroll = () => {
    if (!activePeriod) return;

    // Get all unique incomes and deductions across all records in this period
    const uniqueIncomes = new Set<string>();
    const uniqueDeductions = new Set<string>();

    activePeriod.records.forEach(r => {
      r.incomes.forEach(i => uniqueIncomes.add(i.name));
      r.deductions.forEach(d => uniqueDeductions.add(d.name));
    });

    const incomeHeaders = Array.from(uniqueIncomes);
    const deductionHeaders = Array.from(uniqueDeductions);

    // Build the full header row
    const headers = [
      "DNI",
      "Trabajador",
      "Cargo",
      "Establecimiento",
      "Regimen Pensionario",
      ...incomeHeaders.map(h => `Ingreso: ${h}`),
      "Total Ingresos",
      ...deductionHeaders.map(h => `Descuento: ${h}`),
      "Total Descuentos",
      "Neto Liquido"
    ];

    // Build data rows
    const csvRows = activePeriod.records.map(r => {
      // Find matching values
      const incVals = incomeHeaders.map(h => {
        const found = r.incomes.find(i => i.name === h);
        return found ? found.amount.toFixed(2) : "0.00";
      });

      const decVals = deductionHeaders.map(h => {
        const found = r.deductions.find(d => d.name === h);
        return found ? found.amount.toFixed(2) : "0.00";
      });

      const fields = [
        r.workerDni,
        r.workerFullName,
        r.workerCargo,
        r.workerEstablecimiento,
        r.workerRegimenPensionario,
        ...incVals,
        r.tRemun.toFixed(2),
        ...decVals,
        r.tDscto.toFixed(2),
        r.tLiqui.toFixed(2)
      ];

      // Format each field by escaping double quotes and wrapping in double quotes
      return fields.map(f => {
        const str = String(f === undefined || f === null ? "" : f);
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(";");
    });

    // Join with newlines, include explicit sep=; for Excel, and add UTF-8 BOM
    const csvContent = "\uFEFFsep=;\n" + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(";"),
      ...csvRows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `planilla_${activePeriod.id}_${activePeriod.label.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="payroll-manager-section">
      {/* Monthly Payroll Header controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cálculo de Planilla Mensual</h2>
          <p className="text-sm text-gray-500">
            Cambie periodos, agregue adicionales de ingresos y egresos por trabajador
          </p>
        </div>

        {/* Action Controls for Period Creation or Locking */}
        <div className="flex flex-wrap items-center gap-3" id="period-actions">
          {/* Active Period Dropdown */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Periodo Activo:</span>
            <select
              value={currentPeriodId}
              onChange={(e) => onSetCurrentPeriodId(e.target.value)}
              className="bg-transparent border-0 text-sm font-bold text-gray-800 focus:ring-0 focus:outline-hidden cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* New Create Period Button */}
          <button
            onClick={handleOpenCreatePeriodModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
            title="Inicializar y crear planilla para un nuevo mes"
          >
            <Plus className="w-4 h-4" /> Crear Nueva Planilla
          </button>

          {/* Locked / Unlocked Status Toggle */}
          {activePeriod?.isClosed ? (
            <button
              onClick={() => onLockPeriod(activePeriod.id, false)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              title="Permitir realizar modificaciones"
            >
              <Lock className="w-4 h-4 text-amber-700" /> Cerrada (Desbloquear)
            </button>
          ) : (
            <button
              onClick={() => onLockPeriod(activePeriod.id, true)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Cerrar planilla de este mes para guardar como histórico"
            >
              <Unlock className="w-4 h-4" /> Abierta (Cerrar Planilla)
            </button>
          )}

          {/* Add directory workers who are missing */}
          {!activePeriod?.isClosed && (
            <button
              onClick={handleAddMissingWorkers}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sincronizar planilla con trabajadores del directorio master"
            >
              <UserCheck className="w-4 h-4" /> Sincronizar Directorio
            </button>
          )}
        </div>
      </div>

      {/* Mini dashboard stats of selected Month */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="monthly-stats-panel">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block uppercase">Personal Procesado</span>
            <span className="text-lg font-bold text-gray-800">{activePeriod?.records.length || 0} Trabajadores</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block uppercase">Total Remuneraciones</span>
            <span className="text-lg font-bold text-gray-800">{formatPen(stats.totalRemun)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block uppercase">Total Descuentos</span>
            <span className="text-lg font-bold text-gray-800">{formatPen(stats.totalDscto)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 text-green-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block uppercase">Monto Neto a Pagar</span>
            <span className="text-lg font-bold text-green-700">{formatPen(stats.totalLiqui)}</span>
          </div>
        </div>
      </div>

      {/* Initialize / Create new period tool */}
      <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4" id="init-period-card">
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Inicializar otro mes en el histórico
          </h4>
          <p className="text-xs text-blue-800">
            ¿Desea crear la planilla para otro mes? Se creará una copia con el personal habilitado actual para que realice sus ajustes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <select
            value={selectMonth}
            onChange={(e) => setFormMonth(Number(e.target.value))}
            className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
          >
            {MONTH_LABELS.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectYear}
            onChange={(e) => setFormYear(Number(e.target.value))}
            className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <button
            onClick={handleCreateNewPeriodClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Inicializar Periodo
          </button>
        </div>
      </div>

      {/* Spreadsheet grid container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden" id="planilla-spreadsheet-container">
        {/* Spreadsheet header tool */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-gray-700 uppercase">Hoja de Trabajo - {activePeriod?.label}</h4>
            </div>
            <button
              onClick={handleDownloadPayroll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-start"
            >
              <Download className="w-4 h-4" /> Descargar Planilla del Mes (.csv)
            </button>
          </div>

          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar en la planilla..."
              value={gridSearch}
              onChange={(e) => setGridSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-9 pr-4 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="planilla-spreadsheet-table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">DNI</th>
                <th className="px-6 py-3">Trabajador / Cargo</th>
                <th className="px-6 py-3">Sede</th>
                <th className="px-6 py-3">Régimen</th>
                <th className="px-6 py-3 text-right">T. Ingresos (RM)</th>
                <th className="px-6 py-3 text-right">T. Descuentos</th>
                <th className="px-6 py-3 text-right">Neto Líquido</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, idx) => {
                  const rmVal = r.incomes.find(i => i.id === "RM")?.amount || 0;
                  return (
                    <tr 
                      key={r.workerId} 
                      className={`hover:bg-blue-50/10 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                      id={`row-${r.workerId}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-500">{r.workerDni}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 block">{r.workerFullName}</span>
                          <span className="text-xs text-gray-400 line-clamp-1">{r.workerCargo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={r.workerEstablecimiento}>
                        {r.workerEstablecimiento}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600">{r.workerRegimenPensionario}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatPen(r.tRemun)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {formatPen(r.tDscto)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-700">
                        {formatPen(r.tLiqui)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdjust(r)}
                            disabled={activePeriod.isClosed}
                            className="text-xs bg-gray-50 hover:bg-indigo-50 border border-gray-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-gray-50 cursor-pointer"
                          >
                            <FileEdit className="w-3.5 h-3.5" /> Ajustes
                          </button>
                          
                          {!activePeriod.isClosed && (
                            <button
                              onClick={() => handleRemoveWorkerFromMonth(r.workerId, r.workerFullName)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir de este mes"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No hay registros cargados para este periodo o no coinciden con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Concept Modal Drawer */}
      {isAdjustModalOpen && activeRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto" id="adjust-modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Ajustes de Planilla - {activePeriod?.label}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1.5">{activeRecord.workerFullName}</h3>
                </div>
                <button 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Employee brief context details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold">Cargo</span>
                    <span className="truncate block font-medium max-w-[150px]">{activeRecord.workerCargo}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold">Establecimiento</span>
                    <span className="truncate block font-medium max-w-[150px]">{activeRecord.workerEstablecimiento}</span>
                  </div>
                </div>
                <div>
                  <span className="block font-semibold">Régimen Pensión</span>
                  <span className="block font-medium">{activeRecord.workerRegimenPensionario}</span>
                </div>
                <div>
                  <span className="block font-semibold">DNI Trabajador</span>
                  <span className="block font-medium font-mono">{activeRecord.workerDni}</span>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add concept tool row */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Adicionar Nuevo Concepto para este Mes
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <select
                      value={newConceptId}
                      onChange={(e) => {
                        setNewConceptId(e.target.value);
                        setCustomConceptName("");
                      }}
                      className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-700 focus:outline-hidden cursor-pointer flex-1"
                    >
                      <option value="">-- Seleccionar Concepto a Adicionar --</option>
                      <optgroup label="Ingresos (+ Remuneraciones)">
                        {STANDARD_CONCEPT_TYPES.filter(c => c.type === "ingreso").map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Egresos (- Descuentos)">
                        {STANDARD_CONCEPT_TYPES.filter(c => c.type === "egreso").map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    </select>

                    {(newConceptId === "Otros_Ingresos" || newConceptId === "Otros_Descuentos") && (
                      <input 
                        type="text"
                        placeholder="Escriba el nombre del concepto (ej: Movilidad, Cooperativa, etc.)"
                        value={customConceptName}
                        onChange={(e) => setCustomConceptName(e.target.value)}
                        className="bg-white border border-indigo-200 focus:border-indigo-500 px-3 py-2 rounded-xl text-xs text-gray-700 focus:outline-hidden flex-1 animate-in fade-in duration-200"
                        autoFocus
                      />
                    )}

                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Monto S/."
                      value={newConceptAmount || ""}
                      onChange={(e) => setNewConceptAmount(Number(e.target.value))}
                      className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-700 focus:outline-hidden font-mono md:w-28"
                    />

                    {/* Duration Selector */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">TIPO:</span>
                      <select
                        value={newConceptIsConstant ? "constant" : "temporal"}
                        onChange={(e) => setNewConceptIsConstant(e.target.value === "constant")}
                        className="bg-transparent border-none p-0 text-xs font-bold text-gray-700 focus:ring-0 focus:outline-hidden cursor-pointer"
                      >
                        <option value="temporal">📌 Solo este mes (Temporal)</option>
                        <option value="constant">🔄 Permanente (Constante)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddConcept}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lists of Incomes and Deductions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Incomes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 flex items-center justify-between">
                    <span>Ingresos (+ Remuneración)</span>
                    <span className="text-gray-900 font-bold">Total: S/. {adjIncomes.reduce((s, i) => s + i.amount, 0).toFixed(2)}</span>
                  </h4>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {adjIncomes.map(income => {
                      const isConstant = isMasterConcept(income.id, "ingreso");
                      return (
                        <div key={income.id} className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl text-xs">
                          <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-gray-800">{income.id}</span>
                              {isConstant ? (
                                <span className="bg-green-100/70 text-green-800 border border-green-200 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5" title="Concepto constante (se aplica todos los meses)">
                                  🔄 Constante
                                </span>
                              ) : (
                                <span className="bg-amber-100/70 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5" title={`Concepto temporal (solo se aplica en ${activePeriod?.label || "este mes"})`}>
                                  📌 Temporal
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400 block text-[11px] truncate" title={income.name}>{income.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Toggle master template constancy */}
                            {isConstant ? (
                              <button
                                type="button"
                                onClick={() => onRemoveMasterConcept?.(activeRecord.workerId, income.id, "ingreso")}
                                className="text-[9px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                                title="Hacer temporal (aplicar solo a este mes)"
                              >
                                Hacer Temporal
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAddMasterConcept?.(activeRecord.workerId, income)}
                                className="text-[9px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-200/50 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                                title="Hacer constante (guardar permanente para todos los meses)"
                              >
                                Hacer Constante
                              </button>
                            )}

                            <span className="text-gray-400 font-medium">S/.</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={income.amount}
                              onChange={(e) => handleUpdateConceptAmount(income.id, "ingreso", Number(e.target.value))}
                              className="w-20 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-right font-mono text-gray-800 focus:outline-hidden focus:bg-white"
                            />
                            {income.id !== "RM" && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteConcept(income.id, "ingreso")}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Deductions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 flex items-center justify-between">
                    <span>Egresos (- Descuentos)</span>
                    <span className="text-red-600 font-bold">Total: S/. {adjDeductions.reduce((s, d) => s + d.amount, 0).toFixed(2)}</span>
                  </h4>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {adjDeductions.map(dec => {
                      const isConstant = isMasterConcept(dec.id, "egreso");
                      return (
                        <div key={dec.id} className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl text-xs">
                          <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-gray-800">{dec.id}</span>
                              {isConstant ? (
                                <span className="bg-green-100/70 text-green-800 border border-green-200 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5" title="Concepto constante (se aplica todos los meses)">
                                  🔄 Constante
                                </span>
                              ) : (
                                <span className="bg-amber-100/70 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5" title={`Concepto temporal (solo se aplica en ${activePeriod?.label || "este mes"})`}>
                                  📌 Temporal
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400 block text-[11px] truncate" title={dec.name}>{dec.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Toggle master template constancy */}
                            {dec.id !== "SPP" && dec.id !== "SNP" && (
                              isConstant ? (
                                <button
                                  type="button"
                                  onClick={() => onRemoveMasterConcept?.(activeRecord.workerId, dec.id, "egreso")}
                                  className="text-[9px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                                  title="Hacer temporal (aplicar solo a este mes)"
                                >
                                  Hacer Temporal
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAddMasterConcept?.(activeRecord.workerId, dec)}
                                  className="text-[9px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-200/50 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                                  title="Hacer constante (guardar permanente para todos los meses)"
                                >
                                  Hacer Constante
                                </button>
                              )
                            )}

                            <span className="text-gray-400 font-medium">S/.</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={dec.amount}
                              onChange={(e) => handleUpdateConceptAmount(dec.id, "egreso", Number(e.target.value))}
                              className="w-20 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-right font-mono text-gray-800 focus:outline-hidden focus:bg-white"
                            />
                            {dec.id !== "SPP" && dec.id !== "SNP" && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteConcept(dec.id, "egreso")}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Legend field */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Leyenda Mensual (Anotación adicional exclusiva de este mes)
                </label>
                <input 
                  type="text" 
                  value={adjLeyendaMensual} 
                  onChange={(e) => setAdjLeyendaMensual(e.target.value)}
                  placeholder="E.g. LICENCIA SIN GOCE DE HABER, DESCUENTOS POR TARDANZAS EXTRAORDINARIAS, ETC."
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              {/* Quick info metrics */}
              <div className="text-xs">
                <span className="text-gray-400">Total Neto Estimado: </span>
                <span className="text-sm font-bold text-green-700">
                  S/. {(adjIncomes.reduce((s, i) => s + i.amount, 0) - adjDeductions.reduce((s, d) => s + d.amount, 0)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveAdjustments}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Ajustes S/.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Period Modal */}
      {isCreatePeriodModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-100" />
                Crear Nueva Planilla Mensual
              </h3>
              <p className="text-xs text-indigo-100/90 mt-1">
                Inicialice el cálculo para un nuevo mes. Se clonará la base de personal activo con sus conceptos constantes para realizar los ajustes correspondientes.
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Seleccione el Mes
                </label>
                <select
                  value={selectMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  {MONTH_LABELS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Seleccione el Año
                </label>
                <select
                  value={selectYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {periods.some(p => p.id === `${selectYear}-${selectMonth.toString().padStart(2, "0")}`) && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    <strong>Atención:</strong> Ya existe una planilla creada para {MONTH_LABELS[selectMonth - 1]} {selectYear}. No se puede duplicar.
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreatePeriodModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNewPeriodClick}
                disabled={periods.some(p => p.id === `${selectYear}-${selectMonth.toString().padStart(2, "0")}`)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Crear Planilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
