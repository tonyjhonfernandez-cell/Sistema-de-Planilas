import { useState, useMemo, useRef } from "react";
import { Worker, PayrollPeriod, Concept, PayrollRecordItem } from "../types";
import { 
  Printer, 
  Copy, 
  Check, 
  User, 
  FileText, 
  Layers, 
  CheckCircle, 
  Calendar,
  Building,
  Briefcase,
  Search
} from "lucide-react";

interface BoletaViewerProps {
  workers: Worker[];
  periods: PayrollPeriod[];
  currentPeriodId: string;
}

export default function BoletaViewer({ workers, periods, currentPeriodId }: BoletaViewerProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [viewMode, setViewMode] = useState<"text" | "graphic">("text"); // "text" | "graphic"
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const printRef = useRef<HTMLDivElement>(null);

  // Active period
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === currentPeriodId) || periods[0];
  }, [periods, currentPeriodId]);

  // Set first worker as default selected
  useMemo(() => {
    if (activePeriod && activePeriod.records.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(activePeriod.records[0].workerId);
    }
  }, [activePeriod, selectedWorkerId]);

  // Filter records based on search term
  const filteredRecords = useMemo(() => {
    if (!activePeriod) return [];
    if (!searchTerm.trim()) return activePeriod.records;
    const q = searchTerm.toLowerCase();
    return activePeriod.records.filter(r => 
      r.workerFullName.toLowerCase().includes(q) || 
      r.workerDni.includes(q)
    );
  }, [activePeriod, searchTerm]);

  // Selected payroll record item
  const selectedRecord = useMemo(() => {
    if (!activePeriod || !selectedWorkerId) return null;
    return activePeriod.records.find(r => r.workerId === selectedWorkerId) || null;
  }, [activePeriod, selectedWorkerId]);

  // Selected worker details
  const selectedWorker = useMemo(() => {
    if (!selectedWorkerId) return null;
    return workers.find(w => w.id === selectedWorkerId) || null;
  }, [workers, selectedWorkerId]);

  // Recreate the exact vintage text boleta of UGEL Bellavista
  const rawTextBoleta = useMemo(() => {
    if (!selectedRecord || !selectedWorker || !activePeriod) return "";

    const formatNum = (n: number) => {
      return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const padRight = (str: string, length: number) => {
      return str.padEnd(length, " ");
    };

    const padLeft = (str: string, length: number) => {
      return str.padStart(length, " ");
    };

    const monthLabel = activePeriod.label.split(" - ")[0];
    const yearLabel = activePeriod.year;

    // Main header
    let out = `SISTEMA INTEGRADO DE PLANILLAS CAS                     DW201125-1438308\n`;
    out += `*DW SISTEMA INTEGRADO DE PLANILLAS CAS\n`;
    out += `RUC - 0                                                10${selectedWorker.dni}-282001\n`;
    out += `${monthLabel} - ${yearLabel}  CAS/CONT/TIT                          \t(4) Habilitado\n`;
    out += `Apellidos                    : ${selectedWorker.apellidos}\n`;
    out += `Nombres                      : ${selectedWorker.nombres}\n`;
    out += `Fecha de Nacimiento          : ${selectedWorker.fechaNacimiento || "--"}\n`;
    out += `Documento de Identidad       : (Lib.Electoral o D.N.) ${selectedWorker.dni}\n`;
    out += `Establecimiento              : ${selectedWorker.establecimiento}\n`;
    out += `Cargo                        : ${selectedWorker.cargo}\n`;
    out += `Tipo de Servidor             : ${selectedWorker.tipoServidor}\n`;
    out += `Regimen Laboral              : ${selectedWorker.regimenLaboral}\n`;
    out += `Niv.Mag./G.Ocup./Horas/HrsAdd: ${selectedWorker.nivelMag}\n`;
    out += `Tiempo de Servicio (AA-MM-DD): ${selectedWorker.tiempoServicio} ESSALUD : ${selectedWorker.essalud}\n`;
    out += `Fecha de Registro            : Ingr.:${selectedWorker.fechaIngreso} Termino:${selectedWorker.fechaTermino}\n`;
    out += `Cta. TeleAhorro o Nro. Cheque: ${selectedWorker.ctaAhorro || ""}\n`;
    out += `Leyenda Permanente           : ${selectedWorker.leyendaPermanente}\n`;
    out += `Leyenda Mensual              : ${selectedRecord.leyendaMensual || ""}\n`;
    out += `Regimen Pensionario          : ${selectedWorker.regimenPensionario}\n\n`;
    
    out += `=======================================================================\n`;
    
    // Incomes
    selectedRecord.incomes.forEach(i => {
      out += `+${padRight(i.id, 12)} ${padLeft(formatNum(i.amount), 10)}\n`;
    });
    
    // Deductions
    selectedRecord.deductions.forEach(d => {
      out += `-${padRight(d.id, 12)} ${padLeft(formatNum(d.amount), 10)}\n`;
    });

    out += `\n\n\n\n\n`;
    out += `=======================================================================\n`;
    out += `T-REMUN      ${padLeft(formatNum(selectedRecord.tRemun), 9)} T-DSCTO      ${padLeft(formatNum(selectedRecord.tDscto), 9)}  T-LIQUI     ${padLeft(formatNum(selectedRecord.tLiqui), 9)}\n`;
    out += `MImponible   ${padLeft(formatNum(selectedRecord.mImponible), 9)}\n`;
    out += `Mensajes  :\n`;
    out += `Visite la pagina Web del Ministerio de Educación: www.minedu.gob.pe.\n\n`;
    
    // Fake page number corresponding to order or random ID
    const fakeSeq = selectedWorker.dni.slice(-3);
    out += `\t\t\t\t\t\t\t\t00000${fakeSeq}\n`;
    out += `.\n`;

    return out;
  }, [selectedRecord, selectedWorker, activePeriod]);

  // Download all workers' text boletas into a single TXT file for system loading or printing
  const handleDownloadAllTXT = () => {
    if (!activePeriod || activePeriod.records.length === 0) {
      alert("No hay boletas disponibles para descargar.");
      return;
    }

    const formatNum = (n: number) => {
      return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const padRight = (str: string, length: number) => {
      return str.padEnd(length, " ");
    };

    const padLeft = (str: string, length: number) => {
      return str.padStart(length, " ");
    };

    const monthLabel = activePeriod.label.split(" - ")[0];
    const yearLabel = activePeriod.year;

    let fullTxt = "";

    activePeriod.records.forEach((record, index) => {
      const worker = workers.find(w => w.id === record.workerId);
      if (!worker) return;

      let out = `SISTEMA INTEGRADO DE PLANILLAS CAS                     DW201125-1438308\n`;
      out += `*DW SISTEMA INTEGRADO DE PLANILLAS CAS\n`;
      out += `RUC - 0                                                10${worker.dni}-282001\n`;
      out += `${monthLabel} - ${yearLabel}  CAS/CONT/TIT                          \t(4) Habilitado\n`;
      out += `Apellidos                    : ${worker.apellidos}\n`;
      out += `Nombres                      : ${worker.nombres}\n`;
      out += `Fecha de Nacimiento          : ${worker.fechaNacimiento || "--"}\n`;
      out += `Documento de Identidad       : (Lib.Electoral o D.N.) ${worker.dni}\n`;
      out += `Establecimiento              : ${worker.establecimiento}\n`;
      out += `Cargo                        : ${worker.cargo}\n`;
      out += `Tipo de Servidor             : ${worker.tipoServidor}\n`;
      out += `Regimen Laboral              : ${worker.regimenLaboral}\n`;
      out += `Niv.Mag./G.Ocup./Horas/HrsAdd: ${worker.nivelMag}\n`;
      out += `Tiempo de Servicio (AA-MM-DD): ${worker.tiempoServicio} ESSALUD : ${worker.essalud}\n`;
      out += `Fecha de Registro            : Ingr.:${worker.fechaIngreso} Termino:${worker.fechaTermino}\n`;
      out += `Cta. TeleAhorro o Nro. Cheque: ${worker.ctaAhorro || ""}\n`;
      out += `Leyenda Permanente           : ${worker.leyendaPermanente}\n`;
      out += `Leyenda Mensual              : ${record.leyendaMensual || ""}\n`;
      out += `Regimen Pensionario          : ${worker.regimenPensionario}\n\n`;
      
      out += `=======================================================================\n`;
      
      // Incomes
      record.incomes.forEach(i => {
        out += `+${padRight(i.id, 12)} ${padLeft(formatNum(i.amount), 10)}\n`;
      });
      
      // Deductions
      record.deductions.forEach(d => {
        out += `-${padRight(d.id, 12)} ${padLeft(formatNum(d.amount), 10)}\n`;
      });

      out += `\n\n\n\n\n`;
      out += `=======================================================================\n`;
      out += `T-REMUN      ${padLeft(formatNum(record.tRemun), 9)} T-DSCTO      ${padLeft(formatNum(record.tDscto), 9)}  T-LIQUI     ${padLeft(formatNum(record.tLiqui), 9)}\n`;
      out += `MImponible   ${padLeft(formatNum(record.mImponible), 9)}\n`;
      out += `Mensajes  :\n`;
      out += `Visite la pagina Web del Ministerio de Educación: www.minedu.gob.pe.\n\n`;
      
      const fakeSeq = worker.dni.slice(-3);
      out += `\t\t\t\t\t\t\t\t00000${fakeSeq}\n`;
      out += `.\n`;

      fullTxt += out;

      if (index < activePeriod.records.length - 1) {
        fullTxt += `\n\f\n========================================= SIGUIENTE BOLETA =========================================\n\n`;
      }
    });

    const blob = new Blob([fullTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Boletas_UGEL_Bellavista_${monthLabel}_${yearLabel}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy raw text to clipboard
  const handleCopyToClipboard = () => {
    if (!rawTextBoleta) return;
    navigator.clipboard.writeText(rawTextBoleta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger browser print dialog for the target element
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    // Open a simple window, inject styles and content, print, then close
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("No se pudo abrir el cuadro de impresión. Desactive el bloqueador de ventanas emergentes.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>SISTEMA INTEGRADO DE PLANILLAS CAS - Boleta de Pago</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              color: #111827;
              background: #ffffff;
            }
            pre {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              line-height: 1.4;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .modern-boleta {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .header-print {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #3730a3;
              padding-bottom: 12px;
              margin-bottom: 20px;
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
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          \${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="boleta-viewer-section">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Consultas de Boletas de Pago
          </h2>
          <p className="text-xs text-gray-500">
            Consulte boletas de manera individual por buscador o descargue el consolidado general en un archivo .TXT. Periodo actual: <strong className="text-indigo-700">{activePeriod?.label}</strong>
          </p>
        </div>

        {/* View Mode Toggle & TXT Exporter on Desktop Top */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("text")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer \${viewMode === "text" ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Texto Vintage
            </button>
            <button
              onClick={() => setViewMode("graphic")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer \${viewMode === "graphic" ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Diseño Oficial
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Search list), Right Column (View and Metadata) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Column: Worker Search & Select */}
        <div className="lg:col-span-1 flex flex-col bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-4 h-fit lg:max-h-[800px]">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Buscador</h3>
            <p className="text-[11px] text-gray-400">Filtrar por apellidos, nombres o DNI</p>
          </div>

          {/* Search bar input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:bg-white transition-all font-medium"
            />
          </div>

          {/* List of workers */}
          <div className="overflow-y-auto pr-1 flex-1 space-y-1 max-h-[350px] lg:max-h-[420px] scrollbar-thin">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(rec => (
                <button
                  key={rec.workerId}
                  onClick={() => setSelectedWorkerId(rec.workerId)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 cursor-pointer border \${
                    selectedWorkerId === rec.workerId
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                      : "border-transparent hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="font-bold text-xs truncate">{rec.workerFullName}</span>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                    <span>DNI {rec.workerDni}</span>
                    <span className="font-mono text-gray-700">S/. {rec.tLiqui.toFixed(2)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 italic">
                Ningún resultado encontrado.
              </div>
            )}
          </div>

          {/* Bulk Download Text Button */}
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleDownloadAllTXT}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Descargar las boletas de TODOS los trabajadores de este mes en un solo archivo TXT"
            >
              <Layers className="w-3.5 h-3.5 text-slate-300" /> Descargar Todo (.TXT)
            </button>
          </div>
        </div>

        {/* Display and analytical right Column */}
        <div className="lg:col-span-3 space-y-6">
          {selectedRecord && selectedWorker ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Boleta main visual sheet */}
              <div className="xl:col-span-2 space-y-4">
                {/* Visual state headers */}
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 shadow-2xs">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase px-2 tracking-wider">
                    Boleta de {selectedWorker.nombres}
                  </span>
                  <div className="flex items-center gap-2">
                    {viewMode === "text" && (
                      <button
                        onClick={handleCopyToClipboard}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-500" /> Copiar Texto
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handlePrint}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                    </button>
                  </div>
                </div>

                {/* Main printable paper card */}
                <div 
                  ref={printRef}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-x-auto min-h-[500px]"
                  id="print-sheet-card"
                >
                  {viewMode === "text" ? (
                    <pre className="font-mono text-[11px] text-gray-800 leading-relaxed tracking-tight bg-gray-50/50 p-4 rounded-2xl border border-gray-100 select-all overflow-x-auto whitespace-pre">
                      {rawTextBoleta}
                    </pre>
                  ) : (
                    <div className="modern-boleta border border-gray-200 rounded-2xl p-6 bg-white max-w-4xl mx-auto space-y-6">
                      {/* Header */}
                      <div className="header-print flex items-start justify-between border-b-2 border-indigo-800 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">SISTEMA INTEGRADO DE PLANILLAS CAS</h3>
                          <span className="text-[10px] text-gray-400 uppercase font-mono block">RUC: 10{selectedWorker.dni}-282001</span>
                          <span className="text-xs text-indigo-700 font-semibold">PLANILLA DE REMUNERACIONES - CAS DECRETO LEG. 1057</span>
                        </div>
                        <div className="text-right">
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            {activePeriod?.label}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-mono mt-2">Dcto: Habilitado</span>
                        </div>
                      </div>

                      {/* Personal Bio Data grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs pb-5 border-b border-gray-100">
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Apellidos y Nombres:</span>
                          <span className="font-bold text-gray-800">{selectedWorker.apellidos}, {selectedWorker.nombres}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Documento Identidad (DNI):</span>
                          <span className="font-bold font-mono text-gray-800">{selectedWorker.dni}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Cargo Desempeñado:</span>
                          <span className="font-bold text-gray-800 truncate max-w-[200px]" title={selectedWorker.cargo}>{selectedWorker.cargo}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Establecimiento / Sede:</span>
                          <span className="font-bold text-gray-800 truncate max-w-[200px]" title={selectedWorker.establecimiento}>{selectedWorker.establecimiento}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Fecha Nacimiento:</span>
                          <span className="font-bold text-gray-800">{selectedWorker.fechaNacimiento || "No Registrado"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Fecha Ingreso / Término:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{selectedWorker.fechaIngreso} al {selectedWorker.fechaTermino}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Régimen Pensionario:</span>
                          <span className="font-bold text-gray-800">{selectedWorker.regimenPensionario}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Cuenta de Ahorros:</span>
                          <span className="font-bold text-gray-800 font-mono">{selectedWorker.ctaAhorro || "Ninguna"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Código ESSALUD:</span>
                          <span className="font-bold text-gray-800 font-mono">{selectedWorker.essalud}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400 font-medium">Leyenda Permanente:</span>
                          <span className="font-bold text-gray-700 text-[11px]">{selectedWorker.leyendaPermanente}</span>
                        </div>
                      </div>

                      {/* Financial Breakdown Table Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Incomes table */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block border-b border-indigo-100 pb-1">
                            I. Conceptos de Ingresos (Remuneración)
                          </span>
                          <table className="print-table w-full">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th className="text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.incomes.map(i => (
                                <tr key={i.id}>
                                  <td className="font-mono text-gray-500 font-semibold">{i.id}</td>
                                  <td className="text-gray-700">{i.name}</td>
                                  <td className="text-right font-mono font-bold text-gray-900">S/. {i.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Deductions table */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-red-800 uppercase tracking-wider block border-b border-red-100 pb-1">
                            II. Conceptos de Egresos (Descuentos)
                          </span>
                          <table className="print-table w-full">
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th className="text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.deductions.map(d => (
                                <tr key={d.id}>
                                  <td className="font-mono text-gray-500 font-semibold">{d.id}</td>
                                  <td className="text-gray-700">{d.name}</td>
                                  <td className="text-right font-mono font-bold text-red-600">S/. {d.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                              {selectedRecord.deductions.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center text-gray-400 italic py-4">No tiene descuentos este mes</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Totals Summary blocks */}
                      <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-medium border border-gray-100 mt-6">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase">Monto Imponible</span>
                          <span className="text-sm font-bold text-gray-800 block">S/. {selectedRecord.mImponible.toFixed(2)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase">Total Remuneraciones (Ingreso)</span>
                          <span className="text-sm font-bold text-gray-800 block">S/. {selectedRecord.tRemun.toFixed(2)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase">Total Descuentos (Egreso)</span>
                          <span className="text-sm font-bold text-red-600 block">S/. {selectedRecord.tDscto.toFixed(2)}</span>
                        </div>
                        <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50 space-y-0.5">
                          <span className="text-[10px] text-indigo-600 uppercase font-semibold">Neto Líquido a Recibir</span>
                          <span className="text-base font-bold text-indigo-800 block">S/. {selectedRecord.tLiqui.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Signatures and Stamp print-only block */}
                      <div className="print-signatures pt-12 flex justify-between items-end px-4">
                        {/* Thumb stamp */}
                        <div className="stamp-box border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-2 text-gray-300 text-[10px]">
                          HUELLA DIGITAL
                        </div>

                        {/* Employee signature */}
                        <div className="sig-box border-t border-dashed border-gray-400 text-center pt-2 text-[10px] text-gray-500 w-48">
                          Firma del Trabajador<br />
                          DNI: {selectedWorker.dni}
                        </div>

                        {/* Director stamp */}
                        <div className="sig-box border-t border-dashed border-gray-400 text-center pt-2 text-[10px] text-gray-500 w-48">
                          Responsable de Planillas<br />
                          SISTEMA INTEGRADO DE PLANILLAS CAS
                        </div>
                      </div>

                      {/* Footer message */}
                      <div className="text-center pt-6 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
                        "Visite la pagina Web del Ministerio de Educación: www.minedu.gob.pe."
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Details Side Card */}
              <div className="space-y-6" id="boleta-sidebar-meta">
                {/* Quick check metadata card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm">Resumen Analítico</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Ingresos:</span>
                      <span className="font-bold text-gray-800">S/. {selectedRecord.tRemun.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Descuento Pensión:</span>
                      <span className="font-semibold text-red-500">
                        S/. {(selectedRecord.deductions.find(d => d.id === "SPP" || d.id === "SNP")?.amount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Otros Descuentos:</span>
                      <span className="font-semibold text-red-500">
                        S/. {selectedRecord.deductions
                          .filter(d => d.id !== "SPP" && d.id !== "SNP")
                          .reduce((sum, d) => sum + d.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                      <span className="text-gray-800">Neto Líquido:</span>
                      <span className="text-green-700">S/. {selectedRecord.tLiqui.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Print Help Guidelines Card */}
                <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50 space-y-3">
                  <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Instrucciones de Impresión
                  </h4>
                  <div className="text-xs text-indigo-800 space-y-2 leading-relaxed">
                    <p>
                      Para una impresión física oficial o exportación limpia a archivo PDF:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Seleccione el modo <strong>"Diseño Oficial"</strong> para emitir un voucher corporativo.</li>
                      <li>Haga clic en <strong>"Imprimir / PDF"</strong> para abrir el cuadro de diálogo.</li>
                      <li>En las opciones de su navegador, configure:
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[11px] text-indigo-700">
                          <li><strong>Márgenes:</strong> Ninguno u "Original".</li>
                          <li><strong>Gráficos de fondo:</strong> "Habilitar".</li>
                          <li><strong>Destino:</strong> Guardar como PDF o su impresora local.</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-2xs" id="no-worker-selected-boleta">
              <p className="text-gray-400">Seleccione un trabajador de la lista de búsqueda para generar su boleta de pago.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
