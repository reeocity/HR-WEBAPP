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

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents & Confirmation</h1>
          <p className="text-slate-500">Track document submission gaps and confirm staff manually.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('complete')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'complete'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Complete
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'incomplete'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Incomplete
          </button>
          <button
            onClick={() => setFilter('needs-confirmation')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === 'needs-confirmation'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Needs Confirmation
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Total Staff</div>
            <div className="text-2xl font-semibold text-slate-900">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm text-emerald-700">Complete Documents</div>
            <div className="text-2xl font-semibold text-emerald-900">{summary.complete}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-700">Incomplete Documents</div>
            <div className="text-2xl font-semibold text-amber-900">{summary.incomplete}</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm text-rose-700">Needs Confirmation</div>
            <div className="text-2xl font-semibold text-rose-900">{summary.needsConfirmation}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading records...</div>
      ) : staff.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No staff found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {staff.map((s) => {
            const missing = getMissingDocs(s);
            const percent = getCompletionPercent(s);

            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{s.fullName}</h3>
                      {s.needsConfirmationReminder && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Overdue</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {s.department} · {s.position}
                    </div>
                    <div className="text-xs text-slate-400">Staff ID: {s.staffId || 'Not set'}</div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.documentsComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.documentsComplete ? 'Complete' : 'Incomplete'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{s.daysSinceResumption} days active</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Documents {s.documentsCount}/{s.totalDocuments}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${s.documentsComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500">Missing documents</div>
                  {missing.length === 0 ? (
                    <div className="mt-2 text-sm text-emerald-700">All documents submitted.</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missing.map((doc) => (
                        <span key={doc.key} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {doc.short}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={s.offerLetterGiven}
                        onChange={(e) => handleQuickUpdate(s.id, 'offerLetterGiven', e.target.checked)}
                        className="h-4 w-4"
                      />
                      Offer Letter
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={s.isConfirmed}
                        onChange={(e) => handleQuickUpdate(s.id, 'isConfirmed', e.target.checked)}
                        className="h-4 w-4"
                      />
                      Confirmed
                    </label>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(s)}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Manage Checklist
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Management Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedStaff.fullName}</h2>
                  <p className="text-sm text-gray-600">{selectedStaff.department} - {selectedStaff.position}</p>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Confirmation Status */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Confirmation Status</h3>
                  <label className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedStaff.offerLetterGiven}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, offerLetterGiven: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="w-4 h-4"
                    />
                    <span>Offer Letter Given</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStaff.isConfirmed}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, isConfirmed: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="w-4 h-4"
                    />
                    <span>Staff Confirmed</span>
                  </label>
                </div>

                {/* Documents Checklist */}
                <div>
                  <h3 className="font-semibold mb-3">Required Documents</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStaff.hasValidId}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, hasValidId: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Valid ID Card (NIN, Passport)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStaff.hasProofOfAddress}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, hasProofOfAddress: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Valid Proof of Address (Utility Bill)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStaff.hasPassportPhotos}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, hasPassportPhotos: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Two Passport Photos</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStaff.hasQualification}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, hasQualification: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Copy of Highest Qualification</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStaff.hasGuarantorForms}
                        onChange={(e) => {
                          const updated = { ...selectedStaff, hasGuarantorForms: e.target.checked };
                          setSelectedStaff(updated);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Guarantor Forms & Letters of Undertaking</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
