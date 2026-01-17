import { getPool } from "@/lib/db";

export async function ensureDemoSubscription(userId: string) {
  const pool = getPool();

  const demoPlan = await pool.query(
    "SELECT id FROM plans WHERE name='demo' LIMIT 1"
  );
  const planId = demoPlan.rows?.[0]?.id;
  if (!planId) throw new Error("Demo plan not found");

  const existing = await pool.query(
    "SELECT id FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  if (existing.rowCount) return existing.rows[0].id;

  const demoDays = Number(process.env.DEMO_TRIAL_DAYS || "7");
  const trialEnds = new Date(Date.now() + demoDays * 24 * 60 * 60 * 1000);

  const created = await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, trial_ends_at)
     VALUES ($1, $2, 'trial', $3)
     RETURNING id`,
    [userId, planId, trialEnds.toISOString()]
  );

  return created.rows[0].id;
}
