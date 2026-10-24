// Best-effort limits for the public demo: per IP per hour, plus a daily cap
// across everyone. In-memory, so each server instance counts on its own;
// enough to stop a script from draining the Claude budget.

const PER_IP_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR ?? 6);
const PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY ?? 300);

const hits = new Map<string, number[]>();
let day = "";
let dayCount = 0;

export function checkRateLimit(ip: string): { ok: true } | { ok: false; message: string } {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
    hits.clear();
  }

  if (dayCount >= PER_DAY) {
    return { ok: false, message: "The demo has reached today's limit. Please try again tomorrow." };
  }

  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= PER_IP_PER_HOUR) {
    return { ok: false, message: "You've run the agent several times this hour. Please try again a bit later." };
  }

  recent.push(now);
  hits.set(ip, recent);
  dayCount++;
  return { ok: true };
}
