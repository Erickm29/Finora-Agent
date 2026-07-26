import type { ProviderName } from "./types.js";

export interface ProviderStats {
  calls: number;
  errors: number;
  failovers: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastModel: string | null;
}

export interface AiStatsSnapshot {
  lastProvider: ProviderName | null;
  lastModel: string | null;
  byProvider: Record<ProviderName, ProviderStats>;
}

function emptyStats(): ProviderStats {
  return {
    calls: 0,
    errors: 0,
    failovers: 0,
    totalLatencyMs: 0,
    avgLatencyMs: 0,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastModel: null,
  };
}

export class AiStats {
  private lastProvider: ProviderName | null = null;
  private lastModel: string | null = null;
  private readonly byProvider: Record<ProviderName, ProviderStats> = {
    groq: emptyStats(),
    gemini: emptyStats(),
    openrouter: emptyStats(),
  };

  recordSuccess(provider: ProviderName, model: string, latencyMs: number): void {
    const s = this.byProvider[provider];
    s.calls += 1;
    s.totalLatencyMs += latencyMs;
    s.avgLatencyMs = s.totalLatencyMs / s.calls;
    s.lastSuccessAt = new Date().toISOString();
    s.lastModel = model;
    this.lastProvider = provider;
    this.lastModel = model;
  }

  recordError(provider: ProviderName, failover: boolean): void {
    const s = this.byProvider[provider];
    s.errors += 1;
    s.lastErrorAt = new Date().toISOString();
    if (failover) s.failovers += 1;
  }

  snapshot(): AiStatsSnapshot {
    return {
      lastProvider: this.lastProvider,
      lastModel: this.lastModel,
      byProvider: {
        groq: { ...this.byProvider.groq },
        gemini: { ...this.byProvider.gemini },
        openrouter: { ...this.byProvider.openrouter },
      },
    };
  }
}
