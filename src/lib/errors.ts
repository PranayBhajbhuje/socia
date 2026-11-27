export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /unique constraint|unique violation|already exists/i.test(error.message);
}
