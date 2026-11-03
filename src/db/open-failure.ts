/**
 * Why the database refused to open, as far as the app can honestly tell.
 * `blocked` and `quota` are detected; a version mismatch, a corrupt database
 * and everything else collapse into `unknown` rather than inventing a cause.
 */
export type OpenFailureCause = "blocked" | "quota" | "unknown";

export class DatabaseOpenError extends Error {
  readonly reason: OpenFailureCause;

  constructor(reason: OpenFailureCause, message?: string, options?: ErrorOptions) {
    super(message ?? `The database could not be opened (${reason}).`, options);
    this.name = "DatabaseOpenError";
    this.reason = reason;
  }
}

function isNamed(error: unknown, name: string): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === name;
}

export function openFailureCause(error: unknown): OpenFailureCause {
  if (error instanceof DatabaseOpenError) return error.reason;
  if (isNamed(error, "QuotaExceededError")) return "quota";
  return "unknown";
}

/** Wraps whatever IndexedDB threw, keeping a cause that is already named. */
export function toOpenFailure(error: unknown): DatabaseOpenError {
  return error instanceof DatabaseOpenError
    ? error
    : new DatabaseOpenError(openFailureCause(error), undefined, { cause: error });
}
