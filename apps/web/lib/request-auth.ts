import { verifyToken } from "./auth";

export function getAuth(req: Request): { userId: string; role: string } {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("Missing Authorization: Bearer <token>");
  const token = m[1];
  const payload = verifyToken(token);
  return { userId: payload.userId, role: payload.role };
}
