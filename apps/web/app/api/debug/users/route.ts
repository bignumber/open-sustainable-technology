import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const pool = getPool();

  const info = await pool.query(`
    SELECT current_database() as db,
           current_user as usr,
           current_schema() as schema
  `);

  const users = await pool.query(`
    SELECT id, email, created_at
    FROM users
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 10
  `);

  const columns = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users'
    ORDER BY ordinal_position
  `);

  return NextResponse.json({
    connection: info.rows[0],
    columns: columns.rows,
    users: users.rows,
  });
}
