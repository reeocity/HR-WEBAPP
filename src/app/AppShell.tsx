"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login" || pathname === "/setup";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (hideNav) {
    return <div>{children}</div>;
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: string }) => (
    <Link 
      href={href} 
      className={`nav-link ${isActive(href) ? 'active' : ''}`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {icon && <span className="nav-icon">{icon}</span>}
      {children}
    </Link>
  );

  return (
    <div>
      <header className="nav">
        <div className="nav-brand">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="brand-title">HR Payroll Admin</div>
            <div className="brand-subtitle">Version 1.0 — Admin Portal</div>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-section">
            <NavLink href="/" icon="🏠">Dashboard</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Staff Management</div>
            <NavLink href="/staff" icon="👥">Staff Directory</NavLink>
            <NavLink href="/new-staff" icon="➕">New Staff</NavLink>
            <NavLink href="/documents" icon="📄">Documents</NavLink>
            <NavLink href="/confirmation-reminders" icon="⚠️">Confirmations</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Attendance</div>
            <NavLink href="/lateness" icon="⏰">Lateness</NavLink>
            <NavLink href="/absence" icon="📅">Absence</NavLink>
            <NavLink href="/leave-schedule" icon="🏖️">Leave Schedule</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Payroll</div>
            <NavLink href="/queries" icon="❓">Queries</NavLink>
            <NavLink href="/deductions" icon="💰">Deductions</NavLink>
            <NavLink href="/payroll" icon="💼">Payroll Runs</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <NavLink href="/reports/monthly" icon="📊">Reports</NavLink>
          </div>
        </nav>

        <div className="nav-actions">
          <LogoutButton />
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
