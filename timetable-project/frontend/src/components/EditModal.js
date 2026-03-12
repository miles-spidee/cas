import { useState, useEffect } from "react";
import "./EditModal.css";

const PERIOD_TIMES = [
  { period: 1, start: "08:00:00", end: "08:45:00", label: "P1 (08:00–08:45)" },
  { period: 2, start: "08:45:00", end: "09:30:00", label: "P2 (08:45–09:30)" },
  { period: 3, start: "09:45:00", end: "10:30:00", label: "P3 (09:45–10:30)" },
  { period: 4, start: "10:30:00", end: "11:15:00", label: "P4 (10:30–11:15)" },
  { period: 5, start: "11:15:00", end: "12:00:00", label: "P5 (11:15–12:00)" },
  { period: 6, start: "13:00:00", end: "13:45:00", label: "P6 (13:00–13:45)" },
  { period: 7, start: "13:45:00", end: "14:30:00", label: "P7 (13:45–14:30)" },
  { period: 8, start: "14:30:00", end: "15:15:00", label: "P8 (14:30–15:15)" },
];

const DAY_NAMES = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function EditModal({ cell, day, period, className, onClose, onSave, onDelete }) {
  const [staffList, setStaffList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [loading, setLoading] = useState(true);

  const isNew = !cell || !cell.id;

  const periodInfo = PERIOD_TIMES.find((p) => p.period === period) || PERIOD_TIMES[0];

  const [form, setForm] = useState({
    subject: cell?.subject || "",
    staff_id: cell?.staff_id || "",
    start_time: cell?.start_time || periodInfo.start,
    end_time: cell?.end_time || periodInfo.end,
  });

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5001/staff").then((r) => r.json()),
      fetch("http://localhost:5001/subjects").then((r) => r.json()),
    ])
      .then(([staff, subjects]) => {
        setStaffList(staff);
        setSubjectList(subjects);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dropdown data:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!form.subject.trim()) {
      alert("Subject is required");
      return;
    }
    if (!form.staff_id) {
      alert("Staff is required");
      return;
    }

    const payload = {
      class_name: className,
      day_of_week: day,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: form.subject.trim(),
      staff_id: form.staff_id,
    };

    if (isNew) {
      // Also need department_id for new entries — derive from selected staff
      const selectedStaff = staffList.find(
        (s) => String(s.id) === String(form.staff_id)
      );
      payload.department_id = selectedStaff?.department_id || null;
    }

    onSave(cell?.id, payload, isNew);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      onDelete(cell.id);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isNew ? "Add Timetable Entry" : "Edit Timetable Entry"}</h3>

        <div className="modal-info">
          <span className="modal-badge">{DAY_NAMES[day]}</span>
          <span className="modal-badge">Period {period}</span>
          <span className="modal-badge">{className}</span>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <input
            list="subject-list"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Enter or select subject"
          />
          <datalist id="subject-list">
            {subjectList.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label>Staff</label>
          <select name="staff_id" value={form.staff_id} onChange={handleChange}>
            <option value="">-- Select Staff --</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <select
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
            >
              {PERIOD_TIMES.map((p) => (
                <option key={p.start} value={p.start}>
                  {p.start.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>End Time</label>
            <select
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
            >
              {PERIOD_TIMES.map((p) => (
                <option key={p.end} value={p.end}>
                  {p.end.slice(0, 5)}
                </option>
              ))}
              {/* Allow extended end times for labs */}
              <option value="10:30:00">10:30</option>
              <option value="11:15:00">11:15</option>
              <option value="12:00:00">12:00</option>
              <option value="14:30:00">14:30</option>
              <option value="15:15:00">15:15</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-save" onClick={handleSave}>
            {isNew ? "Create" : "Save"}
          </button>
          {!isNew && (
            <button className="btn btn-delete" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
