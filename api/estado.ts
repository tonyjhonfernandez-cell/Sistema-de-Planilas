import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT clave, valor FROM app_state`;
      const map: Record<string, any> = {};
      for (const r of rows) map[r.clave] = r.valor;
      return res.status(200).json({
        workers: map.workers ?? null,
        periods: map.periods ?? null,
        currentPeriodId: map.currentPeriodId ?? null,
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const b = req.body ?? {};
      const claves = ['workers', 'periods', 'currentPeriodId'] as const;
      for (const k of claves) {
        if (k in b) {
          await sql`
            INSERT INTO app_state (clave, valor)
            VALUES (${k}, ${JSON.stringify(b[k])}::jsonb)
            ON CONFLICT (clave)
            DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = now()`;
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM app_state`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
