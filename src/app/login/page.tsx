import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: "520px" }}>
      <div className="card">
        <h1>Admin Login</h1>
        <p className="muted" style={{ marginTop: "8px" }}>
          Sign in to manage staff, payroll logs, and reports.
        </p>
        <div style={{ marginTop: "24px" }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
