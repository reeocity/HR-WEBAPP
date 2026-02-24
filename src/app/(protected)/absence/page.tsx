"use client";

import { useEffect, useState } from "react";

type AbsenceRow = {
  id: string;
  date: string;
  type: "PERMISSION" | "NO_PERMISSION";
  staff: {
    id: string;
    staffId: string | null;
    fullName: string;
    department: string;
    position: string;
  };
};

export default function AbsencePage() {
  const [logs, setLogs] = useState<AbsenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/absence");
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message ?? "Failed to load absence.");
          return;
        }
        setLogs(data.logs ?? []);
      } catch {
        setError("Failed to load absence.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="card">
      <h1 style={{ fontSize: "clamp(18px, 5vw, 32px)" }}>Absence Log</h1>

      {isLoading ? (
        <p className="muted" style={{ marginTop: "8px" }}>Loading...</p>
      ) : error ? (
        <p className="muted" style={{ marginTop: "8px" }}>{error}</p>
      ) : logs.length === 0 ? (
        <p className="muted" style={{ marginTop: "8px" }}>No entries yet.</p>
      ) : (
        <div style={{ marginTop: "12px", overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff</th>
                <th>Department</th>
                <th>Position</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.staff.staffId ?? "-"} — {log.staff.fullName}</td>
                  <td>{log.staff.department}</td>
                  <td>{log.staff.position}</td>
                  <td>{log.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
