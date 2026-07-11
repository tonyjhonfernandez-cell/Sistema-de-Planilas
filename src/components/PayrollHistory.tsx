import React, { useState, useMemo } from "react";
import { Worker, PayrollPeriod, PayrollRecordItem } from "../types";
import { 
  Calendar, 
  Search, 
  FileText, 
  Layers, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ChevronLeft, 
  Building2,
  Filter,
  Eye
} from "lucide-react";

interface PayrollHistoryProps {
  periods: PayrollPeriod[];
  workers: Worker[];
}

export default function PayrollHistory({ periods, workers }: PayrollHistoryProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  // Get selected period details
  const selectedPeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Unique years list for filtering
  const years = useMemo(() => {
    const allYears = periods.map(p => p.year);
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [periods]);

  // General historical stats
  const stats = useMemo(() => {
    let totalRemuneration = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalRecordsCount = 0;

    periods.forEach(p => {
      p.records.forEach(r => {
        totalRemuneration += r.tRemun;
        totalDeductions += r.tDscto;
        totalNet += r.tLiqui;
        totalRecordsCount++;
      });
    });

    return {
      totalRemuneration,
      totalDeductions,
      totalNet,
      periodsCount: periods.length,
      averageNetPerWorker: totalRecordsCount > 0 ? totalNet / totalRecordsCount : 0
    };
  }, [periods]);

  // Filtered periods
  const filteredPeriods = useMemo(() => {
    let result = [...periods];
    if (selectedYearFilter !== "all") {
      const yearNum = parseInt(selectedYearFilter);
      result = result.filter(p => p.year === yearNum);
    }
    // Sort periods chronologically by descending (newest first)
    return result.sort((a, b) => {
      const valA = `${a.year}-${a.month.toString().padStart(2, "0")}`;
      const valB = `${b.year}-${b.month.toString().padStart(2, "0")}`;
      return valB.localeCompare(valA);
    });
  }, [periods, selectedYearFilter]);

  // Filtered workers inside selected period details
  const filteredPeriodRecords = useMemo(() => {
    if (!selectedPeriod) return [];
    return selectedPeriod.records.filter(r => {
      const search = searchTerm.toLowerCase();
      return (
        r.workerFullName.toLowerCase().includes(search) ||
        r.workerDni.includes(search) ||
        r.workerCargo.toLowerCase().includes(search) ||
        r.workerEstablecimiento.toLowerCase().includes(search)
      );
    });
  }, [selectedPeriod, searchTerm]);

  // Format currency helper
  const formatSoles = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN"
    }).format(amount);
  };

  return (
    <div className="space-y-6" id="payroll-history-section">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Historial de Planillas Mensuales</h2>
          <p className="text-sm text-gray-500">Resumen y vista de las planillas procesadas históricamente mes a mes</p>
        </div>
        
        {!selectedPeriod && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="bg-white border border-gray-200 text-xs font-semibold px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">Todos los años</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedPeriod ? (
        /* Detailed View of a Selected Historical Period */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top action/navigation row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedPeriodId(null);
                setSearchTerm("");
              }}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer py-1"
            >
              <ChevronLeft className="w-4 h-4" /> Volver al listado de periodos
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                selectedPeriod.isClosed 
                  ? "bg-gray-100 text-gray-600 border border-gray-200" 
                  : "bg-green-50 text-green-700 border border-green-150"
              }`}>
                {selectedPeriod.isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {selectedPeriod.isClosed ? "Planilla Cerrada" : "Planilla Abierta"}
              </span>
            </div>
          </div>

          {/* Period Title Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{selectedPeriod.label}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Identificador: {selectedPeriod.id}</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Trabajadores</p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5">{selectedPeriod.records.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Bruto CAS</p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5 text-indigo-600">
                  {formatSoles(selectedPeriod.records.reduce((sum, r) => sum + r.tRemun, 0))}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Retenciones</p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5 text-red-600">
                  {formatSoles(selectedPeriod.records.reduce((sum, r) => sum + r.tDscto, 0))}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Neto Liquidado</p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5 text-green-600">
                  {formatSoles(selectedPeriod.records.reduce((sum, r) => sum + r.tLiqui, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Records Table and Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h4 className="font-bold text-gray-800 text-sm">Desglose de Remuneraciones del Personal</h4>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por DNI, nombre, cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Trabajador</th>
                    <th className="px-6 py-3.5">Cargo / Sede</th>
                    <th className="px-6 py-3.5">Régimen Pensión</th>
                    <th className="px-6 py-3.5 text-right">Monto Bruto</th>
                    <th className="px-6 py-3.5 text-right">Retenciones</th>
                    <th className="px-6 py-3.5 text-right">Neto Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredPeriodRecords.length > 0 ? (
                    filteredPeriodRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{r.workerFullName}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">DNI: {r.workerDni}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700 max-w-xs truncate">{r.workerCargo}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{r.workerEstablecimiento}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
                            {r.workerRegimenPensionario}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatSoles(r.tRemun)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          {formatSoles(r.tDscto)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-700">
                          {formatSoles(r.tLiqui)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No se encontraron registros de pago que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Summary Period List View */
        <div className="space-y-6">
          {/* Quick Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="history-summary-widgets">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Planillas Totales</span>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{stats.periodsCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Histórico Pagado</span>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5 text-green-600">{formatSoles(stats.totalNet)}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Personal Registrado</span>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{workers.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pago Promedio</span>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5 text-indigo-600">{formatSoles(stats.averageNetPerWorker)}</p>
              </div>
            </div>
          </div>

          {/* Periods List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h4 className="font-bold text-gray-800 text-sm">Resumen Consolidado de Periodos</h4>
              <span className="text-xs text-gray-400 font-medium">Mostrando {filteredPeriods.length} periodo(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Periodo</th>
                    <th className="px-6 py-3.5 text-center">Estado</th>
                    <th className="px-6 py-3.5 text-center">Empleados</th>
                    <th className="px-6 py-3.5 text-right">Sueldo Bruto (CAS)</th>
                    <th className="px-6 py-3.5 text-right">Retenciones</th>
                    <th className="px-6 py-3.5 text-right">Líquido Pagado</th>
                    <th className="px-6 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredPeriods.length > 0 ? (
                    filteredPeriods.map((p, idx) => {
                      const tRemun = p.records.reduce((sum, r) => sum + r.tRemun, 0);
                      const tDscto = p.records.reduce((sum, r) => sum + r.tDscto, 0);
                      const tLiqui = p.records.reduce((sum, r) => sum + r.tLiqui, 0);

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                                {p.month}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 text-sm">{p.label}</span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">Identificador: {p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              p.isClosed 
                                ? "bg-gray-100 text-gray-600 border-gray-200" 
                                : "bg-green-50 text-green-700 border-green-150"
                            }`}>
                              {p.isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              {p.isClosed ? "Cerrado" : "Abierto"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-800">
                            {p.records.length} trabajadores
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-950">
                            {formatSoles(tRemun)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-red-600">
                            {formatSoles(tDscto)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-green-700">
                            {formatSoles(tLiqui)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setSelectedPeriodId(p.id)}
                              className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer mx-auto bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detalle completo
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No hay periodos de planilla que coincidan con la selección de año.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
