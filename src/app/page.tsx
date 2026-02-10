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

  const [newStaffId, setNewStaffId] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [newPhone, setNewPhone] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
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
    setNewStaffId("");
    setNewFullName("");
    setNewDepartment("");
    setNewPosition("");
    setNewStatus("ACTIVE");
    setNewPhone("");
    setNewResumptionDate("");
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
          staffId: newStaffId,
          fullName: newFullName,
          department: newDepartment,
          position: newPosition,
          status: newStatus,
          phone: newPhone || null,
          resumptionDate: newResumptionDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMessage(data?.message ?? "Failed to create staff.");
        return;
      }
      await loadStaff();
      closeAdd();
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
      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1>Staff List</h1>
            <p className="muted">Upload the official Excel file to create or update staff records.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="button" onClick={() => setShowUpload(true)}>
              Upload Excel
            </button>
            <button className="button secondary" onClick={() => setShowAdd(true)}>
              Add Staff (manual)
            </button>
          </div>
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
        <h2>Staff Records</h2>
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
          <Link className="button secondary" href="/staff/preview">
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
            padding: "24px",
            zIndex: 50,
          }}
          onClick={closeAdd}
        >
          <div
            className="card"
            style={{ maxWidth: "640px", width: "100%" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Add Staff</h3>
              <button className="button secondary" onClick={closeAdd}>
                Close
              </button>
            </div>

            <div className="grid grid-2" style={{ marginTop: "16px", gap: "12px" }}>
              <label>
                <span className="muted">Staff ID</span>
                <input className="input" value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)} />
              </label>
              <label>
                <span className="muted">Full Name</span>
                <input className="input" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
              </label>
              <label>
                <span className="muted">Department</span>
                <select className="select" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted">Position</span>
                <select className="select" value={newPosition} onChange={(e) => setNewPosition(e.target.value)}>
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted">Status</span>
                <select className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
              <label>
                <span className="muted">Phone</span>
                <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </label>
              <label>
                <span className="muted">Resumption Date</span>
                <input className="input" type="date" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} />
              </label>
            </div>

            {createMessage ? <p className="muted" style={{ marginTop: "8px" }}>{createMessage}</p> : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <button className="button secondary" onClick={closeAdd}>Cancel</button>
              <button
                className="button"
                onClick={handleCreateStaff}
                disabled={!newStaffId || !newFullName || !newDepartment || !newPosition || !newResumptionDate || isCreating}
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
            padding: "24px",
            zIndex: 50,
          }}
          onClick={closeUpload}
        >
          <div
            className="card"
            style={{ maxWidth: "520px", width: "100%" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Upload Staff Excel</h3>
              <button className="button secondary" onClick={closeUpload}>
                Close
              </button>
            </div>
            <p className="muted" style={{ marginTop: "8px" }}>
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
                <p className="muted" style={{ marginTop: "8px" }}>
                  Selected: {fileName}
                </p>
              ) : null}
              {previewData ? (
                <div style={{ marginTop: "12px" }}>
                  <p className="muted">New: {previewData.newCount}</p>
                  <p className="muted">Updated: {previewData.updateCount}</p>
                  <p className="muted">Errors: {previewData.errorCount}</p>
                  <p className="muted">Missing guarantors: {previewData.missingGuarantorCount}</p>
                  {previewData.errorCount > 0 ? (
                    <button className="button secondary" style={{ marginTop: "8px" }} onClick={handleDownloadErrors}>
                      Download error CSV
                    </button>
                  ) : null}
                </div>
              ) : null}
              {previewMessage ? (
                <p className="muted" style={{ marginTop: "8px" }}>
                  {previewMessage}
                </p>
              ) : null}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
              <button className="button secondary" onClick={closeUpload}>
                Cancel
              </button>
              <button className="button secondary" onClick={handlePreview} disabled={!file || isPreviewing}>
                {isPreviewing ? "Previewing..." : "Preview Import"}
              </button>
              <button
                className="button"
                onClick={handleConfirm}
                disabled={!file || !previewData || previewData.errorCount > 0 || isConfirming}
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
