export function firstIssueMessage(error: { issues: Array<{ message: string }> }) {
  const message = error.issues[0]?.message ?? "";
  return /[က-႟]/.test(message) ? message : "invalid_input";
}

/** Drizzle wraps D1 failures in a query error whose `cause` carries the SQLite constraint message. */
export function isUniqueViolation(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    if (/UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(current.message)) return true;
    current = current.cause;
  }
  return false;
}
