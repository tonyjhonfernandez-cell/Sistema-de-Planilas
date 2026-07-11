import React, { useState, useEffect } from "react";
import { Worker, PayrollPeriod, PayrollRecordItem } from "./types";
import { getInitialWorkers } from "./data/initialWorkers";
import Dashboard from "./components/Dashboard";
import WorkerManager from "./components/WorkerManager";
import PayrollManager from "./components/PayrollManager";
import BoletaViewer from "./components/BoletaViewer";
import SystemExporter from "./components/SystemExporter";
import PayrollHistory from "./components/PayrollHistory";
import VacacionesTruncas from "./components/VacacionesTruncas";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  DownloadCloud,
  FileCheck,
  History,
  Palmtree
} from "lucide-react";

const EXPIRE_DATE = new Date(2026, 6, 30, 23, 59, 59); // July 30, 2026

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "workers" | "payroll" | "boletas" | "history" | "export" | "vacaciones">("dashboard");
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Core Data States
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState("2026-06");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedLogin = sessionStorage.getItem("ugel_is_logged_in_v1");
    const isExpired = new Date() > EXPIRE_DATE;
    if (savedLogin === "true" && !isExpired) {
      setIsLoggedIn(true);
    }

    let savedWorkersStr = localStorage.getItem("ugel_workers_v1");
    let savedPeriodsStr = localStorage.getItem("ugel_periods_v1");
    let savedPeriodId = localStorage.getItem("ugel_current_period_id_v1");

    let initialWorkers: Worker[] = [];
    if (savedWorkersStr) {
      try {
        initialWorkers = JSON.parse(savedWorkersStr);
      } catch (e) {
        initialWorkers = getInitialWorkers();
      }
    } else {
      initialWorkers = getInitialWorkers();
      localStorage.setItem("ugel_workers_v1", JSON.stringify(initialWorkers));
    }
    setWorkers(initialWorkers);

    let initialPeriods: PayrollPeriod[] = [];
    if (savedPeriodsStr) {
      try {
        initialPeriods = JSON.parse(savedPeriodsStr);
      } catch (e) {
        initialPeriods = [];
      }
    }

    // If no periods exist, bootstrap the Junio 2026 dataset from raw preloaded workers
    if (initialPeriods.length === 0) {
      const juneRecords: PayrollRecordItem[] = initialWorkers.map(w => {
        const tRemun = w.defaultIncomes.reduce((sum, curr) => sum + curr.amount, 0);
        const tDscto = w.defaultDeductions.reduce((sum, curr) => sum + curr.amount, 0);
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
          tRemun: Math.round(tRemun * 100) / 100,
          tDscto: Math.round(tDscto * 100) / 100,
          tLiqui: Math.round((tRemun - tDscto) * 100) / 100,
          mImponible: Math.round(tRemun * 100) / 100
        };
      });

      initialPeriods = [
        {
          id: "2026-06",
          year: 2026,
          month: 6,
          label: "JUNIO - 2026",
          isClosed: false,
          records: juneRecords
        }
      ];
      localStorage.setItem("ugel_periods_v1", JSON.stringify(initialPeriods));
    }
    setPeriods(initialPeriods);

    if (savedPeriodId && initialPeriods.some(p => p.id === savedPeriodId)) {
      setCurrentPeriodId(savedPeriodId);
    } else {
      setCurrentPeriodId(initialPeriods[0].id);
    }

    setIsLoaded(true);
  }, []);

  // Save State Helpers
  const saveWorkers = (newWorkers: Worker[]) => {
    setWorkers(newWorkers);
    localStorage.setItem("ugel_workers_v1", JSON.stringify(newWorkers));
  };

  const savePeriods = (newPeriods: PayrollPeriod[]) => {
    setPeriods(newPeriods);
    localStorage.setItem("ugel_periods_v1", JSON.stringify(newPeriods));
  };

  const handleSetCurrentPeriodId = (id: string) => {
    setCurrentPeriodId(id);
    localStorage.setItem("ugel_current_period_id_v1", id);
  };

  // 1. Add new worker master file
  const handleAddWorker = (newWorker: Worker) => {
    const updated = [newWorker, ...workers];
    saveWorkers(updated);
    
    // Also, if active period is unlocked, automatically push them into the current active period records
    const updatedPeriods = periods.map(p => {
      if (p.id === currentPeriodId && !p.isClosed) {
        const exists = p.records.some(r => r.workerId === newWorker.id);
        if (!exists) {
          const tRemun = newWorker.defaultIncomes.reduce((sum, curr) => sum + curr.amount, 0);
          const tDscto = newWorker.defaultDeductions.reduce((sum, curr) => sum + curr.amount, 0);
          const newRecord: PayrollRecordItem = {
            workerId: newWorker.id,
            workerDni: newWorker.dni,
            workerFullName: `${newWorker.apellidos}, ${newWorker.nombres}`,
            workerCargo: newWorker.cargo,
            workerEstablecimiento: newWorker.establecimiento,
            workerRegimenPensionario: newWorker.regimenPensionario,
            leyendaMensual: "",
            incomes: [...newWorker.defaultIncomes],
            deductions: [...newWorker.defaultDeductions],
            tRemun: Math.round(tRemun * 100) / 100,
            tDscto: Math.round(tDscto * 100) / 100,
            tLiqui: Math.round((tRemun - tDscto) * 100) / 100,
            mImponible: Math.round(tRemun * 100) / 100
          };
          return {
            ...p,
            records: [newRecord, ...p.records]
          };
        }
      }
      return p;
    });
    savePeriods(updatedPeriods);
  };

  // 2. Edit existing worker master details
  const handleUpdateWorker = (updatedWorker: Worker) => {
    const updated = workers.map(w => w.id === updatedWorker.id ? updatedWorker : w);
    saveWorkers(updated);

    // If active month is open, sync their active month properties as well (except overrides/custom concepts)
    const updatedPeriods = periods.map(p => {
      if (p.id === currentPeriodId && !p.isClosed) {
        const records = p.records.map(r => {
          if (r.workerId === updatedWorker.id) {
            // Keep existing incomes/deductions but update header info
            return {
              ...r,
              workerFullName: `${updatedWorker.apellidos}, ${updatedWorker.nombres}`,
              workerCargo: updatedWorker.cargo,
              workerEstablecimiento: updatedWorker.establecimiento,
              workerRegimenPensionario: updatedWorker.regimenPensionario
            };
          }
          return r;
        });
        return { ...p, records };
      }
      return p;
    });
    savePeriods(updatedPeriods);
  };

  // 3. Remove worker from master file (sets isHabilitado false or hard delete)
  const handleDeleteWorker = (id: string) => {
    const updated = workers.filter(w => w.id !== id);
    saveWorkers(updated);

    // Also remove from any unlocked period records
    const updatedPeriods = periods.map(p => {
      if (p.id === currentPeriodId && !p.isClosed) {
        return {
          ...p,
          records: p.records.filter(r => r.workerId !== id)
        };
      }
      return p;
    });
    savePeriods(updatedPeriods);
  };

  // 4. Update adjustments in active period records
  const handleUpdatePeriodRecords = (periodId: string, records: PayrollRecordItem[]) => {
    const updated = periods.map(p => p.id === periodId ? { ...p, records } : p);
    savePeriods(updated);
  };

  // 4b. Add or update concept in worker's master template (for "Constante" concepts)
  const handleAddMasterConcept = (workerId: string, concept: any) => {
    const updated = workers.map(w => {
      if (w.id === workerId) {
        if (concept.type === "ingreso") {
          const exists = w.defaultIncomes.some(i => i.id === concept.id);
          const defaultIncomes = exists 
            ? w.defaultIncomes.map(i => i.id === concept.id ? { ...i, amount: concept.amount } : i)
            : [...w.defaultIncomes, { id: concept.id, name: concept.name, type: "ingreso", amount: concept.amount }];
          return { ...w, defaultIncomes };
        } else {
          const exists = w.defaultDeductions.some(d => d.id === concept.id);
          const defaultDeductions = exists
            ? w.defaultDeductions.map(d => d.id === concept.id ? { ...d, amount: concept.amount } : d)
            : [...w.defaultDeductions, { id: concept.id, name: concept.name, type: "egreso", amount: concept.amount }];
          return { ...w, defaultDeductions };
        }
      }
      return w;
    });
    saveWorkers(updated);
  };

  // 4c. Remove concept from worker's master template (revert to "Temporal")
  const handleRemoveMasterConcept = (workerId: string, conceptId: string, type: "ingreso" | "egreso") => {
    const updated = workers.map(w => {
      if (w.id === workerId) {
        if (type === "ingreso") {
          return {
            ...w,
            defaultIncomes: w.defaultIncomes.filter(i => i.id !== conceptId)
          };
        } else {
          return {
            ...w,
            defaultDeductions: w.defaultDeductions.filter(d => d.id !== conceptId)
          };
        }
      }
      return w;
    });
    saveWorkers(updated);
  };

  // 5. Lock/Unlock historical month
  const handleLockPeriod = (periodId: string, isClosed: boolean) => {
    const updated = periods.map(p => p.id === periodId ? { ...p, isClosed } : p);
    savePeriods(updated);
  };

  // 6. Create completely new period based on previous month cloned records
  const handleCreateNewPeriod = (year: number, month: number) => {
    const monthLabels = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    const periodId = `${year}-${month.toString().padStart(2, "0")}`;
    const label = `${monthLabels[month - 1]} - ${year}`;

    // Grab records from active period to clone, or baseline workers defaults
    const activeRecords = periods.find(p => p.id === currentPeriodId)?.records || [];
    
    let nextRecords: PayrollRecordItem[] = [];

    if (activeRecords.length > 0) {
      // Clone records from previous month (this carries over persistent coop codes, custom entries)
      nextRecords = activeRecords.map(r => {
        // Reset monthly-specific entries like tardanzas/faltas/reintegros for a fresh start in the new month
        const incomes = r.incomes.filter(i => i.id !== "Reintegro" && i.id !== "Bono_Especial");
        const deductions = r.deductions.filter(d => d.id !== "TARDANZA" && d.id !== "FALTAS");

        const tRemun = incomes.reduce((sum, curr) => sum + curr.amount, 0);
        const tDscto = deductions.reduce((sum, curr) => sum + curr.amount, 0);

        return {
          ...r,
          leyendaMensual: "",
          incomes,
          deductions,
          tRemun: Math.round(tRemun * 100) / 100,
          tDscto: Math.round(tDscto * 100) / 100,
          tLiqui: Math.round((tRemun - tDscto) * 100) / 100,
          mImponible: Math.round(tRemun * 100) / 100
        };
      });
    } else {
      // Bootstrap from master directory
      nextRecords = workers.filter(w => w.isHabilitado).map(w => {
        const tRemun = w.defaultIncomes.reduce((sum, curr) => sum + curr.amount, 0);
        const tDscto = w.defaultDeductions.reduce((sum, curr) => sum + curr.amount, 0);
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
          tRemun: Math.round(tRemun * 100) / 100,
          tDscto: Math.round(tDscto * 100) / 100,
          tLiqui: Math.round((tRemun - tDscto) * 100) / 100,
          mImponible: Math.round(tRemun * 100) / 100
        };
      });
    }

    const newPeriod: PayrollPeriod = {
      id: periodId,
      year,
      month,
      label,
      isClosed: false,
      records: nextRecords
    };

    const updated = [newPeriod, ...periods];
    savePeriods(updated);
    handleSetCurrentPeriodId(periodId);
  };

  // Restore database from external JSON file
  const handleRestoreDatabase = (backupData: { workers: Worker[]; periods: PayrollPeriod[] }) => {
    saveWorkers(backupData.workers);
    savePeriods(backupData.periods);
    if (backupData.periods.length > 0) {
      handleSetCurrentPeriodId(backupData.periods[0].id);
    }
  };

  // Hard Reset to preloaded state
  const handleResetDatabase = () => {
    localStorage.removeItem("ugel_workers_v1");
    localStorage.removeItem("ugel_periods_v1");
    localStorage.removeItem("ugel_current_period_id_v1");
    
    // Force reload page to trigger mount bootstrap
    window.location.reload();
  };

  // Clear database completely to start from scratch
  const handleClearDatabase = () => {
    saveWorkers([]);
    savePeriods([]);
    localStorage.removeItem("ugel_current_period_id_v1");
    
    // Force reload page to trigger empty bootstrap
    window.location.reload();
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-semibold text-sm">Cargando Sistema de Planillas CAS...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    const isExpired = new Date() > EXPIRE_DATE;
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isExpired) {
        setLoginError("La clave de acceso ha expirado (válida hasta el 30 de julio de 2026). Por favor, contacte con soporte técnico.");
        return;
      }
      if (password === "1020") {
        setIsLoggedIn(true);
        sessionStorage.setItem("ugel_is_logged_in_v1", "true");
        setLoginError("");
      } else {
        setLoginError("Contraseña incorrecta. Inténtelo de nuevo.");
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 bg-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-gray-950 tracking-tight">Sistema Integrado de Planillas CAS</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Módulo de Seguridad de Planillas</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Contraseña de Acceso</label>
              <input
                type="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-center"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-150 leading-relaxed text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-[10px] text-center text-gray-400 font-mono space-y-1">
            <p>Acceso seguro y exclusivo de la Oficina de Planillas</p>
            <p>Clave de acceso temporal válida hasta el 30 de Julio de 2026</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-800">
      {/* Top Banner Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40" id="main-header">
        {/* Top brand row */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100">
          <div className="flex items-center justify-between h-14">
            {/* Logo Group */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-700 text-white rounded-lg flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 tracking-tight leading-none">Sistema Integrado de Planillas CAS</h1>
                <p className="text-[10px] text-gray-400 font-medium">UGEL - Oficina de Planillas</p>
              </div>
            </div>

            {/* Profile Brief Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide bg-gray-100 px-2.5 py-1 rounded-md font-mono">
                Junio 2026
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar - Compact and Scrollable on Mobile */}
        <div className="bg-gray-50/60 w-full border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none whitespace-nowrap" id="nav-tabs">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "dashboard" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Resumen
              </button>

              <button
                onClick={() => setActiveTab("workers")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "workers" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Trabajadores
              </button>

              <button
                onClick={() => setActiveTab("payroll")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "payroll" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Planilla Mensual
              </button>

              <button
                onClick={() => setActiveTab("boletas")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "boletas" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Boletas de Pago
              </button>

              <button
                onClick={() => setActiveTab("vacaciones")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "vacaciones" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" /> Vacaciones Truncas
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "history" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <History className="w-3.5 h-3.5" /> Historial
              </button>

              <button
                onClick={() => setActiveTab("export")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === "export" 
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <DownloadCloud className="w-3.5 h-3.5" /> Backup / Exportar
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Responsive Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
        {activeTab === "dashboard" && (
          <Dashboard 
            workers={workers} 
            periods={periods} 
            currentPeriodId={currentPeriodId} 
          />
        )}
        
        {activeTab === "workers" && (
          <WorkerManager 
            workers={workers}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
          />
        )}

        {activeTab === "payroll" && (
          <PayrollManager 
            workers={workers}
            periods={periods}
            currentPeriodId={currentPeriodId}
            onSetCurrentPeriodId={handleSetCurrentPeriodId}
            onUpdatePeriodRecords={handleUpdatePeriodRecords}
            onLockPeriod={handleLockPeriod}
            onCreateNewPeriod={handleCreateNewPeriod}
            onAddMasterConcept={handleAddMasterConcept}
            onRemoveMasterConcept={handleRemoveMasterConcept}
          />
        )}

        {activeTab === "boletas" && (
          <BoletaViewer 
            workers={workers}
            periods={periods}
            currentPeriodId={currentPeriodId}
          />
        )}

        {activeTab === "vacaciones" && (
          <VacacionesTruncas 
            workers={workers}
          />
        )}

        {activeTab === "history" && (
          <PayrollHistory 
            periods={periods}
            workers={workers}
          />
        )}

        {activeTab === "export" && (
          <SystemExporter 
            workers={workers}
            periods={periods}
            currentPeriodId={currentPeriodId}
            onRestoreDatabase={handleRestoreDatabase}
            onResetDatabase={handleResetDatabase}
            onClearDatabase={handleClearDatabase}
          />
        )}
      </main>

      {/* Footer system details */}
      <footer className="bg-white border-t border-gray-200 py-6" id="main-footer">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Sistema Integrado de Planillas CAS - Oficina de Planillas y Recursos Humanos. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> Sistema Local Online
            </span>
            <span>Versión 1.2.0</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Navigation Menu (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-3 flex items-center justify-around z-40 shadow-lg" id="mobile-nav">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "dashboard" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px]">Resumen</span>
        </button>
        <button 
          onClick={() => setActiveTab("workers")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "workers" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px]">Personal</span>
        </button>
        <button 
          onClick={() => setActiveTab("payroll")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "payroll" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[9px]">Planilla</span>
        </button>
        <button 
          onClick={() => setActiveTab("boletas")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "boletas" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px]">Boletas</span>
        </button>
        <button 
          onClick={() => setActiveTab("vacaciones")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "vacaciones" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <Palmtree className="w-5 h-5" />
          <span className="text-[9px]">Vacaciones</span>
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "history" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px]">Historial</span>
        </button>
        <button 
          onClick={() => setActiveTab("export")}
          className={`flex flex-col items-center gap-0.5 p-1 ${activeTab === "export" ? "text-indigo-600 font-bold" : "text-gray-400 text-[10px]"}`}
        >
          <DownloadCloud className="w-5 h-5" />
          <span className="text-[9px]">Exportar</span>
        </button>
      </div>
    </div>
  );
}
