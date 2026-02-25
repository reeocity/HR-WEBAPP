"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { useState } from "react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
}

function NavLink({ href, children, icon, isActive, onClick }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`nav-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {icon && <span className="nav-icon">{icon}</span>}
      {children}
    </Link>
  );
}

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

  const handleNavClick = () => setMobileMenuOpen(false);

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
            <NavLink href="/" icon="🏠" isActive={isActive("/")} onClick={handleNavClick}>Dashboard</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Staff Management</div>
            <NavLink href="/staff" icon="👥" isActive={isActive("/staff")} onClick={handleNavClick}>Staff Directory</NavLink>
            <NavLink href="/new-staff" icon="➕" isActive={isActive("/new-staff")} onClick={handleNavClick}>New Staff</NavLink>
            <NavLink href="/documents" icon="📄" isActive={isActive("/documents")} onClick={handleNavClick}>Documents</NavLink>
            <NavLink href="/confirmation-reminders" icon="⚠️" isActive={isActive("/confirmation-reminders")} onClick={handleNavClick}>Confirmations</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Attendance</div>
            <NavLink href="/lateness" icon="⏰" isActive={isActive("/lateness")} onClick={handleNavClick}>Lateness</NavLink>
            <NavLink href="/absence" icon="📅" isActive={isActive("/absence")} onClick={handleNavClick}>Absence</NavLink>
            <NavLink href="/leave-schedule" icon="🏖️" isActive={isActive("/leave-schedule")} onClick={handleNavClick}>Leave Schedule</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Payroll</div>
            <NavLink href="/queries" icon="❓" isActive={isActive("/queries")} onClick={handleNavClick}>Queries</NavLink>
            <NavLink href="/deductions" icon="💰" isActive={isActive("/deductions")} onClick={handleNavClick}>Deductions</NavLink>
            <NavLink href="/payroll" icon="💼" isActive={isActive("/payroll")} onClick={handleNavClick}>Payroll Runs</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <NavLink href="/reports/monthly" icon="📊" isActive={isActive("/reports/monthly")} onClick={handleNavClick}>Reports</NavLink>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-section">
            <div className="nav-section-title">Administration</div>
            <NavLink href="/users" icon="👤" isActive={isActive("/users")} onClick={handleNavClick}>Admin Users</NavLink>
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
