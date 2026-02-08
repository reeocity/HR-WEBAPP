export default function StaffProfilePage() {
  return (
    <div className="grid" style={{ gap: "24px" }}>
      <section className="card">
        <h1>Staff Profile</h1>
        <p className="muted">Basic info will appear here after staff data is imported.</p>
      </section>

      <section className="card">
        <h2>Guarantors</h2>
        <div className="grid grid-2" style={{ marginTop: "12px" }}>
          <div className="card">
            <strong>Slot 1</strong>
            <p className="muted">No guarantor added yet.</p>
          </div>
          <div className="card">
            <strong>Slot 2</strong>
            <p className="muted">No guarantor added yet.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Salary History</h2>
        <p className="muted">No salary entries yet.</p>
        <button className="button" style={{ marginTop: "12px" }}>
          Add salary entry
        </button>
      </section>

      <section className="card">
        <h2>Activity Tabs</h2>
        <p className="muted">Lateness, absence, queries, deductions, and payroll history will show here.</p>
      </section>
    </div>
  );
}
