import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const emailNorm = String(email ?? "").trim().toLowerCase();
    const passwordStr = String(password ?? "");

    if (!emailNorm || !passwordStr) {
      return NextResponse.json({ error: "email ve password zorunlu" }, { status: 400 });
    }

    const pool = getPool();

    const exists = await pool.query(
      "SELECT 1 FROM users WHERE lower(email) = $1",
      [emailNorm]
    );
    if (exists.rowCount > 0) {
      return NextResponse.json({ error: "Bu email zaten kayıtlı" }, { status: 409 });
    }

    const hash = await hashPassword(passwordStr);

    // role/is_active default'ları DB'de varsa eklemene gerek yok
    await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
      [emailNorm, hash]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("REGISTER_ERROR:", err);
    return NextResponse.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
