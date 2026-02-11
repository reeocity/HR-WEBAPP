"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NewStaffMember = {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: string;
  phone: string | null;
  salary: string;
};

export default function NewStaffPage() {
  const router = useRouter();
  const [newStaff, setNewStaff] = useState<NewStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadNewStaff = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/staff/list");
        const data = await res.json();
        if (!res.ok) {
          setMessage(data?.message ?? "Failed to load staff.");
          return;
        }

        // Filter staff by resumption date (show recent staff)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentStaff = data.staff
          .filter((s: any) => new Date(s.resumptionDate) >= thirtyDaysAgo)
          .sort((a: any, b: any) => new Date(b.resumptionDate).getTime() - new Date(a.resumptionDate).getTime());

        // Fetch salary for each staff
        const staffWithSalary = await Promise.all(
          recentStaff.map(async (s: any) => {
            try {
              const salaryRes = await fetch(`/api/staff/${s.id}`);
              const salaryData = await salaryRes.json();
              // Get the latest salary
              const salary = salaryData.staff?.salary || "N/A";
              return { ...s, salary };
            } catch {
              return { ...s, salary: "N/A" };
            }
          })
        );

        setNewStaff(staffWithSalary);
      } catch (e) {
        setMessage("Failed to load new staff.");
      } finally {
        setIsLoading(false);
      }
    };

    loadNewStaff();
  }, []);

  const formatNaira = (amount: string | number) => {
    if (amount === "N/A") return amount;
    const num = typeof amount === "string" ? Number(amount) : amount;
    return "₦" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getDaysEmployed = (resumptionDate: string) => {
    const today = new Date();
    const hired = new Date(resumptionDate);
    const diffTime = Math.abs(today.getTime() - hired.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="grid" style={{ gap: "24px" }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Newly Employed Staff</h1>
          <button className="button secondary" onClick={() => router.push("/")}>
            Back
          </button>
        </div>

        <p className="muted" style={{ marginTop: "8px" }}>Showing staff employed in the last 30 days</p>

        {message && <p className="muted" style={{ marginTop: "8px", color: "red" }}>{message}</p>}

        {isLoading ? (
          <p className="muted" style={{ marginTop: "16px" }}>Loading...</p>
        ) : newStaff.length === 0 ? (
          <p className="muted" style={{ marginTop: "16px" }}>No new staff in the last 30 days.</p>
        ) : (
          <div style={{ marginTop: "16px", overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Resumption Date</th>
                  <th>Days Employed</th>
                  <th>Monthly Salary</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.staffId ?? "-"}</td>
                    <td><strong>{staff.fullName}</strong></td>
                    <td>{staff.department}</td>
                    <td>{staff.position}</td>
                    <td>{staff.resumptionDate}</td>
                    <td>
                      <span style={{ backgroundColor: "rgba(76, 175, 80, 0.2)", padding: "4px 8px", borderRadius: "4px" }}>
                        {getDaysEmployed(staff.resumptionDate)} days
                      </span>
                    </td>
                    <td><strong>{formatNaira(staff.salary)}</strong></td>
                    <td className="muted">{staff.phone ?? "-"}</td>
                    <td>
                      <button className="button secondary" onClick={() => router.push(`/staff/${staff.id}`)}>
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

      {newStaff.length > 0 && (
        <section className="card">
          <h2>Summary</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Total New Staff</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>{newStaff.length}</p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(33, 150, 243, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Total Monthly Payroll</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {formatNaira(newStaff.reduce((sum, s) => sum + (typeof s.salary === "string" && s.salary !== "N/A" ? Number(s.salary) : 0), 0))}
              </p>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(255, 193, 7, 0.1)", borderRadius: "8px" }}>
              <p className="muted">Average Days</p>
              <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {Math.round(newStaff.reduce((sum, s) => sum + getDaysEmployed(s.resumptionDate), 0) / newStaff.length)} days
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
