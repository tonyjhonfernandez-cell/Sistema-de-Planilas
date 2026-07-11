import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT e.*, c.numero_contrato, c.remuneracion_mensual, c.estado AS estado_contrato
        FROM empleados e
        LEFT JOIN LATERAL (
          SELECT * FROM contratos_cas c
          WHERE c.empleado_id = e.id
          ORDER BY c.fecha_inicio DESC LIMIT 1
        ) c ON TRUE
        ORDER BY e.apellido_paterno, e.apellido_materno`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body ?? {};
      if (!b.dni || !b.apellido_paterno || !b.apellido_materno || !b.nombres) {
        return res.status(400).json({ error: 'Campos obligatorios: dni, apellido_paterno, apellido_materno, nombres' });
      }
      const rows = await sql`
        INSERT INTO empleados (dni, apellido_paterno, apellido_materno, nombres,
          fecha_nacimiento, sexo, direccion, telefono, email,
          regimen_pensionario, afp_nombre, cuspp, banco, cuenta_bancaria, cci)
        VALUES (${b.dni}, ${b.apellido_paterno}, ${b.apellido_materno}, ${b.nombres},
          ${b.fecha_nacimiento ?? null}, ${b.sexo ?? null}, ${b.direccion ?? null},
          ${b.telefono ?? null}, ${b.email ?? null},
          ${b.regimen_pensionario ?? 'ONP'}, ${b.afp_nombre ?? null}, ${b.cuspp ?? null},
          ${b.banco ?? null}, ${b.cuenta_bancaria ?? null}, ${b.cci ?? null})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
