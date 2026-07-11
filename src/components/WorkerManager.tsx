import React, { useState, useMemo } from "react";
import { Worker, RegimenPensionario, Concept } from "../types";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  CheckCircle, 
  XCircle,
  Briefcase,
  Building,
  User,
  Plus,
  Trash,
  Download
} from "lucide-react";

interface WorkerManagerProps {
  workers: Worker[];
  onAddWorker: (worker: Worker) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
}

const ESTABLECIMIENTOS = [
  "Sede Administrativa",
  "SEDE ADMINISTRATIVA",
  "0084 - \"ANDRES AVELINO CACERES DORREGARAY\" - NUEVO LIMA",
  "CORPUS CHRISTE - CARHUAPOMA - SAN RAFAEL",
  "0005 - \"DANIEL ALCIDES CARRION\"-SAN RAFAEL",
  "0700 - \"SAN JUAN BAUTISTA\" - CARHUAPOMA",
  "0760\"JOSE SILVERIO OLAYA BALANDRA\" LIMON",
  "0772\"JOSE FAUSTINO SANCHEZ CARRION\"BARRANCA",
  "I.E Corpus Christi – Carhuapoma -",
  "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
  "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
  "RESIDENCIA ESTUDIANTIL NUESTRA SEÑORA DEL ROCIO"
];

const PENSIONES = [
  "AFP HABITAT",
  "AFP PRIMA",
  "AFP INTEGRA",
  "AFP PROFUTURO",
  "LEY 19990"
];

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

export default function WorkerManager({ 
  workers, 
  onAddWorker, 
  onUpdateWorker, 
  onDeleteWorker 
}: WorkerManagerProps) {
  // Filters and search states
  const [search, setSearch] = useState("");
  const [filterEstablecimiento, setFilterEstablecimiento] = useState("");
  const [filterPension, setFilterPension] = useState("");
  const [filterHabilitado, setFilterHabilitado] = useState("all"); // "all" | "active" | "inactive"
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form states for Add/Edit Worker Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  // Fields for the active worker form
  const [formDni, setFormDni] = useState("");
  const [formApellidos, setFormApellidos] = useState("");
  const [formNombres, setFormNombres] = useState("");
  const [formFechaNacimiento, setFormFechaNacimiento] = useState("");
  const [formEstablecimiento, setFormEstablecimiento] = useState(ESTABLECIMIENTOS[0]);
  const [formCargo, setFormCargo] = useState("");
  const [formRegimenPensionario, setFormRegimenPensionario] = useState(PENSIONES[2]); // Default AFP INTEGRA
  const [formBaseSalary, setFormBaseSalary] = useState(2500);
  const [formFechaIngreso, setFormFechaIngreso] = useState("2026-01-01");
  const [formFechaTermino, setFormFechaTermino] = useState("2026-12-31");
  const [formCtaAhorro, setFormCtaAhorro] = useState("");
  const [formLeyendaPermanente, setFormLeyendaPermanente] = useState("CONT. 01-01 AL 31-12");
  const [formEssalud, setFormEssalud] = useState("9308291PESTA008");
  const [formIsHabilitado, setFormIsHabilitado] = useState(true);
  const [formMotivoCese, setFormMotivoCese] = useState("");

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      // Search query filter
      const fullName = `${w.apellidos} ${w.nombres}`.toLowerCase();
      const cargo = w.cargo.toLowerCase();
      const dni = w.dni;
      const query = search.toLowerCase();
      const matchesSearch = fullName.includes(query) || cargo.includes(query) || dni.includes(query);

      // Dropdown filters
      const matchesEstablecimiento = !filterEstablecimiento || w.establecimiento === filterEstablecimiento;
      const matchesPension = !filterPension || w.regimenPensionario === filterPension;
      
      // Active/Inactive status filter
      let matchesHabilitado = true;
      if (filterHabilitado === "active") matchesHabilitado = w.isHabilitado;
      if (filterHabilitado === "inactive") matchesHabilitado = !w.isHabilitado;

      return matchesSearch && matchesEstablecimiento && matchesPension && matchesHabilitado;
    });
  }, [workers, search, filterEstablecimiento, filterPension, filterHabilitado]);

  // Paginated workers
  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWorkers.slice(start, start + itemsPerPage);
  }, [filteredWorkers, currentPage]);

  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Open modal for adding worker
  const handleOpenAddModal = () => {
    setEditingWorker(null);
    setFormDni("");
    setFormApellidos("");
    setFormNombres("");
    setFormFechaNacimiento("");
    setFormEstablecimiento(ESTABLECIMIENTOS[0]);
    setFormCargo("");
    setFormRegimenPensionario(PENSIONES[2]);
    setFormBaseSalary(2500);
    setFormFechaIngreso("2026-01-01");
    setFormFechaTermino("2026-12-31");
    setFormCtaAhorro("");
    setFormLeyendaPermanente("CONT. 01-01 AL 31-12");
    setFormEssalud("9308291PESTA008");
    setFormIsHabilitado(true);
    setFormMotivoCese("");
    setIsModalOpen(true);
  };

  // Open modal for editing worker
  const handleOpenEditModal = (w: Worker) => {
    setEditingWorker(w);
    setFormDni(w.dni);
    setFormApellidos(w.apellidos);
    setFormNombres(w.nombres);
    setFormFechaNacimiento(w.fechaNacimiento);
    setFormEstablecimiento(w.establecimiento);
    setFormCargo(w.cargo);
    setFormRegimenPensionario(w.regimenPensionario);
    
    // Get base salary from RM concept or default
    const rmConcept = w.defaultIncomes.find(i => i.id === "RM");
    setFormBaseSalary(rmConcept ? rmConcept.amount : 2500);
    
    // Convert dates from DD/MM/YYYY to YYYY-MM-DD for datepicker
    setFormFechaIngreso(w.fechaIngreso ? (w.fechaIngreso.includes("/") ? dmyToYmd(w.fechaIngreso) : w.fechaIngreso) : "2026-01-01");
    setFormFechaTermino(w.fechaTermino ? (w.fechaTermino.includes("/") ? dmyToYmd(w.fechaTermino) : w.fechaTermino) : "2026-12-31");
    setFormCtaAhorro(w.ctaAhorro || "");
    setFormLeyendaPermanente(w.leyendaPermanente || "CONT. 01-01 AL 31-12");
    setFormEssalud(w.essalud || "9308291PESTA008");
    setFormIsHabilitado(w.isHabilitado !== undefined ? w.isHabilitado : true);
    setFormMotivoCese(w.motivoCese || "");
    setIsModalOpen(true);
  };

  // Handle modal form submission
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDni || !formApellidos || !formNombres || !formCargo) {
      alert("Por favor rellene los campos obligatorios: DNI, Apellidos, Nombres, Cargo.");
      return;
    }

    // Incomes
    const defaultIncomes: Concept[] = [
      { id: "RM", name: "Remuneración Mensual (RM)", type: "ingreso", amount: Number(formBaseSalary) },
      { id: "DS311", name: "D.S. 311", type: "ingreso", amount: 64.19 },
      { id: "DS313", name: "D.S. 313", type: "ingreso", amount: 50.00 },
      { id: "DS265", name: "D.S. 265", type: "ingreso", amount: 50.00 },
      { id: "DS279", name: "D.S. 279", type: "ingreso", amount: 100.00 },
      { id: "DS317", name: "D.S. 317", type: "ingreso", amount: 100.00 }
    ];

    // Auto-calculate pension deduction based on regime
    const tRemunEstimate = defaultIncomes.reduce((sum, i) => sum + i.amount, 0);
    const defaultDeductions: Concept[] = [];
    
    if (formRegimenPensionario.startsWith("AFP")) {
      const sppAmount = Math.round(tRemunEstimate * 0.1137 * 100) / 100;
      defaultDeductions.push({ id: "SPP", name: `SPP (${formRegimenPensionario})`, type: "egreso", amount: sppAmount });
    } else {
      const snpAmount = Math.round(tRemunEstimate * 0.13 * 100) / 100;
      defaultDeductions.push({ id: "SNP", name: "S.N.P. (Ley 19990)", type: "egreso", amount: snpAmount });
    }

    // Convert picker dates (YYYY-MM-DD) back to DD/MM/YYYY for compatibility
    const formattedIngreso = formFechaIngreso.includes("-") ? ymdToDmy(formFechaIngreso) : formFechaIngreso;
    const formattedTermino = formFechaTermino.includes("-") ? ymdToDmy(formFechaTermino) : formFechaTermino;

    const workerData: Worker = {
      id: formDni,
      dni: formDni,
      apellidos: formApellidos.toUpperCase(),
      nombres: formNombres.toUpperCase(),
      fechaNacimiento: formFechaNacimiento,
      ruc: `10${formDni}-282001`,
      establecimiento: formEstablecimiento,
      cargo: formCargo.toUpperCase(),
      tipoServidor: "CONTRATADO",
      regimenLaboral: "12-Ley Nro 1057",
      nivelMag: "A/0-0/40/0",
      tiempoServicio: "--",
      essalud: formEssalud,
      fechaIngreso: formattedIngreso,
      fechaTermino: formattedTermino,
      ctaAhorro: formCtaAhorro,
      leyendaPermanente: formIsHabilitado ? formLeyendaPermanente : `CESE AL ${formattedTermino}`,
      leyendaMensual: "",
      regimenPensionario: formRegimenPensionario,
      isHabilitado: formIsHabilitado,
      motivoCese: formIsHabilitado ? "" : (formMotivoCese || "Término de Contrato"),
      defaultIncomes,
      defaultDeductions
    };

    if (editingWorker) {
      onUpdateWorker(workerData);
    } else {
      // Check for duplicate DNI
      if (workers.some(w => w.dni === formDni)) {
        alert("Ya existe un trabajador registrado con este DNI.");
        return;
      }
      onAddWorker(workerData);
    }
    
    setIsModalOpen(false);
  };

  // Handle deletion
  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`¿Está seguro de que desea eliminar a ${name} del sistema?`)) {
      onDeleteWorker(id);
      // Reset current page if no items left
      if (paginatedWorkers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Export directory to CSV format
  const handleDownloadDirectory = () => {
    const headers = [
      "DNI",
      "Apellidos",
      "Nombres",
      "Cargo",
      "Regimen Laboral",
      "Regimen Pensionario",
      "Establecimiento",
      "Fecha Ingreso",
      "Fecha Termino/Cese",
      "Cuenta Ahorro",
      "Estado",
      "Motivo Cese",
      "Sueldo Basico"
    ];

    const csvRows = workers.map(w => {
      const basicIncome = w.defaultIncomes.find(i => 
        ["M_CAS", "CAS", "RM", "RE_MEN", "Remuneración Mensual"].includes(i.id) || 
        i.name.toLowerCase().includes("básic") || 
        i.name.toLowerCase().includes("mensual")
      );
      const basic = basicIncome ? basicIncome.amount : (w.defaultIncomes[0]?.amount || 0);

      const fields = [
        w.dni || "",
        w.apellidos || "",
        w.nombres || "",
        w.cargo || "",
        w.regimenLaboral || "",
        w.regimenPensionario || "",
        w.establecimiento || "",
        w.fechaIngreso || "",
        w.fechaTermino || "",
        w.ctaAhorro || "",
        w.isHabilitado ? "Activo" : "Cesado",
        (!w.isHabilitado && w.motivoCese) ? w.motivoCese : "",
        basic.toFixed(2)
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
    link.setAttribute("download", `directorio_trabajadores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="worker-manager-section">
      {/* Directory Title with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Directorio de Trabajadores</h2>
          <p className="text-sm text-gray-500">Administre el maestro de personal del Sistema Integrado de Planillas CAS</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadDirectory}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-sm"
          >
            <Download className="w-5 h-5" /> Exportar Directorio
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-sm"
            id="btn-add-worker"
          >
            <UserPlus className="w-5 h-5" /> Incorporar Trabajador
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="worker-filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 select-none" />
            <input 
              type="text" 
              placeholder="Buscar por DNI, nombres..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset to page 1 on new search
              }}
              className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Establishment selector */}
          <div className="relative">
            <select
              value={filterEstablecimiento}
              onChange={(e) => {
                setFilterEstablecimiento(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option value="">Todos los Establecimientos</option>
              {ESTABLECIMIENTOS.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* Pension filter */}
          <div className="relative">
            <select
              value={filterPension}
              onChange={(e) => {
                setFilterPension(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option value="">Cualquier Régimen Pensión</option>
              {PENSIONES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterHabilitado}
              onChange={(e) => {
                setFilterHabilitado(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Cualquier Estado</option>
              <option value="active">Solo Habilitados</option>
              <option value="inactive">Solo No Habilitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Worker Cards */}
      {filteredWorkers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="workers-cards-grid">
          {paginatedWorkers.map(w => {
            const rmVal = w.defaultIncomes.find(i => i.id === "RM")?.amount || 0;
            return (
              <div 
                key={w.id} 
                className={`bg-white rounded-2xl border ${w.isHabilitado ? 'border-gray-100' : 'border-red-100 bg-red-50/10'} shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4`}
                id={`worker-card-${w.id}`}
              >
                {/* Card header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-gray-400">DNI: {w.dni}</span>
                      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{w.apellidos}, {w.nombres}</h4>
                    </div>
                    {w.isHabilitado ? (
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" title={w.motivoCese ? `Motivo: ${w.motivoCese}` : "Cesado"}>
                        <XCircle className="w-3 h-3" /> Cesado
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-50 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate" title={w.cargo}>{w.cargo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate" title={w.establecimiento}>{w.establecimiento}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{w.regimenPensionario}</span>
                    </div>

                    {!w.isHabilitado && (
                      <div className="mt-2 bg-rose-50/70 border border-rose-100 text-rose-700 p-2 rounded-xl text-[10px] font-semibold space-y-0.5">
                        <p>Último día: <span className="font-mono font-bold">{w.fechaTermino || "No registrada"}</span></p>
                        {w.motivoCese && <p className="italic">Motivo: {w.motivoCese}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 block uppercase font-semibold">Sueldo Base</span>
                    <span className="text-base font-bold text-indigo-700">S/. {rmVal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenEditModal(w)}
                      className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar ficha"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(w.id, `${w.apellidos}, ${w.nombres}`)}
                      className="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar del sistema"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100" id="no-workers-alert">
          <p className="text-gray-400 text-lg">No se encontraron trabajadores con los filtros aplicados.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100" id="pagination-controls">
          <span className="text-sm text-gray-500">
            Mostrando pág. <strong>{currentPage}</strong> de {totalPages} ({filteredWorkers.length} de {workers.length} trabajadores)
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto" id="worker-modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingWorker ? "Editar Ficha de Trabajador" : "Incorporar Nuevo Trabajador"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Main Profile Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">DNI (Obligatorio)</label>
                  <input 
                    type="text" 
                    value={formDni} 
                    onChange={(e) => setFormDni(e.target.value.replace(/\D/g, "").substring(0, 8))}
                    disabled={!!editingWorker}
                    placeholder="8 dígitos"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all disabled:opacity-60"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Apellidos (Obligatorio)</label>
                  <input 
                    type="text" 
                    value={formApellidos} 
                    onChange={(e) => setFormApellidos(e.target.value)}
                    placeholder="E.g. FLORES LANARES"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombres (Obligatorio)</label>
                  <input 
                    type="text" 
                    value={formNombres} 
                    onChange={(e) => setFormNombres(e.target.value)}
                    placeholder="E.g. KAREN JANETH"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha Nacimiento</label>
                  <input 
                    type="text" 
                    value={formFechaNacimiento} 
                    onChange={(e) => setFormFechaNacimiento(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Job / Assignment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cargo Desempeñado</label>
                  <input 
                    type="text" 
                    value={formCargo} 
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="E.g. ANALISTA ADMINISTRATIVO"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Establecimiento</label>
                  <select
                    value={formEstablecimiento}
                    onChange={(e) => setFormEstablecimiento(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
                  >
                    {ESTABLECIMIENTOS.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial & Pension parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sueldo Base (RM) S/.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formBaseSalary} 
                    onChange={(e) => setFormBaseSalary(Number(e.target.value))}
                    placeholder="E.g. 2600.00"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Régimen Pensionario</label>
                  <select
                    value={formRegimenPensionario}
                    onChange={(e) => setFormRegimenPensionario(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
                  >
                    {PENSIONES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Essalud Autogenerado</label>
                  <input 
                    type="text" 
                    value={formEssalud} 
                    onChange={(e) => setFormEssalud(e.target.value)}
                    placeholder="E.g. 9308291PESTA008"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              {/* Contract Term Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha Ingreso</label>
                  <input 
                    type="date" 
                    value={formFechaIngreso} 
                    onChange={(e) => setFormFechaIngreso(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha Término / Cese</label>
                  <input 
                    type="date" 
                    value={formFechaTermino} 
                    onChange={(e) => setFormFechaTermino(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cuenta de Ahorros</label>
                  <input 
                    type="text" 
                    value={formCtaAhorro} 
                    onChange={(e) => setFormCtaAhorro(e.target.value)}
                    placeholder="Nro Cuenta o Banco"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Leyenda Permanente</label>
                  <input 
                    type="text" 
                    value={formLeyendaPermanente} 
                    onChange={(e) => setFormLeyendaPermanente(e.target.value)}
                    placeholder="E.g. CONT. 01-01 AL 30-09"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado en Planilla</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold">
                      <input 
                        type="radio" 
                        name="isHabilitado"
                        checked={formIsHabilitado}
                        onChange={() => setFormIsHabilitado(true)}
                        className="cursor-pointer"
                      /> Activo
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-rose-600">
                      <input 
                        type="radio" 
                        name="isHabilitado"
                        checked={!formIsHabilitado}
                        onChange={() => setFormIsHabilitado(false)}
                        className="cursor-pointer"
                      /> Cesado (Inactivo)
                    </label>
                  </div>
                </div>
              </div>

              {!formIsHabilitado && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Información de Cese Obligatoria</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">Fecha de Cese (Último Día Laborado)</label>
                      <input 
                        type="date" 
                        value={formFechaTermino} 
                        onChange={(e) => setFormFechaTermino(e.target.value)}
                        className="w-full bg-white border border-rose-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">Motivo del Cese</label>
                      <select
                        value={formMotivoCese}
                        onChange={(e) => setFormMotivoCese(e.target.value)}
                        className="w-full bg-white border border-rose-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">-- Seleccionar Motivo --</option>
                        <option value="Término de Contrato">Término de Contrato</option>
                        <option value="Renuncia Voluntaria">Renuncia Voluntaria</option>
                        <option value="Despido Justificado">Despido Justificado</option>
                        <option value="Mutuo Disenso">Mutuo Disenso</option>
                        <option value="Invalidez Permanente">Invalidez Permanente</option>
                        <option value="Otro">Otro Motivo</option>
                      </select>
                    </div>
                  </div>
                  {formMotivoCese === "Otro" && (
                    <div>
                      <input 
                        type="text"
                        placeholder="Especifique el otro motivo del cese..."
                        value={formMotivoCese === "Otro" ? "" : formMotivoCese}
                        onChange={(e) => setFormMotivoCese(e.target.value)}
                        className="w-full bg-white border border-rose-200 px-3 py-2 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-rose-600 font-medium">
                    * Nota: Al guardar como cesado, la fecha de cese se utilizará automáticamente como el límite de días para el cálculo de sus vacaciones truncas.
                  </p>
                </div>
              )}
            </form>

            {/* Modal Footer actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSubmitForm}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {editingWorker ? "Guardar Cambios" : "Agregar Trabajador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
