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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ margin: "0", fontSize: "clamp(18px, 5vw, 32px)" }}>Payroll Runs</h1>
          <button className="button secondary" onClick={() => router.push("/")} style={{ minHeight: "44px", minWidth: "80px" }}>
            Back
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ minWidth: "100px", flex: "1 1 auto" }}>
            <span className="muted" style={{ fontSize: "12px" }}>Month</span>
            <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ minHeight: "44px" }} />
          </label>
          <label style={{ minWidth: "100px", flex: "1 1 auto" }}>
            <span className="muted" style={{ fontSize: "12px" }}>Year</span>
            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minHeight: "44px" }} />
          </label>
          <button className="button" onClick={generatePayrollRun} disabled={isLoading} style={{ minHeight: "44px", minWidth: "140px" }}>
            {isLoading ? "Generating..." : "Generate Payroll Run"}
          </button>
        </div>

        {message && <p className="muted" style={{ marginTop: "8px", color: message.includes("Failed") ? "red" : "green", fontSize: "12px" }}>{message}</p>}
      </section>

      {/* Payroll Runs List */}
      <section className="card">
        <h2 style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>Payroll Runs</h2>
        {payrollRuns.length === 0 ? (
          <p className="muted">No payroll runs yet. Generate one to get started.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                        style={{ minHeight: "44px", minWidth: "80px" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payroll Details */}
      {selectedRun && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <h2 style={{ margin: "0", fontSize: "clamp(16px, 4vw, 20px)" }}>Payroll Run - {selectedRun.month}/{selectedRun.year}</h2>
            <button className="button secondary" onClick={() => setSelectedRun(null)} style={{ minHeight: "44px", minWidth: "70px" }}>
              Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px" }}>
              <p className="muted" style={{ fontSize: "11px" }}>Total Staff</p>
              <p style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: "bold", margin: "4px 0" }}>{selectedRun.totalStaff}</p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(33, 150, 243, 0.1)", borderRadius: "8px" }}>
              <p className="muted" style={{ fontSize: "11px" }}>Total Gross Salary</p>
              <p style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: "bold", margin: "4px 0" }}>{formatNaira(selectedRun.totalGrossSalary)}</p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(244, 67, 54, 0.1)", borderRadius: "8px" }}>
              <p className="muted" style={{ fontSize: "11px" }}>Total Deductions</p>
              <p style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: "bold", margin: "4px 0" }}>{formatNaira(selectedRun.totalDeductions)}</p>
            </div>
          </div>

          <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "rgba(139, 69, 19, 0.1)", borderRadius: "8px", borderLeft: "4px solid #8B4513" }}>
            <p className="muted" style={{ fontSize: "11px", margin: "0 0 4px 0" }}>Net Pay Total</p>
            <p style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "bold", margin: "0" }}>{formatNaira(selectedRun.totalNetPay)}</p>
          </div>

          {/* Payslips Table */}
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "clamp(14px, 3vw, 18px)" }}>Individual Payslips</h3>
            {payslips.length === 0 ? (
              <p className="muted">Loading payslips...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
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
                          <button className="button secondary" onClick={() => router.push(`/payslips/${slip.staffId}`)} style={{ minHeight: "44px", minWidth: "60px" }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedRun.status === "DRAFT" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button className="button" onClick={() => approvePayroll(selectedRun.id)} disabled={isLoading} style={{ minHeight: "44px", flex: "1 1 auto" }}>
                Approve Payroll
              </button>
              <button
                className="button secondary"
                onClick={() => deletePayroll(selectedRun.id)}
                disabled={isLoading}
                style={{ borderColor: "#dc2626", color: "#dc2626", minHeight: "44px", flex: "1 1 auto" }}
              >
                🗑️ Delete
              </button>
              <p className="muted" style={{ margin: "0", fontSize: "12px", flex: "1 1 100%" }}>Review all payslips before approving. This cannot be undone.</p>
            </div>
          )}

          {selectedRun.status === "APPROVED" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button className="button" onClick={() => lockPayroll(selectedRun.id)} disabled={isLoading} style={{ minHeight: "44px", flex: "1 1 auto" }}>
                Lock & Finalize Payroll
              </button>
              <button
                className="button secondary"
                onClick={() => rejectPayroll(selectedRun.id)}
                disabled={isLoading}
                style={{ borderColor: "#f59e0b", color: "#f59e0b", minHeight: "44px", flex: "1 1 auto" }}
              >
                ↩️ Reject & Revise
              </button>
              <button className="button secondary" onClick={() => window.print()} style={{ minHeight: "44px", flex: "1 1 auto" }}>
                Print Payroll Report
              </button>
              <p className="muted" style={{ margin: "0", fontSize: "12px", flex: "1 1 100%" }}>Lock to prevent further changes and finalize for payment processing.</p>
            </div>
          )}

          {selectedRun.status === "LOCKED" && (
            <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px", marginTop: "20px" }}>
              <p className="muted" style={{ margin: "0", fontSize: "12px" }}>
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
