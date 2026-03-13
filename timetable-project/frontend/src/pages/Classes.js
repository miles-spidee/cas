import { useEffect, useState } from "react";

const API = "http://localhost:5000/timemaster";

const DAY_OPTIONS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

const TIME_OPTIONS = [
  "08:00:00",
  "08:45:00",
  "09:30:00",
  "09:45:00",
  "10:30:00",
  "11:15:00",
  "12:00:00",
  "13:00:00",
  "13:45:00",
  "14:30:00",
  "15:15:00",
];

function Classes({ department, setClassName, onBack }) {
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);

  /* ---- Create class form ---- */
  const [newClassForm, setNewClassForm] = useState({
    class_name: "",
    day_of_week: 1,
    start_time: "08:00:00",
    end_time: "08:45:00",
    subject: "",
    staff_id: "",
  });
  const [creating, setCreating] = useState(false);

  /* ---- Staff CRUD ---- */
  const [staffForm, setStaffForm] = useState({ name: "", email: "" });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingStaffForm, setEditingStaffForm] = useState({ name: "", email: "" });
  const [savingStaff, setSavingStaff] = useState(false);

  const fetchStaff = () => {
    fetch(`${API}/staff/${department.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStaff(data);
        setStaffLoading(false);
      })
      .catch(() => setStaffLoading(false));
  };

  const fetchClasses = () => {
    fetch(`${API}/classes/${department.id}`)
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses();
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department.id]);

  const updateClassForm = (key, value) => {
    setNewClassForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();

    if (!newClassForm.class_name.trim() || !newClassForm.subject.trim() || !newClassForm.staff_id) {
      alert("Class name, subject and assigned staff are required");
      return;
    }

    if (newClassForm.start_time >= newClassForm.end_time) {
      alert("End time must be later than start time");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: newClassForm.class_name.trim(),
          department_id: department.id,
          day_of_week: Number(newClassForm.day_of_week),
          start_time: newClassForm.start_time,
          end_time: newClassForm.end_time,
          subject: newClassForm.subject.trim(),
          staff_id: newClassForm.staff_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create class");
      }

      setNewClassForm({
        class_name: "",
        day_of_week: 1,
        start_time: "08:00:00",
        end_time: "08:45:00",
        subject: "",
        staff_id: "",
      });
      fetchClasses();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      alert("Staff name and email are required");
      return;
    }

    setSavingStaff(true);
    try {
      const res = await fetch(`${API}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffForm.name.trim(),
          email: staffForm.email.trim(),
          department_id: department.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create staff");
      }

      setStaffForm({ name: "", email: "" });
      fetchStaff();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingStaff(false);
    }
  };

  const beginEditStaff = (item) => {
    setEditingStaffId(item.id);
    setEditingStaffForm({ name: item.name || "", email: item.email || "" });
  };

  const handleUpdateStaff = async () => {
    if (!editingStaffId) return;

    if (!editingStaffForm.name.trim() || !editingStaffForm.email.trim()) {
      alert("Staff name and email are required");
      return;
    }

    setSavingStaff(true);
    try {
      const res = await fetch(`${API}/staff/${editingStaffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingStaffForm.name.trim(),
          email: editingStaffForm.email.trim(),
          department_id: department.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update staff");
      }

      setEditingStaffId(null);
      setEditingStaffForm({ name: "", email: "" });
      fetchStaff();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;

    setSavingStaff(true);
    try {
      const res = await fetch(`${API}/staff/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete staff");
      }

      fetchStaff();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingStaff(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← Back to Departments
      </button>

      <h1 className="page-title">{department.name}</h1>
      <p className="page-subtitle">Select a class to view &amp; edit its timetable</p>

      {loading ? (
        <p>Loading classes...</p>
      ) : (
        <div className="card-grid">
          {classes.map((c) => (
            <div
              key={c.class_name}
              className="card-item"
              onClick={() => setClassName(c.class_name)}
            >
              {c.class_name}
            </div>
          ))}
        </div>
      )}

      <hr className="section-divider" />

      <h3 style={{ color: "#1a1a2e", marginBottom: 12 }}>Create New Class</h3>

      <form className="inline-form" onSubmit={handleCreateClass}>
        <div className="form-field">
          <label>Class Name</label>
          <input
            type="text"
            placeholder="e.g. III-CSE-A"
            value={newClassForm.class_name}
            onChange={(e) => updateClassForm("class_name", e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Day</label>
          <select
            value={newClassForm.day_of_week}
            onChange={(e) => updateClassForm("day_of_week", Number(e.target.value))}
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Start</label>
          <select
            value={newClassForm.start_time}
            onChange={(e) => updateClassForm("start_time", e.target.value)}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>End</label>
          <select
            value={newClassForm.end_time}
            onChange={(e) => updateClassForm("end_time", e.target.value)}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Subject</label>
          <input
            type="text"
            placeholder="e.g. DBMS"
            value={newClassForm.subject}
            onChange={(e) => updateClassForm("subject", e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Assigned Staff</label>
          <select
            value={newClassForm.staff_id}
            onChange={(e) => updateClassForm("staff_id", e.target.value)}
            required
          >
            <option value="">-- Select Staff --</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn-create"
          disabled={creating || !newClassForm.class_name.trim() || !newClassForm.subject.trim() || !newClassForm.staff_id}
        >
          {creating ? "Creating..." : "+ Add Class"}
        </button>
      </form>

      <hr className="section-divider" />

      <h3 style={{ color: "#1a1a2e", marginBottom: 12 }}>Staff Management</h3>

      <form className="inline-form" onSubmit={handleCreateStaff}>
        <div className="form-field">
          <label>Name</label>
          <input
            type="text"
            placeholder="Staff name"
            value={staffForm.name}
            onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="staff@college.edu"
            value={staffForm.email}
            onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <button type="submit" className="btn-create" disabled={savingStaff}>
          {savingStaff ? "Saving..." : "+ Add Staff"}
        </button>
      </form>

      {staffLoading ? (
        <p style={{ marginTop: 14 }}>Loading staff...</p>
      ) : (
        <div className="staff-list" style={{ marginTop: 16 }}>
          {staff.map((member) => {
            const isEditing = editingStaffId === member.id;

            return (
              <div key={member.id} className="staff-row">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingStaffForm.name}
                      onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      type="email"
                      value={editingStaffForm.email}
                      onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <button className="btn-mini btn-save" onClick={handleUpdateStaff} disabled={savingStaff}>
                      Save
                    </button>
                    <button className="btn-mini" onClick={() => setEditingStaffId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="staff-main">
                      <strong>{member.name}</strong>
                      <span>{member.email || "-"}</span>
                    </div>
                    <div className="staff-actions">
                      <button className="btn-mini" onClick={() => beginEditStaff(member)}>
                        Edit
                      </button>
                      <button className="btn-mini btn-delete" onClick={() => handleDeleteStaff(member.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Classes;
