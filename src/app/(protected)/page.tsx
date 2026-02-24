"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardStats = {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  totalDepartments: number;
  documentsComplete: number;
  documentsIncomplete: number;
  pendingConfirmation: number;
  criticalConfirmations: number;
};

const StatCard = ({ icon, label, value, color, delay }: { icon: string; label: string; value: number; color: string; delay: number }) => (
  <div
    style={{
      animation: `slideUp 0.6s ease-out ${delay}s backwards`,
      opacity: 0,
    }}
  >
    <style>{`
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>
    <div
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}40`,
        borderRadius: "16px",
        padding: "24px",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = "translateY(-4px)";
        target.style.boxShadow = `0 12px 24px ${color}20`;
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = "translateY(0)";
        target.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "8px" }}>{label}</p>
          <p style={{ fontSize: "2.5rem", fontWeight: "700", color: color, marginBottom: "4px" }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: "2rem" }}>{icon}</div>
      </div>
    </div>
  </div>
);

const ActionCard = ({
  title,
  description,
  icon,
  href,
  color,
  delay,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  delay: number;
}) => (
  <Link
    href={href}
    style={{
      animation: `slideUp 0.6s ease-out ${delay}s backwards`,
      textDecoration: "none",
      color: "inherit",
    }}
  >
    <div
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        border: `1px solid ${color}30`,
        borderRadius: "16px",
        padding: "24px",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = "translateY(-6px)";
        target.style.boxShadow = `0 20px 40px ${color}25`;
        target.style.borderColor = color + "60";
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = "translateY(0)";
        target.style.boxShadow = "none";
        target.style.borderColor = color + "30";
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0" }}>
        {description}
      </p>
      <div
        style={{
          position: "absolute",
          bottom: "-1px",
          right: "-1px",
          width: "100px",
          height: "100px",
          background: `radial-gradient(circle, ${color}10, transparent)`,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
    </div>
  </Link>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [staffRes, docsRes, confirmRes] = await Promise.all([
          fetch("/api/staff/list"),
          fetch("/api/staff/documents?filter=all"),
          fetch("/api/staff/confirmation-reminders")
        ]);

        const [staffData, docsData, confirmData] = await Promise.all([
          staffRes.json(),
          docsRes.json(),
          confirmRes.json()
        ]);

        if (staffRes.ok && staffData.staff) {
          const staff = staffData.staff;
          setStats({
            totalStaff: staff.length,
            activeStaff: staff.filter((s: { status: string }) => s.status === "ACTIVE").length,
            inactiveStaff: staff.filter((s: { status: string }) => s.status === "INACTIVE").length,
            totalDepartments: new Set(staff.map((s: { department: string }) => s.department)).size,
            documentsComplete: docsData.summary?.complete || 0,
            documentsIncomplete: docsData.summary?.incomplete || 0,
            pendingConfirmation: confirmData.summary?.total || 0,
            criticalConfirmations: confirmData.summary?.critical || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div style={{ padding: "0" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)",
          borderRadius: "24px",
          padding: "60px 40px",
          marginBottom: "40px",
          color: "white",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            right: "-10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-5%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "12px",
              animation: "fadeInDown 0.8s ease-out",
            }}
          >
            HR Payroll Admin Dashboard
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.95,
              marginBottom: "24px",
              animation: "fadeInUp 0.8s ease-out 0.1s backwards",
            }}
          >
            Manage staff, payroll, and reporting all in one place
          </p>
          <style>{`
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>

      {/* Alerts Section */}
      {!isLoading && stats && (stats.pendingConfirmation > 0 || stats.documentsIncomplete > 0) && (
        <div style={{ marginBottom: "32px" }}>
          {stats.criticalConfirmations > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #fee2e2, #fef3c7)",
                border: "1px solid #ef4444",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "start",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "2rem" }}>🚨</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: "600", color: "#dc2626", marginBottom: "4px" }}>
                  Critical Action Required
                </h3>
                <p style={{ color: "#7c2d12", marginBottom: "12px" }}>
                  {stats.criticalConfirmations} staff member{stats.criticalConfirmations !== 1 ? 's have' : ' has'} been employed for 9+ months without confirmation.
                </p>
                <Link
                  href="/confirmation-reminders"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#dc2626",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  View Critical Cases →
                </Link>
              </div>
            </div>
          )}
          
          {stats.pendingConfirmation > 0 && stats.criticalConfirmations === 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fef9c3)",
                border: "1px solid #f59e0b",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "start",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "2rem" }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: "600", color: "#92400e", marginBottom: "4px" }}>
                  Pending Confirmations
                </h3>
                <p style={{ color: "#78350f", marginBottom: "12px" }}>
                  {stats.pendingConfirmation} staff member{stats.pendingConfirmation !== 1 ? 's need' : ' needs'} confirmation (6+ months employed).
                </p>
                <Link
                  href="/confirmation-reminders"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f59e0b",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  Review Confirmations →
                </Link>
              </div>
            </div>
          )}

          {stats.documentsIncomplete > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #dbeafe, #e0f2fe)",
                border: "1px solid #3b82f6",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "start",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "2rem" }}>📋</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: "600", color: "#1e40af", marginBottom: "4px" }}>
                  Incomplete Documents
                </h3>
                <p style={{ color: "#1e3a8a", marginBottom: "12px" }}>
                  {stats.documentsIncomplete} staff member{stats.documentsIncomplete !== 1 ? 's have' : ' has'} incomplete document submissions.
                </p>
                <Link
                  href="/documents?filter=incomplete"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#3b82f6",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  View Incomplete Documents →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <p>Loading dashboard...</p>
        </div>
      ) : stats ? (
        <>
          {/* Primary Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <StatCard icon="👥" label="Total Staff" value={stats.totalStaff} color="#3b82f6" delay={0} />
            <StatCard icon="✅" label="Active Staff" value={stats.activeStaff} color="#10b981" delay={0.1} />
            <StatCard icon="⏸️" label="Inactive Staff" value={stats.inactiveStaff} color="#f59e0b" delay={0.2} />
            <StatCard icon="🏢" label="Departments" value={stats.totalDepartments} color="#8b5cf6" delay={0.3} />
          </div>

          {/* Document & Confirmation Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <StatCard icon="📄" label="Documents Complete" value={stats.documentsComplete} color="#06b6d4" delay={0.4} />
            <StatCard icon="📋" label="Documents Pending" value={stats.documentsIncomplete} color="#f97316" delay={0.5} />
            <StatCard icon="⚠️" label="Needs Confirmation" value={stats.pendingConfirmation} color="#ef4444" delay={0.6} />
            {stats.criticalConfirmations > 0 && (
              <StatCard icon="🚨" label="Critical (9+ months)" value={stats.criticalConfirmations} color="#dc2626" delay={0.7} />
            )}
          </div>
        </>
      ) : null}

      {/* Quick Actions */}
      <div style={{ marginBottom: "40px" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            marginBottom: "24px",
            color: "#0f172a",
            animation: "fadeIn 0.8s ease-out",
          }}
        >
          Quick Actions
        </h2>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <ActionCard
            icon="📋"
            title="Staff Directory"
            description="View, add, or manage staff records"
            href="/staff"
            color="#3b82f6"
            delay={0.4}
          />
          <ActionCard
            icon="�"
            title="Documents & Confirmation"
            description="Track document submission and staff confirmation"
            href="/documents"
            color="#06b6d4"
            delay={0.45}
          />
          <ActionCard
            icon="⚠️"
            title="Confirmation Reminders"
            description="Staff pending confirmation (6+ months)"
            href="/confirmation-reminders"
            color="#ef4444"
            delay={0.5}
          />
          <ActionCard
            icon="📅"
            title="Leave Schedule"
            description="Manage leave dates and schedules"
            href="/leave-schedule"
            color="#10b981"
            delay={0.55}
          />
          <ActionCard
            icon="⏰"
            title="Attendance"
            description="Track lateness and absence records"
            href="/lateness"
            color="#f59e0b"
            delay={0.6}
          />
          <ActionCard
            icon="💼"
            title="Payroll Setup"
            description="Configure allowances and deductions"
            href="/payroll"
            color="#8b5cf6"
            delay={0.65}
          />
          <ActionCard
            icon="📊"
            title="Monthly Report"
            description="Generate comprehensive monthly reports"
            href="/reports/monthly"
            color="#ec4899"
            delay={0.7}
          />
          <ActionCard
            icon="🔧"
            title="Deductions"
            description="Manage manual staff deductions"
            href="/deductions"
            color="#14b8a6"
            delay={0.75}
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "16px",
          padding: "32px",
          animation: "slideUp 0.8s ease-out 1s backwards",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "16px", color: "#0f172a" }}>
          Getting Started
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "4px", color: "#0f172a" }}>1. Import Staff</p>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Upload your staff list via Excel</p>
          </div>
          <div style={{ padding: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "4px", color: "#0f172a" }}>2. Setup Payroll</p>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Configure allowances and deductions</p>
          </div>
          <div style={{ padding: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "4px", color: "#0f172a" }}>3. Track Attendance</p>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Record lateness and absences</p>
          </div>
          <div style={{ padding: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "4px", color: "#0f172a" }}>4. Generate Reports</p>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Create monthly payroll reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
