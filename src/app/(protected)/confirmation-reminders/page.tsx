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
  const [summary, setSummary] = useState<Summary | null>(null);
  const [grouped, setGrouped] = useState<Grouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'critical' | 'urgent' | 'approaching'>('all');

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 shadow-xl">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300/80">Confirmation Tracker</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white">Staff Confirmation</h1>
              <p className="mt-3 max-w-lg text-sm md:text-base text-slate-300">Track and manage staff confirmations. Flag critical cases that need immediate action.</p>
            </div>
            {summary && (
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3">
                  <div className="text-xs text-slate-300">Total</div>
                  <div className="text-3xl md:text-4xl font-bold text-white mt-1">{summary.total}</div>
                </div>
                <div className="rounded-xl bg-rose-500/20 backdrop-blur-sm border border-rose-400/30 px-4 py-3">
                  <div className="text-xs text-rose-200">Critical</div>
                  <div className="text-3xl md:text-4xl font-bold text-rose-100 mt-1">{summary.critical}</div>
                </div>
                <div className="rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 px-4 py-3">
                  <div className="text-xs text-amber-200">Urgent</div>
                  <div className="text-3xl md:text-4xl font-bold text-amber-100 mt-1">{summary.urgent}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pending</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{summary.total}</div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Critical (9+ mo)</div>
                <div className="text-3xl font-bold text-rose-900 mt-2">{summary.critical}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Urgent (6-9 mo)</div>
                <div className="text-3xl font-bold text-amber-900 mt-2">{summary.urgent}</div>
              </div>
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-yellow-600">Approaching</div>
                <div className="text-3xl font-bold text-yellow-900 mt-2">{summary.approaching}</div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'critical', label: 'Critical' },
                { id: 'urgent', label: 'Urgent' },
                { id: 'approaching', label: 'Approaching' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  view === item.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
              Loading reminders...
            </div>
          ) : getDisplayReminders().length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
              No staff pending confirmation in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {getDisplayReminders().map((staff) => {
                const urgencyLevel =
                  staff.monthsSinceResumption >= 9 ? 'critical' :
                  staff.monthsSinceResumption >= 6 ? 'urgent' : 'approaching';

                const urgencyConfig = {
                  critical: {
                    badge: 'border-rose-300 bg-rose-50 text-rose-700',
                    accent: 'border-rose-200 bg-rose-50/50',
                    icon: '⚠️'
                  },
                  urgent: {
                    badge: 'border-amber-300 bg-amber-50 text-amber-700',
                    accent: 'border-amber-200 bg-amber-50/50',
                    icon: '⚡'
                  },
                  approaching: {
                    badge: 'border-yellow-300 bg-yellow-50 text-yellow-700',
                    accent: 'border-yellow-200 bg-yellow-50/50',
                    icon: '⏰'
                  }
                };

                return (
                  <div key={staff.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{staff.fullName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{staff.department} • {staff.position}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${urgencyConfig[urgencyLevel].badge}`}>
                            <span>{urgencyConfig[urgencyLevel].icon}</span>
                            {urgencyLevel.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">{staff.staffId ? `ID: ${staff.staffId}` : 'Staff ID not assigned'}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
                          <span>📅 Resumed: {formatDate(staff.resumptionDate)}</span>
                          {staff.phone && <span>📞 {staff.phone}</span>}
                        </div>
                      </div>

                      <div className={`flex flex-col items-start lg:items-end gap-3 rounded-xl border p-4 ${urgencyConfig[urgencyLevel].accent}`}>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-slate-900">{staff.monthsSinceResumption}</div>
                          <div className="text-xs text-slate-600 mt-0.5">months employed</div>
                          <div className="text-xs text-slate-500 mt-1">{staff.daysSinceResumption} days</div>
                        </div>
                        <div className="w-full border-t border-slate-200/50 pt-3">
                          <span className="inline-block text-xs font-semibold text-slate-600">
                            Offer Letter: <span className={staff.offerLetterGiven ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                              {staff.offerLetterGiven ? '✓ Given' : '✗ Pending'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        onClick={() => confirmStaff(staff.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 hover:shadow-lg transition-all duration-200 order-2 sm:order-1"
                      >
                        ✓ Confirm
                      </button>
                      <a
                        href={`/staff/${staff.staffId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:shadow-md transition-all duration-200 order-1 sm:order-2"
                      >
                        👤 Profile
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
