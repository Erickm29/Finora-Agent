"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { apiGet } from "@/lib/api";

type Goal = {
  id: string;
  name: string;
  target_amount_bobs: number;
  accumulated_bobs: number;
  base_monthly_bobs: number;
  target_months: number;
  status: string;
  progress_ratio: number;
};

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "FinoraBot";

  useEffect(() => {
    apiGet<{ goals: Goal[] }>("/v1/goals")
      .then((d) => setGoals(d.goals))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <Nav />
      <h1>Tus metas</h1>
      <p className="muted">
        Progreso en pesos bolivianos (Bs). El mentor conversa en Telegram; acá
        confirmás y seguís el avance.
      </p>

      {loading && <p className="muted">Cargando…</p>}
      {error && (
        <p style={{ color: "var(--danger)" }}>
          No pude hablar con la API ({error}). ¿Está corriendo `npm run dev:api`?
        </p>
      )}

      {!loading && !error && goals.length === 0 && (
        <div className="empty">
          <h2>Todavía no hay metas</h2>
          <p className="muted">
            Empezá la conversación con el bot y después volvé acá.
          </p>
          <p style={{ marginTop: "1.25rem" }}>
            <a
              className="btn btn-primary"
              href={`https://t.me/${bot}`}
              target="_blank"
              rel="noreferrer"
            >
              Hablar con Finora en Telegram
            </a>
          </p>
        </div>
      )}

      <div className="card-list">
        {goals.map((g) => (
          <Link key={g.id} href={`/goals/${g.id}`} className="goal-card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{g.name}</strong>
              <span className="muted">{g.status}</span>
            </div>
            <p className="muted" style={{ margin: "0.4rem 0 0" }}>
              {g.accumulated_bobs.toLocaleString("es-BO")} /{" "}
              {g.target_amount_bobs.toLocaleString("es-BO")} Bs · cuota{" "}
              {g.base_monthly_bobs.toLocaleString("es-BO")} Bs/mes
            </p>
            <div className="bar">
              <span style={{ width: `${Math.round(g.progress_ratio * 100)}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
