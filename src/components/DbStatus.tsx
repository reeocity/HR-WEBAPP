"use client";

import { useEffect, useState } from "react";

type DbState = "checking" | "connected" | "disconnected";

export default function DbStatus() {
  const [state, setState] = useState<DbState>("checking");

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const response = await fetch("/api/health/db", { cache: "no-store" });
        if (!active) return;
        setState(response.ok ? "connected" : "disconnected");
      } catch {
        if (!active) return;
        setState("disconnected");
      }
    };

    check();
    return () => {
      active = false;
    };
  }, []);

  const label =
    state === "checking"
      ? "Checking database connection..."
      : state === "connected"
        ? "Database connected"
        : "Database not connected";

  const color =
    state === "connected" ? "#16a34a" : state === "disconnected" ? "#b91c1c" : "#64748b";

  return (
    <p className="muted" style={{ marginTop: "12px", color }}>
      {label}
    </p>
  );
}
