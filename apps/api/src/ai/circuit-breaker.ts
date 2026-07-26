export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
}

interface CircuitEntry {
  failures: number;
  openedAt: number | null;
  state: CircuitState;
}

/**
 * Simple per-provider circuit breaker (in-process).
 * closed → open after failureThreshold failures; after cooldown → half_open (1 probe).
 */
export class CircuitBreaker {
  private readonly entries = new Map<string, CircuitEntry>();

  constructor(private readonly opts: CircuitBreakerOptions) {}

  canRequest(key: string): boolean {
    const entry = this.ensure(key);
    if (entry.state === "closed") return true;
    if (entry.state === "half_open") return true;
    if (entry.state === "open" && entry.openedAt !== null) {
      if (Date.now() - entry.openedAt >= this.opts.cooldownMs) {
        entry.state = "half_open";
        return true;
      }
      return false;
    }
    return false;
  }

  recordSuccess(key: string): void {
    this.entries.set(key, { failures: 0, openedAt: null, state: "closed" });
  }

  recordFailure(key: string): void {
    const entry = this.ensure(key);
    if (entry.state === "half_open") {
      entry.state = "open";
      entry.openedAt = Date.now();
      entry.failures = this.opts.failureThreshold;
      return;
    }
    entry.failures += 1;
    if (entry.failures >= this.opts.failureThreshold) {
      entry.state = "open";
      entry.openedAt = Date.now();
    }
  }

  getState(key: string): CircuitState {
    this.canRequest(key); // advance open → half_open if cooled down
    return this.ensure(key).state;
  }

  private ensure(key: string): CircuitEntry {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { failures: 0, openedAt: null, state: "closed" };
      this.entries.set(key, entry);
    }
    return entry;
  }
}
