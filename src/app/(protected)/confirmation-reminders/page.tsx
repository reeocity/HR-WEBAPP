'use client';

import { useState, useEffect } from 'react';

interface ConfirmationReminder {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: string;
  offerLetterGiven: boolean;
  phone: string | null;
  daysSinceResumption: number;
  monthsSinceResumption: number;
  needsConfirmation: boolean;
}

interface Summary {
  total: number;
  critical: number;
  urgent: number;
  approaching: number;
}

interface Grouped {
  critical: ConfirmationReminder[];
  urgent: ConfirmationReminder[];
  approaching: ConfirmationReminder[];
}

export default function ConfirmationRemindersPage() {
  const [reminders, setReminders] = useState<ConfirmationReminder[]>([]);
  const [allStaff, setAllStaff] = useState<ConfirmationReminder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [grouped, setGrouped] = useState<Grouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'critical' | 'urgent' | 'approaching' | 'confirmed'>('all');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/confirmation-reminders');
      const data = await response.json();
      setReminders(data.reminders);
      setSummary(data.summary);
      setGrouped(data.grouped);
      setAllStaff(data.allStaff || data.reminders);
    } catch (error) {
      console.error('Error fetching confirmation reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmStaff = async (staffId: string) => {
    try {
      const response = await fetch('/api/staff/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId, 
          isConfirmed: true,
          confirmationDate: new Date().toISOString()
        }),
      });

      if (response.ok) {
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error confirming staff:', error);
    }
  };

  const getDisplayReminders = () => {
    if (!grouped) return [];
    
    switch (view) {
      case 'critical':
        return grouped.critical;
      case 'urgent':
        return grouped.urgent;
      case 'approaching':
        return grouped.approaching;
      case 'confirmed':
        return allStaff.filter(staff => staff.isConfirmed);
      default:
        return reminders;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container">
      <section className="card">
        <div style={{ marginBottom: "20px" }}>
          <h1>Staff Confirmation</h1>
          <p className="muted" style={{ marginTop: "4px" }}>Track staff awaiting manual confirmation</p>
        </div>

        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.5)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.35)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px" }}>TOTAL PENDING</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{summary.total}</div>
            </div>
            <div style={{ background: "rgba(244, 63, 94, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(244, 63, 94, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#9f1239" }}>CRITICAL (9+ MO)</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#9f1239" }}>{summary.critical}</div>
            </div>
            <div style={{ background: "rgba(217, 119, 6, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(217, 119, 6, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#9a3412" }}>URGENT (6-9 MO)</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#9a3412" }}>{summary.urgent}</div>
            </div>
            <div style={{ background: "rgba(250, 204, 21, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(250, 204, 21, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#b45309" }}>APPROACHING</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#b45309" }}>{summary.approaching}</div>
            </div>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(34, 197, 94, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#166534" }}>CONFIRMED</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#166534" }}>{allStaff.filter(s => s.isConfirmed).length}</div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {(
            [
              { id: 'all', label: 'All Pending' },
              { id: 'critical', label: 'Critical' },
              { id: 'urgent', label: 'Urgent' },
              { id: 'approaching', label: 'Approaching' },
              { id: 'confirmed', label: 'Confirmed' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={view === item.id ? 'button' : 'button secondary'}
              style={{ fontSize: '12px' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted" style={{ marginTop: "12px" }}>Loading confirmation reminders...</p>
        ) : getDisplayReminders().length === 0 ? (
          <p className="muted" style={{ marginTop: "12px" }}>
            {view === 'confirmed' ? 'No confirmed staff yet.' : 'No staff pending confirmation in this category.'}
          </p>
        ) : (
          <div style={{ marginTop: "12px", overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Days Employed</th>
                  <th>Months Employed</th>
                  {view !== 'confirmed' && <th>Status</th>}
                  <th>Offer Letter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getDisplayReminders().map((staff) => {
                  const urgencyLevel =
                    staff.monthsSinceResumption >= 9 ? 'critical' :
                    staff.monthsSinceResumption >= 6 ? 'urgent' : 'approaching';

                  const getStatusBadge = (level: string) => {
                    const styles = {
                      critical: { background: "rgba(244, 63, 94, 0.15)", color: "#9f1239", border: "1px solid rgba(244, 63, 94, 0.4)" },
                      urgent: { background: "rgba(217, 119, 6, 0.15)", color: "#9a3412", border: "1px solid rgba(217, 119, 6, 0.4)" },
                      approaching: { background: "rgba(250, 204, 21, 0.15)", color: "#b45309", border: "1px solid rgba(250, 204, 21, 0.4)" },
                    };
                    return styles[level as keyof typeof styles] || styles.approaching;
                  };

                  const badge = getStatusBadge(urgencyLevel);

                  return (
                    <tr key={staff.id}>
                      <td style={{ fontWeight: "600" }}>{staff.staffId || "—"}</td>
                      <td>{staff.fullName}</td>
                      <td>{staff.department}</td>
                      <td>{staff.position}</td>
                      <td>{staff.daysSinceResumption}</td>
                      <td style={{ fontWeight: "600", fontSize: "16px" }}>{staff.monthsSinceResumption} mo</td>
                      {view !== 'confirmed' && (
                        <td>
                          <span style={{ ...badge, padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", display: "inline-block" }}>
                            {urgencyLevel.toUpperCase()}
                          </span>
                        </td>
                      )}
                      <td>{staff.offerLetterGiven ? "✓ Yes" : "✗ No"}</td>
                      <td style={{ textAlign: "right" }}>
                        {view !== 'confirmed' && (
                          <button 
                            onClick={() => confirmStaff(staff.id)}
                            className="button secondary"
                            style={{ fontSize: "11px", padding: "6px 12px", marginRight: "4px" }}
                          >
                            Confirm
                          </button>
                        )}
                        <a 
                          href={`/staff/${staff.id}`}
                          className="button secondary"
                          style={{ fontSize: "11px", padding: "6px 12px" }}
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
