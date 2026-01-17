import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query("SELECT postgis_full_version()");
    return NextResponse.json({
      ok: true,
      postgis: res.rows[0].postgis_full_version
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
