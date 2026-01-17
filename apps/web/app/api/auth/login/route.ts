import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const pool = getPool(); // ✅ burada al
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, userId: result.rows[0].id });
  } catch (err: any) {
    console.error("LOGIN_ERROR:", err);
    return NextResponse.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
