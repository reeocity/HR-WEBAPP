"use client";

import "./../payslip.css";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type PayslipData = {
  staff: {
    id: string;
    staffId: string | null;
    fullName: string;
    department: string;
    position: string;
    status: string | null;
    lastActiveDate: string | null;
  };
  salary: { monthlySalary: string; effectiveFrom: string } | null;
  lateness: { id: string; date: string; arrivalTime: string | null }[];
  absence: { id: string; date: string; type: "PERMISSION" | "NO_PERMISSION" }[];
  queries: { id: string; date: string; reason: string; surchargeAmount: string | null; penaltyDays: number | null }[];
  manual: { id: string; category: string; amount: string; note: string | null }[];
  allowances: { id: string; reason: string; amount: string }[];
  mealTickets: { id: string; date: string; amount: string }[];
  totals: {
    grossSalary: number;
    dailySalary: number;
    absenceDeduction: number;
    latenessDeductionDays: number;
    latenessDeduction: number;
    manualDeductionsTotal: number;
    allowancesTotal: number;
    querySurchargeTotal: number;
    queryPenaltyDaysTotal: number;
    queryPenaltyDeduction: number;
    mealTicketTotal: number;
    bankCharges: number;
    waterRate: number;
    oldStaffStatutory: number;
    defaultChargesTotal: number;
    newStaffStatutory: number;
    netSalary: number;
  };
};

export default function PayslipPage() {
  const params = useParams<{ staffId: string }>();
  const staffId = params.staffId;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<PayslipData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const load = useCallback(async () => {
    setMessage(null);
    const res = await fetch(`/api/payslips/${staffId}?month=${month}&year=${year}`);
    const json = await res.json();
    if (!res.ok) {
      setMessage(json?.message ?? "Failed to load payslip.");
      return;
    }
    setData(json);
  }, [staffId, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const grossSalary = data?.totals.grossSalary ?? 0;
  const manualDeductionsTotal = data?.totals.manualDeductionsTotal ?? 0;
  const querySurchargeTotal = data?.totals.querySurchargeTotal ?? 0;
  const absenceDeduction = data?.totals.absenceDeduction ?? 0;
  const latenessDeductionDays = data?.totals.latenessDeductionDays ?? 0;
  const latenessDeduction = data?.totals.latenessDeduction ?? 0;
  const netSalary = data?.totals.netSalary ?? 0;
  const queryPenaltyDaysTotal = data?.totals.queryPenaltyDaysTotal ?? 0;
  const queryPenaltyDeduction = data?.totals.queryPenaltyDeduction ?? 0;
  const mealTicketTotal = data?.totals.mealTicketTotal ?? 0;
  const allowancesTotal = data?.totals.allowancesTotal ?? 0;
  const bankCharges = data?.totals.bankCharges ?? 0;
  const waterRate = data?.totals.waterRate ?? 0;
  const oldStaffStatutory = data?.totals.oldStaffStatutory ?? 0;
  const newStaffStatutory = data?.totals.newStaffStatutory ?? 0;

  return (
    <section className="card payslip-card">
      <div className="no-print payslip-controls">
        <label>
          <span className="muted">Month</span>
          <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        </label>
        <label>
          <span className="muted">Year</span>
          <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
        <button className="button" onClick={() => window.print()}>Print Payslip</button>
      </div>

      {message ? <p className="muted">{message}</p> : null}

      {data ? (
        <div className="print-area">
          <h1>Monthly Payslip</h1>
          <p className="muted">Period: {month}/{year}</p>

          <div className="divider" />

          <div className="payslip-grid">
            <div>
              <p><strong>Name:</strong> {data.staff.fullName}</p>
              <p><strong>Staff ID:</strong> {data.staff.staffId ?? "-"}</p>
            </div>
            <div>
              <p><strong>Department:</strong> {data.staff.department}</p>
              <p><strong>Position:</strong> {data.staff.position}</p>
            </div>
          </div>
          {data.staff.status === "INACTIVE" ? (
            <p className="muted" style={{ marginTop: "6px" }}>
              Status: INACTIVE{data.staff.lastActiveDate ? ` (Last active: ${data.staff.lastActiveDate})` : ""}
            </p>
          ) : null}

          <div className="divider" />

          <h3>Salary Summary</h3>
          <div className="payslip-summary">
            <div className="label">Gross Monthly Salary</div>
            <div>{formatNaira(grossSalary)}</div>

            <div className="label">Absence Deduction</div>
            <div>-{formatNaira(absenceDeduction)}</div>

            <div className="label">Lateness Deduction ({latenessDeductionDays} day)</div>
            <div>-{formatNaira(latenessDeduction)}</div>

            <div className="label">Manual Deductions</div>
            <div>-{formatNaira(manualDeductionsTotal)}</div>

            <div className="label">Query Surcharges</div>
            <div>-{formatNaira(querySurchargeTotal)}</div>

            <div className="label">Query Penalty Days ({queryPenaltyDaysTotal} day)</div>
            <div>-{formatNaira(queryPenaltyDeduction)}</div>

            <div className="label">Meal Tickets</div>
            <div>-{formatNaira(mealTicketTotal)}</div>

            <div className="label">Bank Charges</div>
            <div>-{formatNaira(bankCharges)}</div>

            <div className="label">Water Rate</div>
            <div>-{formatNaira(waterRate)}</div>

            <div className="label">Old Staff Statutory</div>
            <div>-{formatNaira(oldStaffStatutory)}</div>

            {newStaffStatutory > 0 && (
              <>
                <div className="label">New Staff Statutory (25%)</div>
                <div>-{formatNaira(newStaffStatutory)}</div>
              </>
            )}

            <div className="label">Allowances</div>
            <div>+{formatNaira(allowancesTotal)}</div>

            <div className="label"><strong>Net Salary</strong></div>
            <div><strong>{formatNaira(netSalary)}</strong></div>
          </div>

          <div className="divider" />

          <h3>Queries</h3>
          {data.queries.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.queries.map((q) => (
                <li key={q.id}>{q.date}: {q.reason} (Surcharge: {q.surchargeAmount ? formatNaira(Number(q.surchargeAmount)) : "-"}, Penalty Days: {q.penaltyDays ?? "-"})</li>
              ))}
            </ul>
          )}

          <h3>Absence</h3>
          {data.absence.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.absence.map((a) => (
                <li key={a.id}>{a.date}: {a.type}</li>
              ))}
            </ul>
          )}

          <h3>Lateness</h3>
          {data.lateness.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.lateness.map((l) => (
                <li key={l.id}>{l.date}{l.arrivalTime ? ` — ${l.arrivalTime}` : ""}</li>
              ))}
            </ul>
          )}

          <h3>Manual Deductions</h3>
          {data.manual.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.manual.map((m) => (
                <li key={m.id}>{m.category}: {formatNaira(Number(m.amount))} {m.note ? `— ${m.note}` : ""}</li>
              ))}
            </ul>
          )}

          <h3>Allowances</h3>
          {data.allowances.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.allowances.map((a) => (
                <li key={a.id}>{a.reason}: {formatNaira(Number(a.amount))}</li>
              ))}
            </ul>
          )}

          <h3>Meal Tickets</h3>
          {data.mealTickets.length === 0 ? <p className="muted">None</p> : (
            <ul className="payslip-list">
              {data.mealTickets.map((m) => (
                <li key={m.id}>{m.date}: {formatNaira(Number(m.amount))}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}