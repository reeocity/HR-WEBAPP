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
  phone: string | null;
  resumptionDate: string;
};

type LatenessLog = { id: string; date: string };
type AbsenceLog = { id: string; date: string; type: "PERMISSION" | "NO_PERMISSION" };

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const staffId = params.id;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [latenessDate, setLatenessDate] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceType, setAbsenceType] = useState<"PERMISSION" | "NO_PERMISSION">("NO_PERMISSION");
  const [queryDate, setQueryDate] = useState("");
  const [queryReason, setQueryReason] = useState("");
  const [querySurcharge, setQuerySurcharge] = useState("");
  const [queryPenaltyDays, setQueryPenaltyDays] = useState("");
  const [mealDate, setMealDate] = useState("");

  const [latenessLogs, setLatenessLogs] = useState<LatenessLog[]>([]);
  const [absenceLogs, setAbsenceLogs] = useState<AbsenceLog[]>([]);
  const [mealLogs, setMealLogs] = useState<{ id: string; date: string; amount: string }[]>([]);

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
        setMealLogs(data.mealTickets ?? []);
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
      body: JSON.stringify({ date: latenessDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.message ?? "Failed to add lateness.");
      return;
    }
    setLatenessLogs((prev) => [data.log, ...prev]);
    setLatenessDate("");
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
    setQueryDate("");
    setQueryReason("");
    setQuerySurcharge("");
    setQueryPenaltyDays("");
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
            <select className="select" value={staff.status ?? "ACTIVE"} onChange={(e) => setStaff({ ...staff, status: e.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
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
        </div>
      </section>

      <section className="card">
        <h2>Attendance</h2>
        <div className="grid grid-3" style={{ gap: "12px", marginTop: "12px" }}>
          <label>
            <span className="muted">Lateness Date</span>
            <input className="input" type="date" value={latenessDate} onChange={(e) => setLatenessDate(e.target.value)} />
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
      </section>
    </div>
  );
}
