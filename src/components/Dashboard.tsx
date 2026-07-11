import { useMemo } from "react";
import { Worker, PayrollPeriod } from "../types";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  Building,
  UserCheck,
  Percent,
  CalendarCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardProps {
  workers: Worker[];
  periods: PayrollPeriod[];
  currentPeriodId: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

export default function Dashboard({ workers, periods, currentPeriodId }: DashboardProps) {
  // Get active period or default to the most recent one
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === currentPeriodId) || periods[0];
  }, [periods, currentPeriodId]);

  // Aggregate metrics for active period
  const metrics = useMemo(() => {
    if (!activePeriod || !activePeriod.records.length) {
      return {
        totalWorkers: 0,
        activeWorkers: 0,
        totalRemun: 0,
        totalDscto: 0,
        totalLiqui: 0,
        avgSalary: 0
      };
    }

    const records = activePeriod.records;
    const totalWorkers = workers.length;
    const activeWorkers = records.length;
    const totalRemun = records.reduce((sum, r) => sum + r.tRemun, 0);
    const totalDscto = records.reduce((sum, r) => sum + r.tDscto, 0);
    const totalLiqui = records.reduce((sum, r) => sum + r.tLiqui, 0);
    const avgSalary = activeWorkers > 0 ? totalRemun / activeWorkers : 0;

    return {
      totalWorkers,
      activeWorkers,
      totalRemun,
      totalDscto,
      totalLiqui,
      avgSalary
    };
  }, [activePeriod, workers]);

  // Data for Chart 1: Pension Regime Distribution in Active Period
  const pensionChartData = useMemo(() => {
    if (!activePeriod) return [];
    const counts: { [key: string]: number } = {};
    activePeriod.records.forEach(r => {
      let reg = r.workerRegimenPensionario || "Otros";
      // Clean up naming
      if (reg.includes("19990") || reg.toUpperCase().includes("ONP") || reg.toUpperCase().includes("SNP")) {
        reg = "ONP (Ley 19990)";
      }
      counts[reg] = (counts[reg] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activePeriod]);

  // Data for Chart 2: Monthly historical cost of payroll
  const historicalChartData = useMemo(() => {
    return [...periods]
      .reverse() // display in chronological order
      .map(p => {
        const totalRemun = p.records.reduce((sum, r) => sum + r.tRemun, 0);
        const totalDscto = p.records.reduce((sum, r) => sum + r.tDscto, 0);
        const totalLiqui = p.records.reduce((sum, r) => sum + r.tLiqui, 0);
        return {
          month: p.label.split(" ")[0] + " " + p.year.toString().slice(-2),
          "Total Remuneraciones": Math.round(totalRemun),
          "Total Descuentos": Math.round(totalDscto),
          "Neto Líquido": Math.round(totalLiqui)
        };
      });
  }, [periods]);

  // Data for Chart 3: Workers per Establishment
  const establishmentChartData = useMemo(() => {
    if (!activePeriod) return [];
    const counts: { [key: string]: number } = {};
    activePeriod.records.forEach(r => {
      let est = r.workerEstablecimiento || "Otros";
      if (est.length > 25) {
        est = est.substring(0, 22) + "...";
      }
      counts[est] = (counts[est] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 establishments
  }, [activePeriod]);

  // Format currency helper
  const formatPen = (val: number) => {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);
  };

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* Active Period Header Widget */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-indigo-600/50 text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Periodo de Trabajo
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">{activePeriod?.label || "JUNIO - 2026"}</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Gestión completa de planillas CAS
          </p>
        </div>
        <div className="flex gap-4 self-start md:self-center">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-xs">
            <span className="text-xs text-indigo-200 block font-medium">Planilla Mensual</span>
            <span className="text-xl font-bold">{metrics.activeWorkers} Personal</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-xs">
            <span className="text-xs text-indigo-200 block font-medium">Total Líquido</span>
            <span className="text-xl font-bold">{formatPen(metrics.totalLiqui).split(",")[0]}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-workers">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Trabajadores Activos</span>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.activeWorkers}</h3>
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              <UserCheck className="w-3 select-none" /> Habilitados de {metrics.totalWorkers} total
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-remuneration">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Remuneraciones</span>
            <h3 className="text-2xl font-bold text-gray-900">{formatPen(metrics.totalRemun)}</h3>
            <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 select-none" /> Sumatoria de haberes brutas
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-deductions">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Descuentos</span>
            <h3 className="text-2xl font-bold text-gray-900 text-red-600">{formatPen(metrics.totalDscto)}</h3>
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <Percent className="w-3 select-none" /> Pensiones, préstamos, faltas
            </span>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-net">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Líquido a Pagar</span>
            <h3 className="text-2xl font-bold text-green-700">{formatPen(metrics.totalLiqui)}</h3>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CalendarCheck className="w-3 select-none" /> Total neto transferido
            </span>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Cost history bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4" id="chart-history">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Histórico Mensual de Costos</h3>
              <p className="text-xs text-gray-500">Evolución de remuneraciones, descuentos y neto pagado</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">Anual</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historicalChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `S/.${val/1000}k`} />
                <Tooltip formatter={(value) => formatPen(Number(value))} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Total Remuneraciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Neto Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total Descuentos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pension system pie chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4" id="chart-pensions">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Régimen Pensionario</h3>
            <p className="text-xs text-gray-500">Distribución de afiliados en la planilla activa</p>
          </div>
          
          <div className="h-48 w-full flex items-center justify-center relative">
            {pensionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pensionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pensionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} trabajadores`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">No hay datos disponibles</div>
            )}
            <div className="absolute text-center">
              <span className="text-xs text-gray-400 block uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold text-gray-800">{metrics.activeWorkers}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-50" id="pension-legends">
            {pensionChartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="text-gray-900 font-semibold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bento details row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-bottom">
        {/* Establishments Ranking */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="chart-establishments">
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-500" /> Principales Establecimientos
            </h3>
            <p className="text-xs text-gray-500">Distribución de personal por sedes o instituciones educativas</p>
          </div>
          
          <div className="space-y-3">
            {establishmentChartData.map((item, index) => {
              const maxVal = Math.max(...establishmentChartData.map(e => e.value));
              const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate max-w-[250px]">{item.name}</span>
                    <span className="text-gray-900 font-bold">{item.value} trabajadores</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Information Alert box & tips */}
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 flex flex-col justify-between space-y-4" id="quick-tips-card">
          <div className="space-y-2">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider self-start inline-block">
              Sistema Integrado de Planillas CAS
            </span>
            <h4 className="font-bold text-amber-900 text-lg">Normas y Fórmulas del Sistema</h4>
            <div className="text-amber-800 text-sm space-y-2 leading-relaxed">
              <p>
                Este sistema calcula automáticamente las deducciones de pensiones según la legislación peruana actual para trabajadores CAS (Decreto Legislativo 1057):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>S.N.P. (Ley 19990 - ONP):</strong> 13.00% del total de remuneraciones imponibles.</li>
                <li><strong>S.P.P. (AFPs):</strong> Se calcula con el promedio de 11.37% (Aporte Obligatorio 10.00% + Comisión sobre flujo y seguro promedio) o se puede editar de manera personalizada.</li>
                <li><strong>Bonificaciones CAS:</strong> El sistema incorpora por defecto los Decretos Supremos vigentes (D.S. 311, D.S. 313, D.S. 265, D.S. 279, D.S. 317) sumando <strong>S/. 364.19</strong> a la remuneración mensual bruta por defecto.</li>
              </ul>
            </div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
              i
            </div>
            <p className="text-xs text-amber-800 leading-tight">
              Los cambios que realice en el directorio afectarán los nuevos periodos creados. Para meses ya cerrados, la información se conserva históricamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
