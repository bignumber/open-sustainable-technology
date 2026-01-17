import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// İstersen geriye uyumluluk için bunu da bırak:
export const getPool = () => pool;
