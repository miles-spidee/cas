import { useState, useEffect } from "react";
import "./EditModal.css";

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

const DAY_NAMES = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function EditModal({ cell, day, slotKey, slot, className, onClose, onSave, onDelete }) {
  const [staffList, setStaffList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [loading, setLoading] = useState(true);

  const isNew = !cell || !cell.id;
  const isBreakOrLunch = slotKey === "BREAK" || slotKey === "LUNCH";

  const [form, setForm] = useState({
    subject: cell?.subject || (isBreakOrLunch ? slotKey : ""),
    staff_id: cell?.staff_id || "",
    start_time: cell?.start_time || slot.start,
    end_time: cell?.end_time || slot.end,
  });

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5001/staff").then((r) => r.json()),
      fetch("http://localhost:5001/subjects").then((r) => r.json()),
    ])
      .then(([staff, subjects]) => {
        setStaffList(staff);
        setSubjectList(Array.from(new Set([...(subjects || []), "BREAK", "LUNCH"])));
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
    if (!isBreakOrLunch && !form.staff_id) {
      alert("Staff is required");
      return;
    }

    if (form.start_time >= form.end_time) {
      alert("End time must be later than start time");
      return;
    }

    const selectedStaff = staffList.find(
      (s) => String(s.id) === String(form.staff_id)
    );

    const finalSubject = isBreakOrLunch ? slotKey : form.subject.trim();

    const payload = {
      class_name: className,
      day_of_week: day,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: finalSubject,
      staff_id: isBreakOrLunch ? null : (form.staff_id || null),
      staff_name: isBreakOrLunch ? "" : (selectedStaff?.name || ""),
      department_id: selectedStaff?.department_id || cell?.department_id || null,
    };

    onSave(cell?.id, payload, isNew, { day, slotKey });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      onDelete(cell.id, { day, slotKey });
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
          <span className="modal-badge">{slot.label}</span>
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
            disabled={isBreakOrLunch}
          />
          <datalist id="subject-list">
            {subjectList.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label>Staff</label>
          <select name="staff_id" value={form.staff_id} onChange={handleChange} disabled={isBreakOrLunch}>
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
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time.slice(0, 5)}
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
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time.slice(0, 5)}
                </option>
              ))}
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
