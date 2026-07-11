import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT p.id, p.descripcion, p.estado, p.fecha_proceso,
               pe.anio, pe.mes,
               COUNT(d.id) AS num_empleados,
               COALESCE(SUM(d.neto_pagar), 0) AS total_neto
        FROM planillas p
        JOIN periodos pe ON pe.id = p.periodo_id
        LEFT JOIN planilla_detalle d ON d.planilla_id = p.id
        GROUP BY p.id, pe.anio, pe.mes
        ORDER BY pe.anio DESC, pe.mes DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { anio, mes, descripcion } = req.body ?? {};
      if (!anio || !mes) return res.status(400).json({ error: 'Campos obligatorios: anio, mes' });
      const periodo = await sql`
        INSERT INTO periodos (anio, mes) VALUES (${anio}, ${mes})
        ON CONFLICT (anio, mes) DO UPDATE SET anio = EXCLUDED.anio
        RETURNING id`;
      const rows = await sql`
        INSERT INTO planillas (periodo_id, descripcion)
        VALUES (${periodo[0].id}, ${descripcion ?? 'PLANILLA CAS'})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
