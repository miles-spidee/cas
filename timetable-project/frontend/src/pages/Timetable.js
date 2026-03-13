import { useEffect, useState, useCallback } from "react";
import EditModal from "../components/EditModal";
import "./Timetable.css";

const API = "http://localhost:5000/timemaster";

const SLOT_CONFIG = [
  { key: "P1", label: "1", start: "08:00:00", end: "08:45:00", type: "period", timeLabel: "08:00" },
  { key: "P2", label: "2", start: "08:45:00", end: "09:30:00", type: "period", timeLabel: "08:45" },
  { key: "BREAK", label: "Break", start: "09:30:00", end: "09:45:00", type: "break" },
  { key: "P3", label: "3", start: "09:45:00", end: "10:30:00", type: "period", timeLabel: "09:45" },
  { key: "P4", label: "4", start: "10:30:00", end: "11:15:00", type: "period", timeLabel: "10:30" },
  { key: "P5", label: "5", start: "11:15:00", end: "12:00:00", type: "period", timeLabel: "11:15" },
  { key: "LUNCH", label: "Lunch", start: "12:00:00", end: "13:00:00", type: "lunch" },
  { key: "P6", label: "6", start: "13:00:00", end: "13:45:00", type: "period", timeLabel: "13:00" },
  { key: "P7", label: "7", start: "13:45:00", end: "14:30:00", type: "period", timeLabel: "13:45" },
  { key: "P8", label: "8", start: "14:30:00", end: "15:15:00", type: "period", timeLabel: "14:30" },
];

const PERIOD_KEYS = SLOT_CONFIG.filter((slot) => slot.type === "period").map((slot) => slot.key);

function Timetable({ className, onBack }) {
  const [timetable, setTimetable] = useState({});
  const [pendingCreates, setPendingCreates] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { cell, day, period }
  const [notification, setNotification] = useState(null);

  const days = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const hasPendingChanges =
    Object.keys(pendingCreates).length > 0 ||
    Object.keys(pendingUpdates).length > 0 ||
    Object.keys(pendingDeletes).length > 0;

  /* ---- FETCH TIMETABLE ---- */
  const fetchTimetable = useCallback(() => {
    fetch(`${API}/timetable/${className}`)
      .then((res) => res.json())
      .then((data) => {
        setTimetable(data);
        setPendingCreates({});
        setPendingUpdates({});
        setPendingDeletes({});
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [className]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  /* ---- NOTIFICATION ---- */
  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* ---- CELL CLICK ---- */
  const handleCellClick = (day, slotKey, slot, cell) => {
    setEditTarget({ cell, day, slotKey, slot });
  };

  const getKnownDepartmentId = () => {
    for (const day of Object.keys(timetable || {})) {
      const dayCells = timetable[day] || {};
      for (const slotKey of Object.keys(dayCells)) {
        const deptId = dayCells[slotKey]?.department_id;
        if (deptId) return deptId;
      }
    }

    for (const tempId of Object.keys(pendingCreates || {})) {
      if (pendingCreates[tempId]?.department_id) {
        return pendingCreates[tempId].department_id;
      }
    }

    return null;
  };

  const getLocalSpan = (slotKey, startTime, endTime) => {
    if (slotKey === "BREAK" || slotKey === "LUNCH") return 1;

    const span = Math.round(
      (new Date(`1970-01-01T${endTime}`) - new Date(`1970-01-01T${startTime}`)) /
        (45 * 60 * 1000)
    );

    return Math.max(1, span);
  };

  const updateLocalCell = (day, slotKey, cellData) => {
    setTimetable((prev) => {
      const next = { ...prev };
      const dayCells = { ...(next[day] || {}) };

      dayCells[slotKey] = {
        ...(dayCells[slotKey] || {}),
        ...cellData,
      };

      next[day] = dayCells;
      return next;
    });
  };

  const removeLocalCell = (day, slotKey) => {
    setTimetable((prev) => {
      const next = { ...prev };
      if (!next[day]) return next;

      const dayCells = { ...next[day] };
      delete dayCells[slotKey];
      next[day] = dayCells;
      return next;
    });
  };

  /* ---- STAGE SAVE (CREATE / UPDATE) ---- */
  const handleStageSave = (id, payload, isNew, context) => {
    const { day, slotKey } = context;
    const normalizedPayload = {
      ...payload,
      department_id: payload.department_id || getKnownDepartmentId(),
    };

    if (isNew) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      setPendingCreates((prev) => ({
        ...prev,
        [tempId]: normalizedPayload,
      }));

      updateLocalCell(day, slotKey, {
        id: tempId,
        subject: normalizedPayload.subject,
        staff: normalizedPayload.staff_name || "",
        staff_id: normalizedPayload.staff_id || null,
        department_id: normalizedPayload.department_id,
        start_time: normalizedPayload.start_time,
        end_time: normalizedPayload.end_time,
        span: getLocalSpan(slotKey, normalizedPayload.start_time, normalizedPayload.end_time),
      });

      setEditTarget(null);
      showNotification("Change staged locally");
      return;
    }

    const isTemp = String(id).startsWith("temp-");

    if (isTemp) {
      setPendingCreates((prev) => ({
        ...prev,
        [id]: normalizedPayload,
      }));
    } else {
      setPendingUpdates((prev) => ({
        ...prev,
        [id]: {
          id,
          ...normalizedPayload,
        },
      }));

      setPendingDeletes((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    updateLocalCell(day, slotKey, {
      id,
      subject: normalizedPayload.subject,
      staff: normalizedPayload.staff_name || "",
      staff_id: normalizedPayload.staff_id || null,
      department_id: normalizedPayload.department_id,
      start_time: normalizedPayload.start_time,
      end_time: normalizedPayload.end_time,
      span: getLocalSpan(slotKey, normalizedPayload.start_time, normalizedPayload.end_time),
    });

    setEditTarget(null);
    showNotification("Change staged locally");
  };

  /* ---- STAGE DELETE ---- */
  const handleStageDelete = (id, context) => {
    const { day, slotKey } = context;

    if (String(id).startsWith("temp-")) {
      setPendingCreates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setPendingDeletes((prev) => ({ ...prev, [id]: true }));
      setPendingUpdates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    removeLocalCell(day, slotKey);
    setEditTarget(null);
    showNotification("Delete staged locally", "delete");
  };

  const handleSaveAll = async () => {
    if (!hasPendingChanges) return;

    setSavingAll(true);

    try {
      const res = await fetch(`${API}/timetable/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creates: Object.values(pendingCreates),
          updates: Object.values(pendingUpdates),
          deletes: Object.keys(pendingDeletes),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Batch save failed");
      }

      showNotification("All staged changes saved");
      fetchTimetable();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingAll(false);
    }
  };

  const getCellSpan = (cell, slotKey) => {
    if (!cell) return 1;
    if (slotKey === "BREAK" || slotKey === "LUNCH") return 1;

    const span = cell.span ? Number(cell.span) : 1;
    const startIndex = PERIOD_KEYS.indexOf(slotKey);
    if (startIndex < 0) return 1;

    return Math.max(1, Math.min(span, PERIOD_KEYS.length - startIndex));
  };

  /* ---- RENDER ---- */
  return (
    <div className="timetable-container">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <button className="back-btn" onClick={onBack}>
        ← Back to Classes
      </button>

      <div className="timetable-header">
        <h2>Timetable &mdash; {className}</h2>
        <p className="timetable-hint">Click any cell to stage create/update/delete changes locally</p>
      </div>

      {hasPendingChanges && (
        <div className="save-banner">
          <div className="save-banner-text">
            Unsaved changes: {Object.keys(pendingCreates).length} create, {Object.keys(pendingUpdates).length} update, {Object.keys(pendingDeletes).length} delete
          </div>
          <button className="save-all-btn" onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      )}

      <div className="timetable-scroll">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th className="day-col">Day</th>
              {SLOT_CONFIG.map((slot) => (
                <th
                  key={slot.key}
                  className={slot.type === "period" ? "period-col" : "break-col"}
                >
                  {slot.type === "period" ? (
                    <>
                      {slot.label}
                      <br />
                      <span className="time-label">{slot.timeLabel}</span>
                    </>
                  ) : (
                    slot.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => {
              let skipPeriodSlots = 0;
              const cells = [];

              SLOT_CONFIG.forEach((slot) => {
                if (slot.type === "period" && skipPeriodSlots > 0) {
                  skipPeriodSlots--;
                  return;
                }

                const cell = timetable?.[day.id]?.[slot.key];

                const colSpan = getCellSpan(cell, slot.key);

                const isEmpty = !cell;
                const isLab = colSpan > 1;
                const isBreakOrLunchSlot = slot.key === "BREAK" || slot.key === "LUNCH";

                if (slot.type === "period" && colSpan > 1) {
                  skipPeriodSlots = colSpan - 1;
                }

                cells.push(
                  <td
                    key={slot.key}
                    colSpan={colSpan}
                    className={`tt-cell ${isEmpty ? "tt-cell-empty" : ""} ${
                      isLab ? "tt-cell-lab" : ""
                    }`}
                    onClick={() => handleCellClick(day.id, slot.key, slot, cell || null)}
                    title={isEmpty ? "Click to add" : "Click to edit"}
                  >
                    {cell ? (
                      <>
                        <div className="cell-subject">{cell.subject}</div>
                        {cell.staff && <div className="cell-staff">{cell.staff}</div>}
                        {String(cell.id).startsWith("temp-") && (
                          <div className="cell-dirty-tag">unsaved</div>
                        )}
                      </>
                    ) : (
                      <div className="cell-plus">{isBreakOrLunchSlot ? "Set" : "+"}</div>
                    )}
                  </td>
                );
              });

              return (
                <tr key={day.id}>
                  <td className="day-cell">{day.name}</td>
                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editTarget && (
        <EditModal
          cell={editTarget.cell}
          day={editTarget.day}
          slotKey={editTarget.slotKey}
          slot={editTarget.slot}
          className={className}
          onClose={() => setEditTarget(null)}
          onSave={handleStageSave}
          onDelete={handleStageDelete}
        />
      )}
    </div>
  );
}

export default Timetable;