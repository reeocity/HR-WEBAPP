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
    <div className="container">
      <section className="card">
        <div style={{ marginBottom: "20px" }}>
          <h1>Staff Documents</h1>
          <p className="muted" style={{ marginTop: "4px" }}>Manage staff documentation and confirmations</p>
        </div>

        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.5)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.35)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px" }}>TOTAL STAFF</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{summary.total}</div>
            </div>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(34, 197, 94, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#166534" }}>COMPLETE</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#166534" }}>{summary.complete}</div>
            </div>
            <div style={{ background: "rgba(244, 63, 94, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(244, 63, 94, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#9f1239" }}>INCOMPLETE</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#9f1239" }}>{summary.incomplete}</div>
            </div>
            <div style={{ background: "rgba(217, 119, 6, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(217, 119, 6, 0.4)" }}>
              <div className="muted" style={{ fontSize: "11px", marginBottom: "6px", color: "#92400e" }}>PENDING CONFIRM</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{summary.needsConfirmation}</div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
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
              className={filter === item.id ? 'button' : 'button secondary'}
              style={{ fontSize: '12px' }}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted" style={{ marginTop: "12px" }}>Loading documents...</p>
        ) : staff.length === 0 ? (
          <p className="muted" style={{ marginTop: "12px" }}>No staff found for this filter.</p>
        ) : (
          <div style={{ marginTop: "12px", overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Documents</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Confirmed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const missing = getMissingDocs(s);
                  const percent = getCompletionPercent(s);

                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "600" }}>{s.staffId || "—"}</td>
                      <td>{s.fullName}</td>
                      <td>{s.department}</td>
                      <td>{s.position}</td>
                      <td>
                        <span style={{ fontSize: "12px" }}>
                          {s.documentsCount}/{s.totalDocuments}
                        </span>
                      </td>
                      <td>
                        <div style={{ width: "80px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: s.documentsComplete ? "#22c55e" : "#f59e0b",
                              width: `${percent}%`,
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "10px", color: "#64748b", marginTop: "2px", display: "block" }}>{percent}%</span>
                      </td>
                      <td>
                        <span style={{
                          background: s.documentsComplete ? "rgba(34, 197, 94, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          color: s.documentsComplete ? "#166534" : "#9f1239",
                          border: s.documentsComplete ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(244, 63, 94, 0.4)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "inline-block"
                        }}>
                          {s.documentsComplete ? "✓ Complete" : "⚠️ Pending"}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: s.isConfirmed ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.2)",
                          color: s.isConfirmed ? "#166534" : "#64748b",
                          border: s.isConfirmed ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(148, 163, 184, 0.4)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "inline-block"
                        }}>
                          {s.isConfirmed ? "✓ Yes" : "✗ No"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <a 
                          href={`/staff/${s.id}`}
                          className="button secondary"
                          style={{ fontSize: "11px", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          Manage
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

      {/* Document Management Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" style={{ padding: "12px" }}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200" style={{ maxWidth: "calc(100vw - 24px)", borderRadius: "20px" }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all duration-200"
              style={{ minHeight: "44px", minWidth: "44px", height: "44px", width: "44px" }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="sticky top-0 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-6 text-white" style={{ padding: "16px" }}>
              <h2 className="text-2xl font-bold" style={{ fontSize: "20px" }}>{selectedStaff.fullName}</h2>
              <p className="mt-1 text-sm text-slate-300" style={{ marginTop: "4px", fontSize: "12px" }}>
                {selectedStaff.department} • {selectedStaff.position}
              </p>
              <p className="mt-2 text-xs text-slate-400" style={{ marginTop: "4px", fontSize: "11px" }}>Staff ID: {selectedStaff.staffId || 'Not assigned'}</p>
            </div>

            {/* Modal Content */}
            <div className="space-y-8 px-8 py-6" style={{ padding: "16px", gap: "16px" }}>
              {/* Confirmation Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2" style={{ fontSize: "12px", marginBottom: "12px" }}>
                  <span>✓</span> Confirmation Status
                </h3>
                <div className="space-y-3" style={{ gap: "12px" }}>
                  <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all" style={{ padding: "12px", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={selectedStaff.offerLetterGiven}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, offerLetterGiven: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="h-5 w-5 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-amber-900" style={{ fontSize: "13px" }}>Offer Letter Given</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all" style={{ padding: "12px", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={selectedStaff.isConfirmed}
                      onChange={(e) => {
                        const updated = { ...selectedStaff, isConfirmed: e.target.checked };
                        setSelectedStaff(updated);
                      }}
                      className="h-5 w-5 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-emerald-900" style={{ fontSize: "13px" }}>Staff Confirmed</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Documents Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2" style={{ fontSize: "12px", marginBottom: "12px" }}>
                  <span>📄</span> Required Documents
                </h3>
                <div className="space-y-3" style={{ gap: "12px" }}>
                  {documentChecklist.map((doc) => (
                    <label
                      key={doc.key}
                      className={`flex items-center gap-3 rounded-2xl border px-5 py-4 cursor-pointer transition-all ${
                        selectedStaff[doc.key as keyof StaffDocument]
                          ? 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      style={{ padding: "12px", gap: "12px" }}
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
                      <span className="text-sm font-semibold text-slate-900" style={{ fontSize: "13px" }}>{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-8 py-6 flex justify-end gap-3" style={{ padding: "12px", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all duration-200 disabled:opacity-50"
                  style={{ minHeight: "44px", minWidth: "80px" }}
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
                  style={{ minHeight: "44px", minWidth: "100px", flex: 1 }}
                  disabled={saving}
                >
                  {saving ? '💾 Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
