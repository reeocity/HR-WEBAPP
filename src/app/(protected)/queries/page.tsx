"use client";

import { useEffect, useState } from "react";

type QueryLogRow = {
  id: string;
  date: string;
  reason: string;
  surchargeAmount: string | null;
  penaltyDays: number | null;
  staff: {
    id: string;
    staffId: string | null;
    fullName: string;
    department: string;
    position: string;
  };
};

export default function QueriesPage() {
  const [logs, setLogs] = useState<QueryLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/queries");
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message ?? "Failed to load queries.");
          return;
        }
        setLogs(data.logs ?? []);
      } catch {
        setError("Failed to load queries.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="card">
      <h1>Query & Surcharge Log</h1>

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
                <th>Reason</th>
                <th>Surcharge</th>
                <th>Penalty Days</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.staff.staffId ?? "-"} — {log.staff.fullName}</td>
                  <td>{log.staff.department}</td>
                  <td>{log.staff.position}</td>
                  <td>{log.reason}</td>
                  <td>{log.surchargeAmount ?? "-"}</td>
                  <td>{log.penaltyDays ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
