"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Metas" },
  { href: "/actions", label: "Acciones" },
  { href: "/settings", label: "Ajustes" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <strong style={{ marginRight: "auto", fontFamily: "var(--font-display)" }}>
        Finora
      </strong>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={path === l.href ? "active" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
