import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getAuth } from "../../../lib/request-auth";



async function getLimit(pool: any, userId: string, key: string, fallback: any) {
  // get user's latest subscription plan
  const sub = await pool.query(
    `SELECT s.plan_id
     FROM subscriptions s
     WHERE s.user_id=$1
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (!sub.rowCount) return fallback;

  const planId = sub.rows[0].plan_id;
  const lim = await pool.query(
    `SELECT value_json FROM plan_limits WHERE plan_id=$1 AND key=$2 LIMIT 1`,
    [planId, key]
  );
  if (!lim.rowCount) return fallback;
  return lim.rows[0].value_json;
}

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);
    const pool = getPool();

    const res = await pool.query(
      `SELECT id, name, default_epsg, created_at
       FROM projects
       WHERE owner_id=$1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ ok: true, projects: res.rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req);
    const body = await req.json();
    const name = String(body.name || "").trim();
    const default_epsg = Number(body.default_epsg || 4326);

    if (!name) {
      return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    }

    const pool = getPool();

    // enforce max_projects limit
    const maxProjects = await getLimit(pool, userId, "max_projects", 2);
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM projects WHERE owner_id=$1`,
      [userId]
    );
    const count = countRes.rows[0].c as number;

    if (count >= Number(maxProjects)) {
      return NextResponse.json(
        { ok: false, error: `Project limit reached (${count}/${maxProjects}).` },
        { status: 403 }
      );
    }

    const created = await pool.query(
      `INSERT INTO projects (owner_id, name, default_epsg)
       VALUES ($1, $2, $3)
       RETURNING id, name, default_epsg, created_at`,
      [userId, name, default_epsg]
    );

    return NextResponse.json({ ok: true, project: created.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 401 });
  }
}
