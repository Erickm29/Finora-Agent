import type { ProviderName } from "./types.js";

export class ProviderError extends Error {
  readonly status: number | null;
  readonly provider: ProviderName | null;
  readonly retriable: boolean;

  constructor(
    message: string,
    opts: {
      status?: number | null;
      provider?: ProviderName | null;
      retriable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "ProviderError";
    this.status = opts.status ?? null;
    this.provider = opts.provider ?? null;
    this.retriable = opts.retriable ?? false;
  }
}

export class AllProvidersFailedError extends Error {
  readonly failures: Array<{ provider: ProviderName; model?: string; error: string }>;

  constructor(
    failures: Array<{ provider: ProviderName; model?: string; error: string }>,
  ) {
    const summary = failures
      .map((f) => `${f.provider}${f.model ? `/${f.model}` : ""}: ${f.error}`)
      .join("; ");
    super(`All AI providers failed. ${summary}`);
    this.name = "AllProvidersFailedError";
    this.failures = failures;
  }
}

const FAILOVER_STATUSES = new Set([429, 500, 502, 503]);

/**
 * True only for infrastructure / quota / rate-limit style failures.
 * Programming errors, 400 validation, auth misconfig (401/403) do NOT failover
 * unless the message clearly indicates quota exceeded.
 */
export function isFailoverError(err: unknown): boolean {
  if (err instanceof ProviderError) {
    return err.retriable;
  }

  const status = extractStatus(err);
  const msg = errorMessage(err).toLowerCase();

  if (status !== null && FAILOVER_STATUSES.has(status)) return true;

  if (
    /rate.?limit|quota.?exceed|too many requests|resource.?exhausted/i.test(msg)
  ) {
    return true;
  }

  if (
    /timeout|etimedout|econnreset|econnrefused|enotfound|fetch failed|network|socket hang up/i.test(
      msg,
    )
  ) {
    return true;
  }

  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: unknown }).code).toLowerCase();
    if (
      ["etimedout", "econnreset", "econnrefused", "enotfound", "eai_again"].includes(
        code,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  if ("status" in err && typeof (err as { status: unknown }).status === "number") {
    return (err as { status: number }).status;
  }
  if (
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
  ) {
    return (err as { statusCode: number }).statusCode;
  }
  const msg = errorMessage(err);
  const m = msg.match(/\b(429|500|502|503|401|403|400)\b/);
  return m ? Number(m[1]) : null;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function toProviderError(
  err: unknown,
  provider: ProviderName,
): ProviderError {
  if (err instanceof ProviderError) return err;
  const status = extractStatus(err);
  const retriable = isFailoverError(err);
  return new ProviderError(errorMessage(err).slice(0, 400), {
    status,
    provider,
    retriable,
    cause: err,
  });
}
