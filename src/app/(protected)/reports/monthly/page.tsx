"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ReportData = {
  month: number;
  year: number;
  newStaff: Array<{ id: string; staffId: string | null; fullName: string; department: string; position: string; resumptionDate: string; salary: number }>;
  absenceRecords: Array<{ staffName: string; staffId: string | null; date: string; type: string }>;
  latenessSummary: Array<{ fullName: string; staffId: string | null; count: number }>;
  queries: Array<{ staffName: string; staffId: string | null; date: string; reason: string; surcharge: string; penaltyDays: number }>;
  mealSummary: Array<{ fullName: string; staffId: string | null; count: number; total: number }>;
  manualDeductions: Array<{ staffName: string; staffId: string | null; category: string; amount: string; note: string | null }>;
  inactiveStaff: Array<{ staffId: string | null; fullName: string; reason: string | null; lastActiveDate: string | null }>;
  allowances: Array<{ staffName: string; staffId: string | null; reason: string; amount: string }>;
};

export default function MonthlyReportPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReport = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.message ?? "Failed to load report.");
        return;
      }
      setData(json);
    } catch (e) {
      setMessage("Failed to load report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [month, year]);

  const formatNaira = (amount: string | number) => {
    const num = typeof amount === "string" ? Number(amount) : amount;
    return "₦" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div style={{ gap: "24px", display: "flex", flexDirection: "column" }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Monthly Report</h1>
          <button className="button secondary" onClick={() => router.push("/")}>
            Back
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "flex-end" }}>
          <label>
            <span className="muted">Month</span>
            <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          </label>
          <label>
            <span className="muted">Year</span>
            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </label>
          <button className="button" onClick={loadReport} disabled={isLoading}>
            {isLoading ? "Loading..." : "Generate Report"}
          </button>
          <button className="button secondary" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {message && <p className="muted" style={{ marginTop: "8px", color: "red" }}>{message}</p>}
      </section>

      {data && (
        <>
          {/* New Staff Section */}
          {data.newStaff.length > 0 && (
            <section className="card">
              <h2>Newly Employed Staff ({data.newStaff.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Full Name</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Resumption Date</th>
                    <th>Monthly Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.newStaff.map((s) => (
                    <tr key={s.id}>
                      <td>{s.staffId ?? "-"}</td>
                      <td>{s.fullName}</td>
                      <td>{s.department}</td>
                      <td>{s.position}</td>
                      <td>{s.resumptionDate}</td>
                      <td>{formatNaira(s.salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Absence Section */}
          {data.absenceRecords.length > 0 && (
            <section className="card">
              <h2>Absence Records ({data.absenceRecords.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Date</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.absenceRecords.map((a, i) => (
                    <tr key={i}>
                      <td>{a.staffId ?? "-"}</td>
                      <td>{a.staffName}</td>
                      <td>{a.date}</td>
                      <td>{a.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Lateness Summary Section */}
          {data.latenessSummary.length > 0 && (
            <section className="card">
              <h2>Lateness Summary ({data.latenessSummary.length} staff)</h2>
              <p className="muted" style={{ marginBottom: "12px" }}>Shows staff name, lateness count, and penalty deduction amount</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Lateness Count</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.latenessSummary.map((l, i) => (
                    <tr key={i}>
                      <td>{l.staffId ?? "-"}</td>
                      <td>{l.fullName}</td>
                      <td>{l.count} times</td>
                      <td className="muted" style={{ fontSize: "0.9em" }}>
                        {l.count <= 2 && "No penalty"}
                        {l.count > 2 && l.count <= 4 && "1 day penalty"}
                        {l.count > 4 && l.count <= 7 && "2 days penalty"}
                        {l.count > 7 && l.count <= 10 && "3 days penalty"}
                        {l.count > 10 && l.count <= 15 && "4 days penalty"}
                        {l.count > 15 && "5 days penalty"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Queries Section */}
          {data.queries.length > 0 && (
            <section className="card">
              <h2>Queries & Charges ({data.queries.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Surcharge</th>
                    <th>Penalty Days</th>
                  </tr>
                </thead>
                <tbody>
                  {data.queries.map((q, i) => (
                    <tr key={i}>
                      <td>{q.staffId ?? "-"}</td>
                      <td>{q.staffName}</td>
                      <td>{q.date}</td>
                      <td>{q.reason}</td>
                      <td>{formatNaira(Number(q.surcharge))}</td>
                      <td>{q.penaltyDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Meal Charges Section */}
          {data.mealSummary.length > 0 && (
            <section className="card">
              <h2>Staff Meal Charges ({data.mealSummary.length} staff)</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Tickets Count</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mealSummary.map((m, i) => (
                    <tr key={i}>
                      <td>{m.staffId ?? "-"}</td>
                      <td>{m.fullName}</td>
                      <td>{m.count}</td>
                      <td>{formatNaira(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Manual Deductions Section */}
          {data.manualDeductions.length > 0 && (
            <section className="card">
              <h2>Manual Deductions ({data.manualDeductions.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.manualDeductions.map((d, i) => (
                    <tr key={i}>
                      <td>{d.staffId ?? "-"}</td>
                      <td>{d.staffName}</td>
                      <td>{d.category}</td>
                      <td>{formatNaira(Number(d.amount))}</td>
                      <td className="muted">{d.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Inactive Staff Section */}
          {data.inactiveStaff.length > 0 && (
            <section className="card">
              <h2>Inactive Staff ({data.inactiveStaff.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Full Name</th>
                    <th>Reason</th>
                    <th>Last Active Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inactiveStaff.map((s, i) => (
                    <tr key={i}>
                      <td>{s.staffId ?? "-"}</td>
                      <td>{s.fullName}</td>
                      <td>{s.reason ?? "-"}</td>
                      <td>{s.lastActiveDate ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Allowances Section */}
          {data.allowances.length > 0 && (
            <section className="card">
              <h2>Monthly Allowances ({data.allowances.length})</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Staff Name</th>
                    <th>Reason</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allowances.map((a, i) => (
                    <tr key={i}>
                      <td>{a.staffId ?? "-"}</td>
                      <td>{a.staffName}</td>
                      <td>{a.reason}</td>
                      <td>{formatNaira(Number(a.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Summary Section */}
          <section className="card">
            <h2>Report Summary for {month}/{year}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px" }}>
                <p className="muted">Newly Employed</p>
                <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{data.newStaff.length}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "rgba(244, 67, 54, 0.1)", borderRadius: "8px" }}>
                <p className="muted">Absent Instances</p>
                <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{data.absenceRecords.length}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "rgba(255, 193, 7, 0.1)", borderRadius: "8px" }}>
                <p className="muted">Staff With Lateness</p>
                <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{data.latenessSummary.length}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "rgba(33, 150, 243, 0.1)", borderRadius: "8px" }}>
                <p className="muted">Inactive Staff</p>
                <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{data.inactiveStaff.length}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
