import SetupForm from "./setup-form";
import DbStatus from "@/components/DbStatus";

export default function SetupPage() {
  return (
    <div className="container" style={{ maxWidth: "560px" }}>
      <div className="card">
        <h1>Admin Setup</h1>
        <p className="muted" style={{ marginTop: "8px" }}>
          Create the first admin account. This page is disabled once an admin exists.
        </p>
        <div style={{ marginTop: "24px" }}>
          <SetupForm />
          <DbStatus />
        </div>
      </div>
    </div>
  );
}
