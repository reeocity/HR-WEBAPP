"use client";

import { useEffect, useState, useCallback } from "react";

type StaffMini = {
  id: string;
  staffId: string | null;
  fullName: string;
};

type StaffListItem = {
  id: string;
  staffId: string | null;
  fullName: string;
};

type StaffListResponse = {
  staff: StaffListItem[];
};

type DeductionRow = {
  id: string;
  month: number;
  year: number;
  category: string;
  amount: string;
  note: string | null;
  staff: {
    id: string;
    staffId: string | null;
    fullName: string;
    department: string;
    position: string;
  };
  createdAt: string;
};

const categories = [
  "NEW_STAFF_STATUTORY_DEDUCTION",
  "ABSENCE_LATENESS_PERMISSION",
  "CITY_LEDGER_QUERY",
  "STAFF_MEAL_TICKET",
  "CONTROL_DEBT",
  "STAFF_RENT",
  "BANK_CHARGES",
  "OLD_STATUTORY_DEDUCTION",
  "PAYEE",
  "DEBT_DEDUCT",
  "MEETING_DEBIT",
  "CLEANING_DEBIT",
  "OTHER",
];

export default function ManualDeductionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [staff, setStaff] = useState<StaffMini[]>([]);
  const [staffId, setStaffId] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [logs, setLogs] = useState<DeductionRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStaff = async () => {
    const res = await fetch("/api/staff/list");
    const data: StaffListResponse = await res.json();
    if (res.ok) {
      setStaff((data.staff ?? []).map((s) => ({ id: s.id, staffId: s.staffId, fullName: s.fullName })));
    }
  };

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/deductions?month=${month}&year=${year}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? "Failed to load deductions.");
        return;
      }
      setLogs(data.logs ?? []);
    } catch {
      setMessage("Failed to load deductions.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  const createDeduction = async () => {
    setMessage(null);
    const res = await fetch("/api/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, month, year, category, amount, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to create.");
      return;
    }
    setAmount("");
    setNote("");
    await loadLogs();
  };

  const deleteDeduction = async (id: string) => {
    if (!window.confirm("Delete this deduction?")) return;
    setMessage(null);
    const res = await fetch("/api/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to delete.");
      return;
    }
    await loadLogs();
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <section className="card">
      <h1>Manual Deductions</h1>
      <p className="muted">Add monthly manual deductions by category.</p>

      <div className="grid grid-3" style={{ marginTop: "16px", gap: "12px" }}>
        <label>
          <span className="muted">Month</span>
          <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        </label>
        <label>
          <span className="muted">Year</span>
          <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
      </div>

      <div className="grid grid-3" style={{ marginTop: "12px", gap: "12px" }}>
        <label>
          <span className="muted">Staff</span>
          <select className="select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Select staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.staffId ?? "-"} — {s.fullName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="muted">Category</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="muted">Amount</span>
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          <span className="muted">Note / Reason</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="button" onClick={createDeduction} disabled={!staffId || !amount}>
            Add Deduction
          </button>
        </div>
      </div>

      {message ? <p className="muted" style={{ marginTop: "8px" }}>{message}</p> : null}

      <div className="divider" />

      {isLoading ? (
        <p className="muted">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="muted">No entries for this month.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.createdAt}</td>
                  <td>{l.staff.staffId ?? "-"} — {l.staff.fullName}</td>
                  <td>{l.category}</td>
                  <td>{l.amount}</td>
                  <td>{l.note ?? "-"}</td>
                  <td>
                    <button className="button secondary" onClick={() => deleteDeduction(l.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
