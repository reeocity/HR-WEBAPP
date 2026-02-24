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

  const handleQuickUpdate = async (staffId: string, field: string, value: boolean) => {
    await updateDocumentStatus(staffId, { [field]: value });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Staff Documents & Confirmation</h1>
        <p className="text-gray-600">Track document submission and staff confirmation status</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Staff</div>
            <div className="text-2xl font-bold text-blue-900">{summary.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">Complete Documents</div>
            <div className="text-2xl font-bold text-green-900">{summary.complete}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Incomplete Documents</div>
            <div className="text-2xl font-bold text-yellow-900">{summary.incomplete}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Needs Confirmation</div>
            <div className="text-2xl font-bold text-red-900">{summary.needsConfirmation}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium ${
            filter === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Staff
        </button>
        <button
          onClick={() => setFilter('complete')}
          className={`px-4 py-2 font-medium ${
            filter === 'complete'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Complete
        </button>
        <button
          onClick={() => setFilter('incomplete')}
          className={`px-4 py-2 font-medium ${
            filter === 'incomplete'
              ? 'border-b-2 border-yellow-500 text-yellow-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Incomplete
        </button>
        <button
          onClick={() => setFilter('needs-confirmation')}
          className={`px-4 py-2 font-medium ${
            filter === 'needs-confirmation'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Needs Confirmation
        </button>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Offer Letter</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Active</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.fullName}</div>
                    <div className="text-sm text-gray-500">{s.staffId || 'No ID'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{s.department}</div>
                    <div className="text-xs text-gray-500">{s.position}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={s.offerLetterGiven}
                      onChange={(e) => handleQuickUpdate(s.id, 'offerLetterGiven', e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={s.isConfirmed}
                      onChange={(e) => handleQuickUpdate(s.id, 'isConfirmed', e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    {s.needsConfirmationReminder && (
                      <div className="text-xs text-red-600 mt-1">⚠️ Overdue</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      s.documentsComplete
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {s.documentsCount}/{s.totalDocuments}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {s.daysSinceResumption} days
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedStaff(s)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
