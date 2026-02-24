"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StaffRow = {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string | null;
  position: string | null;
  status: string | null;
  inactiveReason: string | null;
  lastActiveDate: string | null;
  phone: string | null;
  resumptionDate: string | null;
};

export default function StaffListPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    newCount: number;
    updateCount: number;
    errorCount: number;
    missingGuarantorCount: number;
    errors: { rowNumber: number; message: string }[];
  } | null>(null);

  const handleDownloadErrors = () => {
    if (!previewData || previewData.errors.length === 0) return;
    const header = "rowNumber,message\n";
    const rows = previewData.errors
      .map((e) => `${e.rowNumber},"${e.message.replace(/"/g, '""')}"`)
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "staff-import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [newFullName, setNewFullName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [newInactiveReason, setNewInactiveReason] = useState("");
  const [newLastActiveDate, setNewLastActiveDate] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  const router = useRouter();

  const fileName = useMemo(() => file?.name ?? null, [file]);

  const closeUpload = () => {
    setShowUpload(false);
    setFile(null);
    setPreviewMessage(null);
    setPreviewData(null);
  };

  const closeAdd = () => {
    setShowAdd(false);
    setCreateMessage(null);
    setNewFullName("");
    setNewDepartment("");
    setNewPosition("");
    setNewStatus("ACTIVE");
    setNewInactiveReason("");
    setNewLastActiveDate("");
    setNewPhone("");
    setNewAccountNumber("");
    setNewResumptionDate("");
    setNewSalary("");
  };

  const loadStaff = async () => {
    setIsLoadingStaff(true);
    setStaffError(null);
    try {
      const res = await fetch("/api/staff/list");
      const data = await res.json();
      if (!res.ok) {
        setStaffError(data?.message ?? "Failed to load staff.");
        return;
      }
      setStaff(data.staff ?? []);
    } catch {
      setStaffError("Failed to load staff.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Delete this staff and all related records?")) return;
    setStaffError(null);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setStaffError(data?.message ?? "Failed to delete staff.");
        return;
      }
      setStaff((prev) => prev.filter((row) => row.id !== id));
    } catch {
      setStaffError("Failed to delete staff.");
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewing(true);
    setPreviewMessage(null);
    setPreviewData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/staff/import/preview", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setPreviewMessage(data?.message ?? "Preview failed.");
        return;
      }
      setPreviewData(data);
    } catch {
      setPreviewMessage("Preview failed. Please try again.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !previewData || previewData.errorCount > 0) return;
    setIsConfirming(true);
    setPreviewMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/staff/import/confirm", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setPreviewMessage(data?.message ?? "Import failed.");
        return;
      }
      setPreviewMessage(`Import completed. ${data.created} created, ${data.updated} updated.`);
      await loadStaff();
    } catch {
      setPreviewMessage("Import failed. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCreateStaff = async () => {
    setIsCreating(true);
    setCreateMessage(null);
    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName,
          department: newDepartment,
          position: newPosition,
          status: newStatus,
          inactiveReason: newStatus === "INACTIVE" ? newInactiveReason : null,
          lastActiveDate: newStatus === "INACTIVE" ? newLastActiveDate : null,
          phone: newPhone || null,
          accountNumber: newAccountNumber || null,
          resumptionDate: newResumptionDate,
          salary: newSalary ? Number(newSalary) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMessage(data?.message ?? "Failed to create staff.");
        return;
      }
      setCreateMessage(`Staff created! ID: ${data.generatedStaffId}`);
      await loadStaff();
      setTimeout(() => closeAdd(), 2000);
    } catch {
      setCreateMessage("Failed to create staff.");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    loadStaff();
    const loadOptions = async () => {
      const res = await fetch("/api/staff/options");
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments ?? []);
        setPositions(data.positions ?? []);
      }
    };
    loadOptions();
  }, []);

  return (
    <div className="grid" style={{ gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
          <h1 style={{ margin: "0", fontSize: "clamp(20px, 5vw, 32px)" }}>Staff Management</h1>
          <p className="muted" style={{ margin: "8px 0 0 0", fontSize: "clamp(12px, 3vw, 14px)" }}>
            Upload the official Excel file to create or update staff records.
          </p>
        </div>
        <Link href="/" className="button secondary" style={{ textDecoration: "none", minHeight: "44px", minWidth: "120px", whiteSpace: "nowrap" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <section className="card">
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="button" onClick={() => setShowUpload(true)} style={{ minHeight: "44px", minWidth: "100px" }}>
            📤 Upload Excel
          </button>
          <button className="button secondary" onClick={() => setShowAdd(true)} style={{ minHeight: "44px", minWidth: "100px" }}>
            ➕ Add Staff
          </button>
        </div>
        <div className="grid grid-3" style={{ marginTop: "16px" }}>
          <label>
            <span className="muted">Search by name or staff ID</span>
            <input className="input" placeholder="Search staff..." />
          </label>
          <label>
            <span className="muted">Department</span>
            <select className="select">
              <option>All departments</option>
            </select>
          </label>
          <label>
            <span className="muted">Status</span>
            <select className="select">
              <option>All statuses</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>Staff Records</h2>
        {isLoadingStaff ? (
          <p className="muted" style={{ marginTop: "8px" }}>Loading staff...</p>
        ) : staffError ? (
          <p className="muted" style={{ marginTop: "8px" }}>{staffError}</p>
        ) : staff.length === 0 ? (
          <p className="muted" style={{ marginTop: "8px" }}>
            No staff records yet. Use the Excel upload to begin.
          </p>
        ) : (
          <div style={{ marginTop: "12px", overflowX: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Phone</th>
                  <th>Resumption Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr
                    key={row.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/staff/${row.id}`)}
                  >
                    <td>{row.staffId ?? "-"}</td>
                    <td>{row.fullName}</td>
                    <td>{row.department ?? "-"}</td>
                    <td>{row.position ?? "-"}</td>
                    <td>{row.status ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.resumptionDate ? row.resumptionDate.slice(0, 10) : "-"}</td>
                    <td>
                      <button
                        className="button secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteStaff(row.id);
                        }}
                        style={{ minHeight: "44px", minWidth: "70px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: "16px" }}>
          <Link className="button secondary" href="/staff/preview" style={{ minHeight: "44px" }}>
            Open staff profile placeholder
          </Link>
        </div>
      </section>

      {showAdd ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            zIndex: 50,
          }}
          onClick={closeAdd}
        >
          <div
            className="card"
            style={{ maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ margin: "0", fontSize: "clamp(16px, 4vw, 20px)" }}>Add Staff</h3>
              <button className="button secondary" onClick={closeAdd} style={{ minHeight: "44px", minWidth: "70px" }}>
                Close
              </button>
            </div>

            <div className="grid grid-2" style={{ marginTop: "16px", gap: "12px" }}>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Full Name</span>
                <input className="input" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Department</span>
                <select className="select" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Position</span>
                <select className="select" value={newPosition} onChange={(e) => setNewPosition(e.target.value)}>
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Status</span>
                <select
                  className="select"
                  value={newStatus}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewStatus(value);
                    if (value !== "INACTIVE") {
                      setNewInactiveReason("");
                      setNewLastActiveDate("");
                    }
                  }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Inactive Reason</span>
                <select
                  className="select"
                  value={newInactiveReason}
                  onChange={(e) => setNewInactiveReason(e.target.value)}
                  disabled={newStatus !== "INACTIVE"}
                >
                  <option value="">Select reason</option>
                  <option value="TERMINATION">TERMINATION</option>
                  <option value="RESIGNATION">RESIGNATION</option>
                  <option value="AWOL">AWOL</option>
                  <option value="SUSPENSION">SUSPENSION</option>
                </select>
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Last Active Day</span>
                <input
                  className="input"
                  type="date"
                  value={newLastActiveDate}
                  onChange={(e) => setNewLastActiveDate(e.target.value)}
                  disabled={newStatus !== "INACTIVE"}
                />
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Phone</span>
                <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Account Number</span>
                <input className="input" placeholder="e.g., 0123456789" value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value)} />
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Resumption Date</span>
                <input className="input" type="date" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} />
              </label>
              <label>
                <span className="muted" style={{ fontSize: "12px" }}>Monthly Salary</span>
                <input className="input" type="number" placeholder="e.g., 150000" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
              </label>
            </div>

            {createMessage ? <p className="muted" style={{ marginTop: "8px", fontSize: "12px" }}>{createMessage}</p> : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
              <button className="button secondary" onClick={closeAdd} style={{ minHeight: "44px", minWidth: "70px" }}>Cancel</button>
              <button
                className="button"
                onClick={handleCreateStaff}
                style={{ minHeight: "44px", minWidth: "100px", flex: "1 1 auto" }}
                disabled={
                  !newFullName ||
                  !newDepartment ||
                  !newPosition ||
                  !newResumptionDate ||
                  isCreating ||
                  (newStatus === "INACTIVE" && (!newInactiveReason || !newLastActiveDate))
                }
              >
                {isCreating ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUpload ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            zIndex: 50,
          }}
          onClick={closeUpload}
        >
          <div
            className="card"
            style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ margin: "0", fontSize: "clamp(16px, 4vw, 20px)" }}>Upload Staff Excel</h3>
              <button className="button secondary" onClick={closeUpload} style={{ minHeight: "44px", minWidth: "70px" }}>
                Close
              </button>
            </div>
            <p className="muted" style={{ marginTop: "8px", fontSize: "12px" }}>
              Only .xlsx files are accepted. Import will preview before saving.
            </p>
            <div style={{ marginTop: "16px" }}>
              <input
                className="input"
                type="file"
                accept=".xlsx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {fileName ? (
                <p className="muted" style={{ marginTop: "8px", fontSize: "12px" }}>
                  Selected: {fileName}
                </p>
              ) : null}
              {previewData ? (
                <div style={{ marginTop: "12px" }}>
                  <p className="muted" style={{ fontSize: "12px" }}>New: {previewData.newCount}</p>
                  <p className="muted" style={{ fontSize: "12px" }}>Updated: {previewData.updateCount}</p>
                  <p className="muted" style={{ fontSize: "12px" }}>Errors: {previewData.errorCount}</p>
                  <p className="muted" style={{ fontSize: "12px" }}>Missing guarantors: {previewData.missingGuarantorCount}</p>
                  {previewData.errorCount > 0 ? (
                    <button className="button secondary" style={{ marginTop: "8px", minHeight: "44px" }} onClick={handleDownloadErrors}>
                      Download error CSV
                    </button>
                  ) : null}
                </div>
              ) : null}
              {previewMessage ? (
                <p className="muted" style={{ marginTop: "8px", fontSize: "12px" }}>
                  {previewMessage}
                </p>
              ) : null}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button className="button secondary" onClick={closeUpload} style={{ minHeight: "44px", minWidth: "70px" }}>
                Cancel
              </button>
              <button className="button secondary" onClick={handlePreview} disabled={!file || isPreviewing} style={{ minHeight: "44px", flex: "1 1 auto" }}>
                {isPreviewing ? "Previewing..." : "Preview Import"}
              </button>
              <button
                className="button"
                onClick={handleConfirm}
                disabled={!file || !previewData || previewData.errorCount > 0 || isConfirming}
                style={{ minHeight: "44px", flex: "1 1 auto" }}
              >
                {isConfirming ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
