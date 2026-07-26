"use client";

import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { apiGet, apiPost } from "@/lib/api";

type Action = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  channel_created: string;
  expires_at: string;
  goal_id: string | null;
};

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<{ actions: Action[] }>("/v1/actions/pending")
      .then((d) => setActions(d.actions))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(id: string) {
    setMsg(null);
    try {
      await apiPost(`/v1/actions/${id}/confirm`);
      setMsg("Acción confirmada.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function cancel(id: string) {
    setMsg(null);
    try {
      await apiPost(`/v1/actions/${id}/cancel`);
      setMsg("Acción cancelada.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <main>
      <Nav />
      <h1>Acciones pendientes</h1>
      <p className="muted">
        Confirmá conversiones Wallbit, microahorros o retiros. Nada se ejecuta sin
        tu OK.
      </p>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {msg && <p style={{ color: "var(--accent)" }}>{msg}</p>}
      {!actions.length && <p className="muted">No hay acciones pendientes.</p>}
      <div className="card-list">
        {actions.map((a) => (
          <div key={a.id} className="goal-card">
            <strong>{a.kind}</strong>
            <p className="muted">
              Canal: {a.channel_created} · expira {new Date(a.expires_at).toLocaleString("es-BO")}
            </p>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
              {JSON.stringify(a.payload, null, 2)}
            </pre>
            <div className="row">
              <button className="btn btn-primary" type="button" onClick={() => confirm(a.id)}>
                Confirmar
              </button>
              <button className="btn btn-danger" type="button" onClick={() => cancel(a.id)}>
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
