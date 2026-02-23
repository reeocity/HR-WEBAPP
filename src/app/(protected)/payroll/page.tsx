"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StaffPayslip = {
  staffId: string;
  fullName: string;
  department: string;
  position: string;
  salary: number;
  grossTotal: number;
  totalDeductions: number;
  netPay: number;
};

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: "DRAFT" | "APPROVED" | "LOCKED";
  createdAt: string;
  approvedAt: string | null;
  lockedAt: string | null;
  totalStaff: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetPay: number;
};

export default function PayrollRunsPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<StaffPayslip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const formatNaira = (amount: number) => {
    return "₦" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    loadPayrollRuns();
  }, []);

  const loadPayrollRuns = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payroll/runs");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to load payroll runs.");
        return;
      }
      setPayrollRuns(data.runs ?? []);
    } catch {
      setMessage("Failed to load payroll runs.");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePayrollRun = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to generate payroll run.");
        return;
      }
      setMessage("Payroll run generated successfully!");
      await loadPayrollRuns();
    } catch {
      setMessage("Failed to generate payroll run.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayslips = async (runId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/payslips`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to load payslips.");
        return;
      }
      setPayslips(data.payslips ?? []);
    } catch {
      setMessage("Failed to load payslips.");
    } finally {
      setIsLoading(false);
    }
  };

  const approvePayroll = async (runId: string) => {
    if (!window.confirm("Approve this payroll run? This cannot be undone.")) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to approve payroll.");
        return;
      }
      setMessage("Payroll approved!");
      await loadPayrollRuns();
      setSelectedRun(null);
    } catch {
      setMessage("Failed to approve payroll.");
    } finally {
      setIsLoading(false);
    }
  };

  const lockPayroll = async (runId: string) => {
    if (!window.confirm("Lock this payroll run? This will prevent any further changes.")) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to lock payroll.");
        return;
      }
      setMessage("Payroll locked!");
      await loadPayrollRuns();
      setSelectedRun(null);
    } catch {
      setMessage("Failed to lock payroll.");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePayroll = async (runId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to DELETE this DRAFT payroll run?\n\nThis action cannot be undone."
      )
    )
      return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to delete payroll.");
        return;
      }
      setMessage("Payroll deleted successfully!");
      await loadPayrollRuns();
      setSelectedRun(null);
    } catch {
      setMessage("Failed to delete payroll.");
    } finally {
      setIsLoading(false);
    }
  };

  const rejectPayroll = async (runId: string) => {
    if (
      !window.confirm(
        "Reject this APPROVED payroll run?\n\nIt will be reverted to DRAFT status for modifications."
      )
    )
      return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to reject payroll.");
        return;
      }
      setMessage("Payroll rejected and reverted to DRAFT!");
      await loadPayrollRuns();
      setSelectedRun(null);
    } catch {
      setMessage("Failed to reject payroll.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ gap: "24px", display: "flex", flexDirection: "column" }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Payroll Runs</h1>
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
          <button className="button" onClick={generatePayrollRun} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Payroll Run"}
          </button>
        </div>

        {message && <p className="muted" style={{ marginTop: "8px", color: message.includes("Failed") ? "red" : "green" }}>{message}</p>}
      </section>

      {/* Payroll Runs List */}
      <section className="card">
        <h2>Payroll Runs</h2>
        {payrollRuns.length === 0 ? (
          <p className="muted">No payroll runs yet. Generate one to get started.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Month/Year</th>
                <th>Status</th>
                <th>Total Staff</th>
                <th>Total Net Pay</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollRuns.map((run) => (
                <tr key={run.id}>
                  <td>{run.month}/{run.year}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        fontWeight: "600",
                        backgroundColor:
                          run.status === "LOCKED"
                            ? "rgba(76, 175, 80, 0.2)"
                            : run.status === "APPROVED"
                              ? "rgba(33, 150, 243, 0.2)"
                              : "rgba(255, 193, 7, 0.2)",
                      }}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td>{run.totalStaff}</td>
                  <td>{formatNaira(run.totalNetPay)}</td>
                  <td>{new Date(run.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setSelectedRun(run);
                        loadPayslips(run.id);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Payroll Details */}
      {selectedRun && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Payroll Run - {selectedRun.month}/{selectedRun.year}</h2>
            <button className="button secondary" onClick={() => setSelectedRun(null)}>
              Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "16px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Total Staff</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{selectedRun.totalStaff}</p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(33, 150, 243, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Total Gross Salary</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{formatNaira(selectedRun.totalGrossSalary)}</p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(244, 67, 54, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Total Deductions</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{formatNaira(selectedRun.totalDeductions)}</p>
            </div>
          </div>

          <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "rgba(139, 69, 19, 0.1)", borderRadius: "8px", borderLeft: "4px solid #8B4513" }}>
            <p className="muted">Net Pay Total</p>
            <p style={{ fontSize: "2em", fontWeight: "bold" }}>{formatNaira(selectedRun.totalNetPay)}</p>
          </div>

          {/* Payslips Table */}
          <div style={{ marginTop: "20px" }}>
            <h3>Individual Payslips</h3>
            {payslips.length === 0 ? (
              <p className="muted">Loading payslips...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((slip) => (
                    <tr key={slip.staffId}>
                      <td>{slip.staffId}</td>
                      <td>{slip.fullName}</td>
                      <td>{slip.department}</td>
                      <td>{formatNaira(slip.grossTotal)}</td>
                      <td>{formatNaira(slip.totalDeductions)}</td>
                      <td style={{ fontWeight: "600" }}>{formatNaira(slip.netPay)}</td>
                      <td>
                        <button className="button secondary" onClick={() => router.push(`/payslips/${slip.staffId}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Buttons */}
          {selectedRun.status === "DRAFT" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button className="button" onClick={() => approvePayroll(selectedRun.id)} disabled={isLoading}>
                Approve Payroll
              </button>
              <button
                className="button secondary"
                onClick={() => deletePayroll(selectedRun.id)}
                disabled={isLoading}
                style={{ borderColor: "#dc2626", color: "#dc2626" }}
              >
                🗑️ Delete
              </button>
              <p className="muted" style={{ margin: 0 }}>Review all payslips before approving. This cannot be undone.</p>
            </div>
          )}

          {selectedRun.status === "APPROVED" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button className="button" onClick={() => lockPayroll(selectedRun.id)} disabled={isLoading}>
                Lock & Finalize Payroll
              </button>
              <button
                className="button secondary"
                onClick={() => rejectPayroll(selectedRun.id)}
                disabled={isLoading}
                style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
              >
                ↩️ Reject & Revise
              </button>
              <button className="button secondary" onClick={() => window.print()}>
                Print Payroll Report
              </button>
              <p className="muted" style={{ margin: 0 }}>Lock to prevent further changes and finalize for payment processing.</p>
            </div>
          )}

          {selectedRun.status === "LOCKED" && (
            <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px", marginTop: "20px" }}>
              <p className="muted" style={{ margin: 0 }}>
                ✓ Payroll finalized on {new Date(selectedRun.lockedAt!).toLocaleDateString()} at{" "}
                {new Date(selectedRun.lockedAt!).toLocaleTimeString()}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
