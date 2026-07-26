import { env } from "../env.js";

/**
 * Wallbit execute solo tras confirmación humana.
 * Sin cuenta/fondos: stub explícito (registra confirm, no mueve dinero).
 */
export function createWallbitClient() {
  return {
    async executeConvert(payload: Record<string, unknown>) {
      if (!env.wallbitApiKey || !env.wallbitApiUrl) {
        return {
          ok: true,
          result: {
            stub: true,
            provider: "wallbit",
            message:
              "Wallbit aún no está conectado (sin cuenta/fondos). La confirmación quedó registrada; la conversión real se habilita cuando haya API.",
            payload,
          },
        };
      }

      try {
        const res = await fetch(`${env.wallbitApiUrl}/convert`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.wallbitApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, error: text || `Wallbit HTTP ${res.status}` };
        }
        const result = (await res.json()) as Record<string, unknown>;
        return { ok: true, result };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Wallbit error",
        };
      }
    },
  };
}
