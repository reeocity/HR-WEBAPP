"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";

  if (hideNav) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <header className="nav">
        <div>
          <strong>HR Payroll Admin Report App</strong>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            Version 1 — Admin only
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/">Staff</Link>
          <Link href="/lateness">Lateness</Link>
          <Link href="/absence">Absence</Link>
          <Link href="/queries">Queries</Link>
          <Link href="/deductions">Manual Deductions</Link>
          <Link href="/payroll">Payroll Runs</Link>
        </nav>
        <LogoutButton />
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
