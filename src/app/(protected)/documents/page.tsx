'use client';

import { useState, useEffect, useCallback } from 'react';

interface StaffDocument {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: string;
  isConfirmed: boolean;
  confirmationDate: string | null;
  offerLetterGiven: boolean;
  offerLetterDate: string | null;
  hasValidId: boolean;
  hasProofOfAddress: boolean;
  hasPassportPhotos: boolean;
  hasQualification: boolean;
  hasGuarantorForms: boolean;
  documentsVerifiedAt: string | null;
  documentsVerifiedBy: string | null;
  documentsComplete: boolean;
  documentsCount: number;
  totalDocuments: number;
  daysSinceResumption: number;
  needsConfirmationReminder: boolean;
}

interface Summary {
  total: number;
  complete: number;
  incomplete: number;
  needsConfirmation: number;
}

const documentChecklist = [
  { key: 'hasValidId', label: 'Valid ID (NIN/Passport)', short: 'ID' },
  { key: 'hasProofOfAddress', label: 'Proof of Address', short: 'Address' },
  { key: 'hasPassportPhotos', label: 'Two Passport Photos', short: 'Photos' },
  { key: 'hasQualification', label: 'Highest Qualification', short: 'Qualification' },
  { key: 'hasGuarantorForms', label: 'Guarantor Forms', short: 'Guarantor' },
] as const;

export default function DocumentsPage() {
  const [staff, setStaff] = useState<StaffDocument[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete' | 'needs-confirmation'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffDocument | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStaffDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/documents?filter=${filter}`);
      const data = await response.json();
      setStaff(data.staff);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching staff documents:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStaffDocuments();
  }, [filter, fetchStaffDocuments]);

  const updateDocumentStatus = async (staffId: string, updates: Partial<StaffDocument>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/staff/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, ...updates }),
      });

      if (response.ok) {
        await fetchStaffDocuments();
        setSelectedStaff(null);
      }
    } catch (error) {
      console.error('Error updating documents:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickUpdate = async (staffId: string, field: keyof StaffDocument, value: boolean) => {
    await updateDocumentStatus(staffId, { [field]: value });
  };

  const getMissingDocs = (staffItem: StaffDocument) => {
    return documentChecklist.filter((doc) => !staffItem[doc.key]).map((doc) => doc);
  };

  const getCompletionPercent = (staffItem: StaffDocument) => {
    if (!staffItem.totalDocuments) return 0;
    return Math.round((staffItem.documentsCount / staffItem.totalDocuments) * 100);
  };

  const filterCounts = {
    all: summary?.total ?? 0,
    complete: summary?.complete ?? 0,
    incomplete: summary?.incomplete ?? 0,
    'needs-confirmation': summary?.needsConfirmation ?? 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 shadow-xl">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Document Management</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white">Staff Documents</h1>
              <p className="mt-3 max-w-lg text-sm md:text-base text-slate-300">Ensure complete documentation for every staff member. Track submissions and confirmations.</p>
            </div>
            {summary && (
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3">
                  <div className="text-xs text-slate-300">Total</div>
                  <div className="text-3xl md:text-4xl font-bold text-white mt-1">{summary.total}</div>
                </div>
                <div className="rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 px-4 py-3">
                  <div className="text-xs text-emerald-200">Complete</div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-100 mt-1">{summary.complete}</div>
                </div>
                <div className="rounded-xl bg-rose-500/20 backdrop-blur-sm border border-rose-400/30 px-4 py-3">
                  <div className="text-xs text-rose-200">Pending</div>
                  <div className="text-3xl md:text-4xl font-bold text-rose-100 mt-1">{summary.incomplete}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          {summary && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Staff</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{summary.total}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Complete</div>
                <div className="text-3xl font-bold text-emerald-900 mt-2">{summary.complete}</div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Incomplete</div>
                <div className="text-3xl font-bold text-rose-900 mt-2">{summary.incomplete}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm hover:shadow-md transition">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending Confirm</div>
                <div className="text-3xl font-bold text-amber-900 mt-2">{summary.needsConfirmation}</div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {(
              [
                { id: 'all', label: 'All', count: filterCounts.all },
                { id: 'complete', label: 'Complete', count: filterCounts.complete },
                { id: 'incomplete', label: 'Incomplete', count: filterCounts.incomplete },
                { id: 'needs-confirmation', label: 'Needs Confirmation', count: filterCounts['needs-confirmation'] },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  filter === item.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
                <span className={`text-xs font-bold ${filter === item.id ? 'bg-white/20' : 'bg-slate-100'} px-2 py-0.5 rounded-full`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* Loading & Empty States */}
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-400">
              <div className="text-lg font-semibold mb-2">📋 Loading documents...</div>
              <p className="text-sm">Please wait while we fetch the staff records.</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-400">
              <div className="text-lg font-semibold mb-2">✓ All caught up!</div>
              <p className="text-sm">No staff members in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {staff.map((s) => {
                const missing = getMissingDocs(s);
                const percent = getCompletionPercent(s);

                return (
                  <div key={s.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{s.fullName}</h3>
                            <p className="text-sm text-slate-600 mt-1">{s.department} • {s.position}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {s.documentsComplete ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              ✓ Documents Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                              ⚠️ Documents Pending
                            </span>
                          )}
                          {s.needsConfirmationReminder && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                              📅 Overdue Confirmation
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{s.staffId ? `ID: ${s.staffId}` : 'ID: Not set'}</span>
                        </div>

                        {/* Document Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                            <span className="font-semibold">Document Progress</span>
                            <span className="font-bold text-slate-900">{percent}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                s.documentsComplete ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-2">{s.documentsCount} of {s.totalDocuments} documents submitted</div>
                        </div>

                        {/* Missing Documents */}
                        {missing.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-600 mb-2">📌 Missing Documents:</p>
                            <div className="flex flex-wrap gap-2">
                              {missing.map((doc) => (
                                <span
                                  key={doc.key}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  {doc.short}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side Actions */}
                      <div className="flex flex-col gap-3 w-full lg:w-auto">
                        {/* Quick Checkboxes */}
                        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={s.offerLetterGiven}
                              onChange={(e) => handleQuickUpdate(s.id, 'offerLetterGiven', e.target.checked)}
                              className="h-4 w-4 accent-amber-600 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Offer Letter Issued</span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={s.isConfirmed}
                              onChange={(e) => handleQuickUpdate(s.id, 'isConfirmed', e.target.checked)}
                              className="h-4 w-4 accent-emerald-600 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Staff Confirmed</span>
                          </label>
                        </div>

                        {/* Manage Button */}
                        <button
                          onClick={() => setSelectedStaff(s)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg transition-all duration-200"
                        >
                          🔧 Manage Documents
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document Management Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all duration-200"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="sticky top-0 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-6 text-white">
              <h2 className="text-2xl font-bold">{selectedStaff.fullName}</h2>
              <p className="mt-1 text-sm text-slate-300">
                {selectedStaff.department} • {selectedStaff.position}
              </p>
              <p className="mt-2 text-xs text-slate-400">Staff ID: {selectedStaff.staffId || 'Not assigned'}</p>
            </div>

            {/* Modal Content */}
            <div className="space-y-8 px-8 py-6">
              {/* Confirmation Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                  <span>✓</span> Confirmation Status
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all">
                    <input
                      type="checkbox"
                      checked={selectedStaff.offerLetterGiven}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, offerLetterGiven: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="h-5 w-5 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-amber-900">Offer Letter Given</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                    <input
                      type="checkbox"
                      checked={selectedStaff.isConfirmed}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, isConfirmed: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="h-5 w-5 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-emerald-900">Staff Confirmed</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Documents Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                  <span>📄</span> Required Documents
                </h3>
                <div className="space-y-3">
                  {documentChecklist.map((doc) => (
                    <label
                      key={doc.key}
                      className={`flex items-center gap-3 rounded-2xl border px-5 py-4 cursor-pointer transition-all ${
                        selectedStaff[doc.key as keyof StaffDocument]
                          ? 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStaff[doc.key as keyof StaffDocument] as boolean}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, [doc.key]: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="h-5 w-5 accent-slate-900 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-900">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-8 py-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedStaff(null)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all duration-200 disabled:opacity-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => updateDocumentStatus(selectedStaff.id, {
                  isConfirmed: selectedStaff.isConfirmed,
                  offerLetterGiven: selectedStaff.offerLetterGiven,
                  hasValidId: selectedStaff.hasValidId,
                  hasProofOfAddress: selectedStaff.hasProofOfAddress,
                  hasPassportPhotos: selectedStaff.hasPassportPhotos,
                  hasQualification: selectedStaff.hasQualification,
                  hasGuarantorForms: selectedStaff.hasGuarantorForms,
                })}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? '💾 Saving...' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
