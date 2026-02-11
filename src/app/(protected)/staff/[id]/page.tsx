"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AbsenceType = "PERMISSION" | "NO_PERMISSION";

type StaffDetail = {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  status: string | null;
  inactiveReason: string | null;
  lastActiveDate: string | null;
  phone: string | null;
  resumptionDate: string;
};

type LatenessLog = { id: string; date: string; arrivalTime: string | null };
type AbsenceLog = { id: string; date: string; type: "PERMISSION" | "NO_PERMISSION" };
type QueryLog = {
  id: string;
  date: string;
  reason: string;
  surchargeAmount: string | null;
  penaltyDays: number | null;
};
type MealLog = { id: string; date: string; amount: string };
type Allowance = { id: string; reason: string; amount: string };

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const staffId = params.id;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [latenessDate, setLatenessDate] = useState("");
  const [latenessTime, setLatenessTime] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceType, setAbsenceType] = useState<"PERMISSION" | "NO_PERMISSION">("NO_PERMISSION");
  const [queryDate, setQueryDate] = useState("");
  const [queryReason, setQueryReason] = useState("");
  const [querySurcharge, setQuerySurcharge] = useState("");
  const [queryPenaltyDays, setQueryPenaltyDays] = useState("");
  const [mealDate, setMealDate] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [allowanceReason, setAllowanceReason] = useState("");

  const [latenessLogs, setLatenessLogs] = useState<LatenessLog[]>([]);
  const [absenceLogs, setAbsenceLogs] = useState<AbsenceLog[]>([]);
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/staff/${staffId}`);
        const data = await res.json();
        if (!res.ok) {
          setMessage(data?.message ?? "Failed to load staff.");
          return;
        }
        setStaff(data.staff);
        setLatenessLogs(data.latenessLogs ?? []);
        setAbsenceLogs(data.absenceLogs ?? []);
        setQueryLogs(data.queryLogs ?? []);
        setMealLogs(data.mealTickets ?? []);

        // Load allowances for current month
        const now = new Date();
        const allowRes = await fetch(`/api/allowances?staffId=${staffId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const allowData = await allowRes.json();
        if (allowRes.ok) {
          setAllowances(allowData.allowances ?? []);
        }
      } catch {
        setMessage("Failed to load staff.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [staffId]);

  const handleSave = async () => {
    if (!staff) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: staff.staffId,
        fullName: staff.fullName,
        department: staff.department,
        position: staff.position,
        status: staff.status,
        inactiveReason: staff.inactiveReason,
        lastActiveDate: staff.lastActiveDate,
        phone: staff.phone,
        resumptionDate: staff.resumptionDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Update failed.");
      return;
    }
    setMessage("Staff updated.");
  };

  const addLateness = async () => {
    if (!latenessDate) return;
    const res = await fetch(`/api/staff/${staffId}/lateness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: latenessDate, arrivalTime: latenessTime || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add lateness.");
      return;
    }
    setLatenessLogs((prev) => [data.log, ...prev]);
    setLatenessDate("");
    setLatenessTime("");
  };

  const addAbsence = async () => {
    if (!absenceDate) return;
    const res = await fetch(`/api/staff/${staffId}/absence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: absenceDate, type: absenceType }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add absence.");
      return;
    }
    setAbsenceLogs((prev) => [data.log, ...prev]);
    setAbsenceDate("");
  };

  const addQuery = async () => {
    if (!queryDate || !queryReason) return;
    const res = await fetch(`/api/staff/${staffId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: queryDate,
        reason: queryReason,
        surchargeAmount: querySurcharge ? Number(querySurcharge) : null,
        penaltyDays: queryPenaltyDays ? Number(queryPenaltyDays) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add query.");
      return;
    }
    setQueryLogs((prev) => [data.log, ...prev]);
    setQueryDate("");
    setQueryReason("");
    setQuerySurcharge("");
    setQueryPenaltyDays("");
  };

  const deleteLateness = async (logId: string) => {
    if (!window.confirm("Delete this lateness record?")) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}/lateness`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete lateness.");
      return;
    }
    setLatenessLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const deleteAbsence = async (logId: string) => {
    if (!window.confirm("Delete this absence record?")) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}/absence`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete absence.");
      return;
    }
    setAbsenceLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const deleteQuery = async (logId: string) => {
    if (!window.confirm("Delete this query record?")) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}/query`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete query.");
      return;
    }
    setQueryLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const deleteMealTicket = async (logId: string) => {
    if (!window.confirm("Delete this meal ticket?")) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}/meal-ticket`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete meal ticket.");
      return;
    }
    setMealLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  const deleteStaff = async () => {
    if (!window.confirm("Delete this staff and all related records?")) return;
    setMessage(null);
    const res = await fetch(`/api/staff/${staffId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete staff.");
      return;
    }
    router.push("/");
  };

  const addMealTicket = async () => {
    if (!mealDate) return;
    const res = await fetch(`/api/staff/${staffId}/meal-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: mealDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add meal ticket.");
      return;
    }
    setMealLogs((prev) => [data.log, ...prev]);
    setMealDate("");
  };

  const addAllowance = async () => {
    if (!allowanceAmount || !allowanceReason) return;
    const now = new Date();
    const res = await fetch("/api/allowances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        amount: Number(allowanceAmount),
        reason: allowanceReason,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add allowance.");
      return;
    }
    if (data.allowance) {
      setAllowances((prev) => [
        {
          id: data.allowance.id,
          reason: data.allowance.reason,
          amount: data.allowance.amount.toString(),
        },
        ...prev,
      ]);
    }
    setAllowanceAmount("");
    setAllowanceReason("");
  };

  const deleteAllowance = async (allowanceId: string) => {
    if (!window.confirm("Delete this allowance?")) return;
    setMessage(null);
    const res = await fetch("/api/allowances", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: allowanceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete allowance.");
      return;
    }
    setAllowances((prev) => prev.filter((a) => a.id !== allowanceId));
  };

  if (isLoading || !staff) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="grid" style={{ gap: "24px" }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Staff Details</h1>
          <button className="button secondary" onClick={() => router.push("/")}>Back</button>
        </div>

        {message ? <p className="muted" style={{ marginTop: "8px" }}>{message}</p> : null}

        <div className="grid grid-2" style={{ marginTop: "16px", gap: "12px" }}>
          <label>
            <span className="muted">Full Name</span>
            <input className="input" value={staff.fullName} onChange={(e) => setStaff({ ...staff, fullName: e.target.value })} />
          </label>
          <label>
            <span className="muted">Staff ID</span>
            <input className="input" value={staff.staffId ?? ""} onChange={(e) => setStaff({ ...staff, staffId: e.target.value })} />
          </label>
          <label>
            <span className="muted">Department</span>
            <input className="input" value={staff.department} onChange={(e) => setStaff({ ...staff, department: e.target.value })} />
          </label>
          <label>
            <span className="muted">Position</span>
            <input className="input" value={staff.position} onChange={(e) => setStaff({ ...staff, position: e.target.value })} />
          </label>
          <label>
            <span className="muted">Status</span>
            <select
              className="select"
              value={staff.status ?? "ACTIVE"}
              onChange={(e) => {
                const value = e.target.value;
                setStaff({
                  ...staff,
                  status: value,
                  inactiveReason: value === "INACTIVE" ? staff.inactiveReason : null,
                  lastActiveDate: value === "INACTIVE" ? staff.lastActiveDate : null,
                });
              }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label>
            <span className="muted">Inactive Reason</span>
            <select
              className="select"
              value={staff.inactiveReason ?? ""}
              onChange={(e) => setStaff({ ...staff, inactiveReason: e.target.value || null })}
              disabled={(staff.status ?? "ACTIVE") !== "INACTIVE"}
            >
              <option value="">Select reason</option>
              <option value="TERMINATION">TERMINATION</option>
              <option value="RESIGNATION">RESIGNATION</option>
              <option value="AWOL">AWOL</option>
              <option value="SUSPENSION">SUSPENSION</option>
            </select>
          </label>
          <label>
            <span className="muted">Last Active Day</span>
            <input
              className="input"
              type="date"
              value={staff.lastActiveDate ?? ""}
              onChange={(e) => setStaff({ ...staff, lastActiveDate: e.target.value || null })}
              disabled={(staff.status ?? "ACTIVE") !== "INACTIVE"}
            />
          </label>
          <label>
            <span className="muted">Phone</span>
            <input className="input" value={staff.phone ?? ""} onChange={(e) => setStaff({ ...staff, phone: e.target.value })} />
          </label>
          <label>
            <span className="muted">Resumption Date</span>
            <input className="input" type="date" value={staff.resumptionDate} onChange={(e) => setStaff({ ...staff, resumptionDate: e.target.value })} />
          </label>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button className="button" onClick={handleSave}>Save Changes</button>
          <button className="button secondary" onClick={() => router.push(`/payslips/${staffId}`)}>
            View Payslip
          </button>
          <button className="button secondary" onClick={deleteStaff}>
            Delete Staff
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Attendance</h2>
        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Lateness Date</span>
            <input className="input" type="date" value={latenessDate} onChange={(e) => setLatenessDate(e.target.value)} />
          </label>
          <label>
            <span className="muted">Arrival Time</span>
            <input className="input" type="time" value={latenessTime} onChange={(e) => setLatenessTime(e.target.value)} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="button secondary" onClick={addLateness}>Add Lateness</button>
          </div>
        </div>

        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Absence Date</span>
            <input className="input" type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} />
          </label>
          <label>
            <span className="muted">Absence Type</span>
            <select
              className="select"
              value={absenceType}
              onChange={(e) => setAbsenceType(e.target.value as AbsenceType)}
            >
              <option value="NO_PERMISSION">NO PERMISSION</option>
              <option value="PERMISSION">PERMISSION</option>
            </select>
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="button secondary" onClick={addAbsence}>Add Absence</button>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <h3>Recent Logs</h3>
          <p className="muted">Lateness: {latenessLogs.length} | Absence: {absenceLogs.length}</p>
        </div>

        <div className="grid grid-2" style={{ gap: "12px", marginTop: "12px" }}>
          <div>
            <h4>Lateness Logs</h4>
            {latenessLogs.length === 0 ? (
              <p className="muted">No lateness records.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {latenessLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td>{log.arrivalTime ?? "-"}</td>
                      <td>
                        <button className="button secondary" onClick={() => deleteLateness(log.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h4>Absence Logs</h4>
            {absenceLogs.length === 0 ? (
              <p className="muted">No absence records.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td>{log.type}</td>
                      <td>
                        <button className="button secondary" onClick={() => deleteAbsence(log.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Queries</h2>
        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Query Date</span>
            <input className="input" type="date" value={queryDate} onChange={(e) => setQueryDate(e.target.value)} />
          </label>
          <label>
            <span className="muted">Reason</span>
            <input className="input" value={queryReason} onChange={(e) => setQueryReason(e.target.value)} />
          </label>
          <label>
            <span className="muted">Surcharge (optional)</span>
            <input className="input" type="number" value={querySurcharge} onChange={(e) => setQuerySurcharge(e.target.value)} />
          </label>
          <label>
            <span className="muted">Penalty Days (optional)</span>
            <input className="input" type="number" value={queryPenaltyDays} onChange={(e) => setQueryPenaltyDays(e.target.value)} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="button secondary" onClick={addQuery}>Add Query</button>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <h3>Recent Queries</h3>
          {queryLogs.length === 0 ? (
            <p className="muted">No queries logged.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Surcharge</th>
                  <th>Penalty Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queryLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.reason}</td>
                    <td>{log.surchargeAmount ?? "-"}</td>
                    <td>{log.penaltyDays ?? "-"}</td>
                    <td>
                      <button className="button secondary" onClick={() => deleteQuery(log.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Meal Tickets (₦500/day)</h2>
        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Date Purchased</span>
            <input className="input" type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="button secondary" onClick={addMealTicket}>Add Ticket</button>
          </div>
        </div>
        <p className="muted" style={{ marginTop: "8px" }}>Total this staff: {mealLogs.length}</p>
        <div style={{ marginTop: "12px" }}>
          {mealLogs.length === 0 ? (
            <p className="muted">No meal tickets.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mealLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.amount}</td>
                    <td>
                      <button className="button secondary" onClick={() => deleteMealTicket(log.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Monthly Allowances (Add to Net Salary)</h2>
        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Amount</span>
            <input
              className="input"
              type="number"
              value={allowanceAmount}
              onChange={(e) => setAllowanceAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label>
            <span className="muted">Reason</span>
            <input
              className="input"
              value={allowanceReason}
              onChange={(e) => setAllowanceReason(e.target.value)}
              placeholder="e.g. Leave allowance, Refund"
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="button secondary" onClick={addAllowance}>Add Allowance</button>
          </div>
        </div>
        <p className="muted" style={{ marginTop: "8px" }}>Total this month: {allowances.length} allowance(s)</p>
        <div style={{ marginTop: "12px" }}>
          {allowances.length === 0 ? (
            <p className="muted">No allowances this month.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map((allowance) => (
                  <tr key={allowance.id}>
                    <td>{allowance.reason}</td>
                    <td>{allowance.amount}</td>
                    <td>
                      <button className="button secondary" onClick={() => deleteAllowance(allowance.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
