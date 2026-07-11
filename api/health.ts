import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const rows = await sql`SELECT now() AS fecha, current_database() AS bd`;
    return res.status(200).json({ ok: true, ...rows[0] });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
