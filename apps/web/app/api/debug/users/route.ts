import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const pool = getPool();

  // Hangi DB'ye bağlıyız? (db adı + current schema)
  const info = await pool.query(`
    SELECT current_database() as db,
           current_user as usr,
           current_schema() as schema
  `);

  // Son eklenen 5 kullanıcıyı getir
  const users = await pool.query(`
    SELECT id, email, created_at
    FROM users
    ORDER BY id DESC
    LIMIT 5
  `);

  return NextResponse.json({
    connection: info.rows[0],
    users: users.rows,
  });
}
