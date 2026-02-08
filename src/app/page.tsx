import Link from "next/link";

export default function StaffListPage() {
  return (
    <div className="grid" style={{ gap: "24px" }}>
      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1>Staff List</h1>
            <p className="muted">Upload the official Excel file to create or update staff records.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="button">Upload Excel</button>
            <button className="button secondary">Add Staff (optional)</button>
          </div>
        </div>
        <div className="grid grid-3" style={{ marginTop: "16px" }}>
          <label>
            <span className="muted">Search by name or staff ID</span>
            <input className="input" placeholder="Search staff..." />
          </label>
          <label>
            <span className="muted">Department</span>
            <select className="select">
              <option>All departments</option>
            </select>
          </label>
          <label>
            <span className="muted">Status</span>
            <select className="select">
              <option>All statuses</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Staff Records</h2>
        <p className="muted" style={{ marginTop: "8px" }}>
          No staff records yet. Use the Excel upload to begin.
        </p>
        <div style={{ marginTop: "16px" }}>
          <Link className="button secondary" href="/staff/preview">
            Open staff profile placeholder
          </Link>
        </div>
      </section>
    </div>
  );
}
