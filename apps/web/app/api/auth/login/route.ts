import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const emailNorm = String(email ?? "").trim().toLowerCase();
    const passwordStr = String(password ?? "");

    if (!emailNorm || !passwordStr) {
      return NextResponse.json({ ok: false, error: "email ve password zorunlu" }, { status: 400 });
    }

    const pool = getPool();

    const result = await pool.query(
      "SELECT id, email, password_hash, role, is_active FROM users WHERE lower(email) = $1 LIMIT 1",
      [emailNorm]
    );

    // ✅ Güvenlik: kullanıcı var/yok bilgisini sızdırma
    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Email veya şifre hatalı" }, { status: 401 });
    }

    const user = result.rows[0];

    // ✅ 1) is_active kontrolü (istediğin madde)
    if (user.is_active === false) {
      return NextResponse.json({ ok: false, error: "Hesap pasif" }, { status: 403 });
    }

    // ✅ 2) şifre kontrolü
    const ok = await verifyPassword(passwordStr, user.password_hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Email veya şifre hatalı" }, { status: 401 });
    }

    // ✅ 3) token
    const token = await Promise.resolve(signToken({ userId: user.id, role: user.role }));

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

    // ✅ httpOnly cookie
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error("LOGIN_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
