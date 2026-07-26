"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { apiPost, getUserId } from "@/lib/api";

export default function SettingsPage() {
  const [userId, setUserId] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "FinoraBot";

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  async function createLink() {
    setError(null);
    try {
      const data = await apiPost<{ deep_link: string; token: string }>(
        "/v1/account/telegram/link-token",
      );
      setLink(data.deep_link);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <main>
      <Nav />
      <h1>Ajustes</h1>
      <p className="muted">
        Modo local: el dashboard usa un user id en este navegador. Conectá
        Telegram para alinear el mismo perfil cuando uses Supabase Auth.
      </p>
      <p>
        <strong>User id local:</strong> <code>{userId || "…"}</code>
      </p>
      <div className="row" style={{ marginTop: "1rem" }}>
        <button className="btn btn-primary" type="button" onClick={createLink}>
          Generar link de Telegram
        </button>
        <a className="btn" href={`https://t.me/${bot}`} target="_blank" rel="noreferrer">
          Abrir bot
        </a>
      </div>
      {link && (
        <p style={{ marginTop: "1rem" }}>
          Abrí este enlace en Telegram:{" "}
          <a href={link} target="_blank" rel="noreferrer">
            {link}
          </a>
        </p>
      )}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </main>
  );
}
