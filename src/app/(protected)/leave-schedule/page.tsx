"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Staff {
  id: string;
  staffId: string | null;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: string;
  status: string | null;
}

interface LeaveScheduleEntry {
  id: string;
  staffId: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  days: number;
  notes: string | null;
  staff: {
    fullName: string;
    staffId: string | null;
    department: string;
  };
}

export default function LeaveSchedulePage() {
  const [eligibleStaff, setEligibleStaff] = useState<Staff[]>([]);
  const [leaveSchedules, setLeaveSchedules] = useState<LeaveScheduleEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    staffId: "",
    month: 1,
    startDate: "",
    endDate: "",
    days: 0,
    notes: "",
  });

  const fetchEligibleStaff = useCallback(async () => {
    try {
      console.log("Fetching eligible staff...");
      const res = await fetch("/api/leave-schedule/eligible-staff");
      console.log("Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Eligible staff data:", data);
        console.log("Number of eligible staff:", data.eligibleStaff?.length || 0);
        setEligibleStaff(data.eligibleStaff || []);
      } else {
        const errorData = await res.json();
        console.error("Failed to fetch eligible staff:", res.status, errorData);
        setError(`Failed to load staff: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error fetching eligible staff:", error);
      setError("Network error loading staff members");
    }
  }, []);

  const fetchLeaveSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave-schedule?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setLeaveSchedules(data.schedules);
      }
    } catch {
      console.error("Error fetching leave schedules");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchEligibleStaff();
    fetchLeaveSchedules();
  }, [selectedYear, fetchEligibleStaff, fetchLeaveSchedules]);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validate month (Jan-Nov only)
    if (formData.month < 1 || formData.month > 11) {
      setError("Leave can only be scheduled from January to November");
      return;
    }

    const payload = {
      ...formData,
      year: selectedYear,
      days: calculateDays(formData.startDate, formData.endDate),
    };

    try {
      const url = editingId
        ? `/api/leave-schedule/${editingId}`
        : "/api/leave-schedule";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save leave schedule");
        return;
      }

      setSuccessMessage(
        editingId
          ? "Leave schedule updated successfully"
          : "Leave schedule added successfully"
      );
      resetForm();
      fetchLeaveSchedules();
    } catch {
      setError("An error occurred while saving the leave schedule");
    }
  };

  const handleEdit = (schedule: LeaveScheduleEntry) => {
    setEditingId(schedule.id);
    setFormData({
      staffId: schedule.staffId,
      month: schedule.month,
      startDate: schedule.startDate.split("T")[0],
      endDate: schedule.endDate.split("T")[0],
      days: schedule.days,
      notes: schedule.notes || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave schedule?")) {
      return;
    }

    try {
      const res = await fetch(`/api/leave-schedule/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage("Leave schedule deleted successfully");
        fetchLeaveSchedules();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete leave schedule");
      }
    } catch {
      setError("An error occurred while deleting the leave schedule");
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: "",
      month: 1,
      startDate: "",
      endDate: "",
      days: 0,
      notes: "",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAutoGenerate = async () => {
    if (!confirm(
      `This will auto-generate leave schedules for all eligible staff for ${selectedYear}.\n\n` +
      `Staff will be distributed across January-November respecting:\n` +
      `- Maximum 10 people per month\n` +
      `- Maximum 2 people per department per month\n` +
      `- 14 days leave per person\n\n` +
      `Continue?`
    )) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/leave-schedule/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to auto-generate leave schedules");
        return;
      }

      setSuccessMessage(data.message || `Successfully created ${data.created} leave schedules`);
      await fetchLeaveSchedules();
    } catch {
      setError("An error occurred while auto-generating leave schedules");
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November"
    ];
    return months[month - 1];
  };

  return (
    <div className="container">
      <div className="header-section">
        <div>
          <h1>Leave Schedule Management</h1>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            {eligibleStaff.length} eligible staff found (must have 1+ year tenure)
          </p>
        </div>
        <div className="actions">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input"
          >
            {[2024, 2025, 2026, 2027, 2028].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {!showAddForm && (
            <>
              <button
                className="btn-success"
                onClick={handleAutoGenerate}
                disabled={loading}
                title="Auto-generate leave schedules for all eligible staff"
              >
                🪄 Auto-Generate Schedule
              </button>
              <button
                className="btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add Manually
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {!showAddForm && leaveSchedules.length === 0 && !loading && (
        <div className="alert alert-info">
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            🪄 Quick Start: Auto-Generate Leave Schedule
          </h3>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            Click <strong>&quot;Auto-Generate Schedule&quot;</strong> to automatically create leave schedules for all {eligibleStaff.length} eligible staff.
          </p>
          <ul style={{ margin: "0.5rem 0 0 1.5rem", fontSize: "0.9rem" }}>
            <li>Distributes staff across January-November</li>
            <li>Respects maximum 10 people per month</li>
            <li>Maximum 2 people per department per month</li>
            <li>Assigns 14 days leave per person</li>
          </ul>
        </div>
      )}

      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <h2>{editingId ? "Edit Leave Schedule" : "Add Leave Schedule"}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="staffId">Staff Member *</label>
                <select
                  id="staffId"
                  className="input"
                  value={formData.staffId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffId: e.target.value })
                  }
                  required
                  disabled={!!editingId}
                >
                  <option value="">Select Staff</option>
                  {eligibleStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} ({staff.staffId || "N/A"}) -{" "}
                      {staff.department}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  Only staff with more than 1 year tenure are eligible
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="month">Month *</label>
                <select
                  id="month"
                  className="input"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: Number(e.target.value) })
                  }
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                    <option key={m} value={m}>
                      {getMonthName(m)}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  January to November only. Max 10 people/month, max 2 per department/month
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  className="input"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  className="input"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="days">Days</label>
                <input
                  type="number"
                  id="days"
                  className="input"
                  value={calculateDays(formData.startDate, formData.endDate)}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0" }}
                />
                <small className="help-text">Automatically calculated</small>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  className="input"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? "Update" : "Add"} Leave Schedule
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Leave Schedule for {selectedYear}</h2>
          <p className="text-muted">
            {leaveSchedules.length} schedule(s) | Max 10 per month, Max 2 per dept/month
          </p>
        </div>

        {loading ? (
          <p>Loading leave schedules...</p>
        ) : leaveSchedules.length === 0 ? (
          <p className="text-muted">
            No leave schedules found for {selectedYear}. Click &quot;Add Leave
            Schedule&quot; to create one.
          </p>
        ) : (
          <>
            <div className="month-summary" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Monthly Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => {
                  const monthSchedules = leaveSchedules.filter(s => s.month === m);
                  const count = monthSchedules.length;
                  const isNearFull = count >= 8;
                  const isFull = count >= 10;
                  return (
                    <div 
                      key={m} 
                      style={{ 
                        padding: "0.5rem", 
                        borderRadius: "4px", 
                        backgroundColor: isFull ? "#fee" : isNearFull ? "#ffd" : "#efe",
                        border: `1px solid ${isFull ? "#fcc" : isNearFull ? "#fc6" : "#cfc"}`
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{getMonthName(m)}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>{count}/10 staff</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Notes</th>
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveSchedules
                  .sort((a, b) => a.month - b.month)
                  .map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{schedule.staff.staffId || "N/A"}</td>
                      <td>{schedule.staff.fullName}</td>
                      <td>{schedule.staff.department}</td>
                      <td>{getMonthName(schedule.month)}</td>
                      <td>
                        {new Date(schedule.startDate).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(schedule.endDate).toLocaleDateString()}
                      </td>
                      <td>{schedule.days}</td>
                      <td>{schedule.notes || "-"}</td>
                      <td className="no-print">
                        <div className="action-buttons">
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => handleEdit(schedule)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .actions {
          display: flex;
          gap: 1rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-success {
          background-color: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .alert-info {
          background-color: #e7f3ff;
          color: #004085;
          border: 1px solid #b8daff;
        }

        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .card-header {
          margin-bottom: 1.5rem;
        }

        .card-header h2 {
          margin: 0 0 0.5rem 0;
        }

        .text-muted {
          color: #666;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .help-text {
          color: #666;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .input:focus {
          outline: none;
          border-color: #4a90e2;
        }

        .btn-primary,
        .btn-secondary,
        .btn-sm,
        .btn-danger,
        .btn-success {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #4a90e2;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #357abd;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #218838;
        }

        .btn-primary:disabled,
        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
