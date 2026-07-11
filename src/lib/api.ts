import { Worker, PayrollPeriod } from "../types";

export interface EstadoRemoto {
  workers: Worker[] | null;
  periods: PayrollPeriod[] | null;
  currentPeriodId: string | null;
}

// Carga el estado completo del sistema desde Neon (via /api/estado)
export async function loadEstado(): Promise<EstadoRemoto | null> {
  const res = await fetch("/api/estado");
  if (!res.ok) return null;
  return res.json();
}

// Sincronización con debounce: agrupa cambios y los envía a Neon
let pending: Partial<EstadoRemoto> = {};
let timer: ReturnType<typeof setTimeout> | null = null;

export function syncEstado(cambios: Partial<EstadoRemoto>) {
  Object.assign(pending, cambios);
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const body = pending;
    pending = {};
    timer = null;
    try {
      await fetch("/api/estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("Error sincronizando con la base de datos", e);
    }
  }, 800);
}

// Borra todo el estado guardado en Neon (para reset del sistema)
export async function clearEstadoRemoto(): Promise<void> {
  try {
    await fetch("/api/estado", { method: "DELETE" });
  } catch (e) {
    console.error("Error limpiando la base de datos", e);
  }
}
