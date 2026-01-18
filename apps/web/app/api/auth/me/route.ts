import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Pool } from "pg";

export const runtime = "nodejs";

const COOKIE_NAME = "session";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET missing");
const key = new TextEncoder().encode(jwtSecret);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type SessionPayload = {
  userId?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

export async function GET() {
  // 1) cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, reason: "no_cookie", user: null }, { status: 401 });
  }

  // 2) jwt verify
  let payload: SessionPayload;
  try {
    const verified = await jwtVerify(token, key);
    payload = verified.payload as unknown as SessionPayload;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_token", user: null }, { status: 401 });
  }

  const userId = String(payload.userId ?? "");
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "no_userId", user: null }, { status: 401 });
  }

  // 3) db user
  try {
    const { rows } = await pool.query(
      "select id, email, role, is_active, created_at from users where id::text = $1 limit 1",
      [userId]
    );

    const user = rows[0] ?? null;
    if (!user) {
      return NextResponse.json({ ok: false, reason: "user_not_found", user: null }, { status: 401 });
    }

    // is_active kontrolü istersen:
    if (user.is_active === false) {
      return NextResponse.json({ ok: false, reason: "inactive_user", user: null }, { status: 403 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "db_error", error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
