export type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || "debug";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (levelOrder[level] < levelOrder[envLevel]) return;
  const payload = { level, message, ts: new Date().toISOString(), ...context };
  // eslint-disable-next-line no-console
  console[level === "debug" ? "log" : level]("[app]", payload);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => log("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => log("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => log("error", m, c),
};


