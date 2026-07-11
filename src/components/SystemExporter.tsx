import React, { useState, useMemo } from "react";
import { Worker, PayrollPeriod, PayrollRecordItem } from "../types";
import { 
  Download, 
  Upload, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Database, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  ArrowDownToLine,
  Shuffle,
  DownloadCloud,
  Trash2
} from "lucide-react";

interface SystemExporterProps {
  workers: Worker[];
  periods: PayrollPeriod[];
  currentPeriodId: string;
  onRestoreDatabase: (backupData: { workers: Worker[]; periods: PayrollPeriod[] }) => void;
  onResetDatabase: () => void;
  onClearDatabase?: () => void;
}

export default function SystemExporter({
  workers,
  periods,
  currentPeriodId,
  onRestoreDatabase,
  onResetDatabase,
  onClearDatabase
}: SystemExporterProps) {
  const [copiedMatrix, setCopiedMatrix] = useState(false);
  const [copiedPlame, setCopiedPlame] = useState(false);
  const [downloadingHTML, setDownloadingHTML] = useState(false);

  const isStandalone = typeof window !== "undefined" && (window as any).__STANDALONE__ === true;
  
  const handleDownloadStandaloneHTML = async () => {
    setDownloadingHTML(true);
    try {
      const response = await fetch("/UGEL_Bellavista_Sistema_Local.html");
      if (!response.ok) {
        throw new Error("No se pudo obtener la plantilla del sistema autónomo.");
      }
      let htmlText = await response.text();

      const openScript = "<" + "script>";
      const closeScript = "</" + "script>";
      const scriptTagPattern = "</" + "script>";
      const scriptTagReplacement = "<\\/" + "script>";

      // Pre-load user's live state on export so the downloaded file starts exactly with their current data
      const stateInjection = `
  ${openScript}
    // PRE-CARGA DE BASE DE DATOS LOCAL EXPORTADA
    localStorage.setItem("ugel_workers_v1", JSON.stringify(${JSON.stringify(workers).replace(new RegExp(scriptTagPattern, "g"), scriptTagReplacement)}));
    localStorage.setItem("ugel_periods_v1", JSON.stringify(${JSON.stringify(periods).replace(new RegExp(scriptTagPattern, "g"), scriptTagReplacement)}));
    localStorage.setItem("ugel_current_period_id_v1", JSON.stringify("${currentPeriodId}"));
    window.__STANDALONE__ = true;
  ${closeScript}
`;

      // Find the tag <div id="root"></div> and inject the state script right after it
      htmlText = htmlText.replace('<div id="root"></div>', `<div id="root"></div>\n${stateInjection}`);

      // Download the file
      const blob = new Blob([htmlText], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `UGEL_Bellavista_Sistema_Planillas_${activePeriod?.id || "Local"}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al generar la aplicación autónoma: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingHTML(false);
    }
  };
  
  // Active period
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === currentPeriodId) || periods[0];
  }, [periods, currentPeriodId]);

  // Formats matrix for copy-pasting directly into Excel
  const tabDelimitedMatrix = useMemo(() => {
    if (!activePeriod) return "";

    // Header columns
    const headers = [
      "DNI", "Apellidos", "Nombres", "Cargo", "Sede", "Pensión", 
      "Sueldo RM", "DS 311", "DS 313", "DS 265", "DS 279", "DS 317/327", "Reintegro",
      "Total Remuneracion", "Desc Pension (AFP/ONP)", "Coop SCB", "Tardanza", "Sub Cafae", "Faltas",
      "Total Descuento", "Neto Liquido"
    ];

    let out = headers.join("\t") + "\n";

    activePeriod.records.forEach(r => {
      const rm = r.incomes.find(i => i.id === "RM")?.amount || 0;
      const ds311 = r.incomes.find(i => i.id === "DS311")?.amount || 0;
      const ds313 = r.incomes.find(i => i.id === "DS313")?.amount || 0;
      const ds265 = r.incomes.find(i => i.id === "DS265")?.amount || 0;
      const ds279 = r.incomes.find(i => i.id === "DS279")?.amount || 0;
      const ds317_327 = (r.incomes.find(i => i.id === "DS317")?.amount || 0) + (r.incomes.find(i => i.id === "DS327")?.amount || 0);
      const reint = r.incomes.find(i => i.id === "Reintegro")?.amount || 0;

      const pension = r.deductions.find(d => d.id === "SPP" || d.id === "SNP")?.amount || 0;
      const coop = r.deductions.find(d => d.id === "COOP_SCB")?.amount || 0;
      const tard = r.deductions.find(d => d.id === "TARDANZA")?.amount || 0;
      const cafae = r.deductions.find(d => d.id === "SUBCAFAE")?.amount || 0;
      const faltas = r.deductions.find(d => d.id === "FALTAS")?.amount || 0;

      const row = [
        r.workerDni,
        r.workerFullName.split(",")[0], // Apellidos
        r.workerFullName.split(",")[1]?.trim() || "", // Nombres
        r.workerCargo,
        r.workerEstablecimiento,
        r.workerRegimenPensionario,
        rm.toFixed(2),
        ds311.toFixed(2),
        ds313.toFixed(2),
        ds265.toFixed(2),
        ds279.toFixed(2),
        ds317_327.toFixed(2),
        reint.toFixed(2),
        r.tRemun.toFixed(2),
        pension.toFixed(2),
        coop.toFixed(2),
        tard.toFixed(2),
        cafae.toFixed(2),
        faltas.toFixed(2),
        r.tDscto.toFixed(2),
        r.tLiqui.toFixed(2)
      ];

      out += row.join("\t") + "\n";
    });

    return out;
  }, [activePeriod]);

  // Formats for PDT PLAME SUNAT structural import (pipe-separated values)
  // Format matches: DNI | Concept_Code | Value
  const plameStructureText = useMemo(() => {
    if (!activePeriod) return "";
    let out = "";
    activePeriod.records.forEach(r => {
      // Map standard PLAME Concept codes:
      // 0121 = Remuneracion CAS (Decreto Leg 1057)
      // 0605 = Aporte Obligatorio AFP
      // 0607 = Comision sobre Flujo
      // 0608 = Prima de Seguro
      // 0601 = SNP / ONP
      const rmVal = r.incomes.find(i => i.id === "RM")?.amount || 0;
      out += `${r.workerDni}|0121|${rmVal.toFixed(2)}|0.00|0.00|\n`;
      
      const snpVal = r.deductions.find(d => d.id === "SNP")?.amount || 0;
      if (snpVal > 0) {
        out += `${r.workerDni}|0601|${snpVal.toFixed(2)}|0.00|0.00|\n`;
      }
      
      const sppVal = r.deductions.find(d => d.id === "SPP")?.amount || 0;
      if (sppVal > 0) {
        // Obligatorio, Seguro y Comision aggregated
        out += `${r.workerDni}|0608|${sppVal.toFixed(2)}|0.00|0.00|\n`;
      }
    });
    return out;
  }, [activePeriod]);

  // Download complete database JSON backup
  const handleDownloadBackup = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      workers,
      periods
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UGEL_BELLAVISTA_PLANILLAS_BACKUP_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Upload database JSON backup
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.workers || !parsed.periods) {
          alert("El archivo no tiene el formato de copia de seguridad válido de este sistema.");
          return;
        }

        if (confirm("¿Está seguro de que desea restaurar esta copia de seguridad? Se reemplazarán todos los trabajadores y periodos históricos actuales.")) {
          onRestoreDatabase({
            workers: parsed.workers,
            periods: parsed.periods
          });
          alert("Base de datos restaurada con éxito.");
        }
      } catch (err) {
        alert("Ocurrió un error al leer el archivo JSON de copia de seguridad.");
      }
    };
    reader.readAsText(file);
  };

  // Handle system resetting
  const handleResetSystem = () => {
    if (confirm("¿Está absolutamente seguro de que desea reiniciar la base de datos? Se borrarán todos los cambios que haya hecho y se volverá a cargar la planilla de Junio de 2026 inicial con sus 98 trabajadores de demostración.")) {
      onResetDatabase();
      alert("Sistema reiniciado a la configuración inicial.");
    }
  };

  // Handle complete database clearance (starts from blank)
  const handleClearSystem = () => {
    if (confirm("¿Está ABSOLUTAMENTE seguro de que desea borrar todos los datos generales (todos los trabajadores, planillas históricas y boletas)? El sistema se reiniciará completamente en blanco para que empiece de cero. Esta acción es irreversible.")) {
      if (onClearDatabase) {
        onClearDatabase();
        alert("Base de datos borrada con éxito. Iniciando sistema vacío.");
      } else {
        alert("El método de limpieza total no está configurado.");
      }
    }
  };

  // Copy matrix
  const handleCopyMatrix = () => {
    navigator.clipboard.writeText(tabDelimitedMatrix);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  // Copy plame
  const handleCopyPlame = () => {
    navigator.clipboard.writeText(plameStructureText);
    setCopiedPlame(true);
    setTimeout(() => setCopiedPlame(false), 2000);
  };

  // Download CSV file helper
  const handleDownloadCsv = () => {
    if (!activePeriod) return;

    // Convert tabmatrix to comma matrix (or semicolon for Spanish Excel)
    const semicolonDelimited = tabDelimitedMatrix.replace(/\t/g, ";");
    
    // Add UTF-8 BOM so Excel opens special characters (like Accents/Ñ) correctly
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + semicolonDelimited], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Planilla_${activePeriod.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="exporter-section">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Exportación de Planillas y Copias de Resguardo</h2>
        <p className="text-sm text-gray-500">Conecte y suba datos a sus otros sistemas de planillas e importaciones de SUNAT</p>
      </div>

      {/* Grid: 2 Export Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="exports-methods-grid">
        {/* Export Method 1: Excel integration */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5" id="excel-export-card">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Integración y Reportes de Excel / Google Sheets</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Consiga el informe detallado de la planilla de <strong>{activePeriod?.label}</strong>. Todas las bonificaciones CAS y retenciones de pensión se estructuran como columnas independientes en formato de tabla para que las analice, ordene o pegue en sus hojas de cálculo corporativas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleDownloadCsv}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Descargar Planilla CSV (Semicolons)
            </button>
            <button
              onClick={handleCopyMatrix}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedMatrix ? (
                <>
                  <Check className="w-4 h-4 text-green-600" /> ¡Copiado para Excel!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" /> Copiar Matriz (Tab-Delimited)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Method 2: PDT PLAME Import files */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5" id="plame-export-card">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Shuffle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Estructura PDT PLAME (SUNAT)</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Formateador pipe-separated de remuneraciones y aportes. Puede copiar este formato estructurado para alimentar las plantillas de PDT SUNAT (conceptos de Remuneración CAS 0121, ONP 0601, y Seguro AFP 0608).
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleCopyPlame}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedPlame ? (
                <>
                  <Check className="w-4 h-4 text-green-300" /> ¡Estructura Copiada!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-200" /> Copiar PDT Estructurado
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Offline HTML Export Card */}
      {!isStandalone && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300" id="standalone-export-card">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="bg-blue-200/50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  Exclusivo para Navegador
                </span>
                <h3 className="font-bold text-gray-800 text-lg mt-0.5">Exportar Aplicación Autónoma de Planillas (HTML Fuera de Línea)</h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pl-12">
              Descargue el sistema completo como un <strong>único archivo HTML autónomo</strong>. El archivo resultante contendrá toda la lógica de cálculo, la planilla activa, el histórico mensual, el visor de boletas de pago, e incorporará automáticamente todos los trabajadores con sus cambios actuales. Funciona 100% fuera de línea (sin internet) en cualquier computadora.
            </p>
          </div>
          <div className="md:self-center self-start pl-12 md:pl-0">
            <button
              onClick={handleDownloadStandaloneHTML}
              disabled={downloadingHTML}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {downloadingHTML ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generando Aplicación...
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" /> Descargar Sistema Autónomo (.html)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Database Security row (Backup & Restore) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6" id="database-backup-panel">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" /> Resguardo de Base de Datos y Datos Históricos
          </h3>
          <p className="text-xs text-gray-500">
            Debido a que este sistema opera localmente, un borrado accidental de la memoria caché de su navegador podría reiniciar los datos. Le sugerimos descargar periódicamente copias de seguridad de sus planillas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50" id="backup-actions-grid">
          {/* Action 1: Download */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-700 uppercase">1. Descargar Backup</h4>
              <p className="text-xs text-gray-400">Guarde un archivo JSON con todo su personal master y planillas procesadas.</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-start"
            >
              <ArrowDownToLine className="w-4 h-4 text-gray-500" /> Descargar Archivo JSON
            </button>
          </div>

          {/* Action 2: Restore */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-700 uppercase">2. Cargar Backup</h4>
              <p className="text-xs text-gray-400">Suba un archivo JSON descargado previamente para restaurar el histórico.</p>
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleUploadBackup}
                className="hidden" 
                id="file-backup-uploader"
              />
              <label 
                htmlFor="file-backup-uploader"
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-start inline-block"
              >
                <Upload className="w-4 h-4 text-gray-500" /> Seleccionar Archivo Backup
              </label>
            </div>
          </div>

          {/* Action 3: Reset */}
          <div className="bg-red-50/20 p-4 rounded-xl border border-red-100/50 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-800 uppercase">3. Restablecer / Borrar</h4>
              <p className="text-xs text-red-500">
                Seleccione si desea borrar todo para empezar un sistema en blanco, o reinstalar los 98 trabajadores de demostración.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleClearSystem}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-4 h-4" /> Vaciar Todo (Iniciar en Blanco)
              </button>
              <button
                onClick={handleResetSystem}
                className="w-full bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-4 h-4 text-red-500" /> Cargar Plantilla (98 CAS)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
