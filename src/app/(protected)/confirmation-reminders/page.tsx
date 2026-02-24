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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Staff Confirmation Reminders</h1>
        <p className="text-gray-600">Staff members requiring confirmation (6+ months since resumption)</p>
      </div>

      {/* Alert Banner */}
      {summary && summary.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-900">Action Required</h3>
              <p className="text-red-700 text-sm">
                {summary.total} staff member{summary.total !== 1 ? 's' : ''} pending confirmation. 
                {summary.critical > 0 && (
                  <span className="font-semibold"> {summary.critical} critical (9+ months).</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Total Pending</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Critical (9+ months)</div>
            <div className="text-2xl font-bold text-red-900">{summary.critical}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Urgent (6-9 months)</div>
            <div className="text-2xl font-bold text-orange-900">{summary.urgent}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Approaching (5-6 months)</div>
            <div className="text-2xl font-bold text-yellow-900">{summary.approaching}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 font-medium ${
            view === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Pending
        </button>
        <button
          onClick={() => setView('critical')}
          className={`px-4 py-2 font-medium ${
            view === 'critical'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Critical
        </button>
        <button
          onClick={() => setView('urgent')}
          className={`px-4 py-2 font-medium ${
            view === 'urgent'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Urgent
        </button>
        <button
          onClick={() => setView('approaching')}
          className={`px-4 py-2 font-medium ${
            view === 'approaching'
              ? 'border-b-2 border-yellow-500 text-yellow-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Approaching
        </button>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : getDisplayReminders().length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <div className="text-green-600 text-4xl mb-2">✓</div>
          <p className="text-gray-600">No staff pending confirmation in this category</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resumption Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Months Employed</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Offer Letter</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {getDisplayReminders().map((staff) => {
                const urgencyLevel = 
                  staff.monthsSinceResumption >= 9 ? 'critical' :
                  staff.monthsSinceResumption >= 6 ? 'urgent' : 'approaching';
                
                const urgencyColors = {
                  critical: 'bg-red-100 text-red-800',
                  urgent: 'bg-orange-100 text-orange-800',
                  approaching: 'bg-yellow-100 text-yellow-800'
                };

                return (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{staff.fullName}</div>
                      <div className="text-sm text-gray-500">{staff.staffId || 'No ID'}</div>
                      {staff.phone && (
                        <div className="text-xs text-gray-400">{staff.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{staff.department}</div>
                      <div className="text-xs text-gray-500">{staff.position}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(staff.resumptionDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-lg font-bold">{staff.monthsSinceResumption}</div>
                      <div className="text-xs text-gray-500">{staff.daysSinceResumption} days</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {staff.offerLetterGiven ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgencyColors[urgencyLevel]}`}>
                        {urgencyLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => confirmStaff(staff.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Confirm Now
                        </button>
                        <a
                          href={`/staff/${staff.id}`}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
