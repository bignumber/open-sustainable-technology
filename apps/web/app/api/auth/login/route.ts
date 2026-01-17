import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { ensureDemoSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const pool = getPool();

    const res = await pool.query(
      "SELECT id, password_hash, role FROM users WHERE email=$1",
      [email]
    );
    if (!res.rowCount) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const user = res.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    await ensureDemoSubscription(user.id);
    const token = signToken({ userId: user.id, role: user.role });

    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
