"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { apiGet } from "@/lib/api";

type Goal = {
  id: string;
  name: string;
  target_amount_bobs: number;
  accumulated_bobs: number;
  base_monthly_bobs: number;
  progress_ratio: number;
};

type Tx = {
  id: string;
  type: string;
  amount_bobs: number;
  source: string;
  note: string | null;
  created_at: string;
};

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      apiGet<Goal>(`/v1/goals/${params.id}`),
      apiGet<{ transactions: Tx[] }>(`/v1/goals/${params.id}/transactions`),
    ])
      .then(([g, t]) => {
        setGoal(g);
        setTxs(t.transactions);
      })
      .catch((e: Error) => setError(e.message));
  }, [params.id]);

  return (
    <main>
      <Nav />
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {goal && (
        <>
          <h1>{goal.name}</h1>
          <p className="muted">
            {goal.accumulated_bobs.toLocaleString("es-BO")} de{" "}
            {goal.target_amount_bobs.toLocaleString("es-BO")} Bs (
            {Math.round(goal.progress_ratio * 100)}%)
          </p>
          <div className="bar" style={{ maxWidth: 420 }}>
            <span style={{ width: `${Math.round(goal.progress_ratio * 100)}%` }} />
          </div>
          <h2 style={{ marginTop: "2rem" }}>Historial</h2>
          {txs.length === 0 && <p className="muted">Sin movimientos aún.</p>}
          <ul>
            {txs.map((t) => (
              <li key={t.id}>
                {t.type} · {t.amount_bobs.toLocaleString("es-BO")} Bs · {t.source}
                {t.note ? ` — ${t.note}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
