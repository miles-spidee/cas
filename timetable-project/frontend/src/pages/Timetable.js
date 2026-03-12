import { useEffect, useState, useCallback } from "react";
import EditModal from "../components/EditModal";
import "./Timetable.css";

const API = "http://localhost:5001";

function Timetable({ className, onBack }) {
  const [timetable, setTimetable] = useState({});
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

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  /* ---- FETCH TIMETABLE ---- */
  const fetchTimetable = useCallback(() => {
    fetch(`${API}/timetable/${className}`)
      .then((res) => res.json())
      .then((data) => setTimetable(data))
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
  const handleCellClick = (day, period, cell) => {
    setEditTarget({ cell, day, period });
  };

  /* ---- SAVE (CREATE / UPDATE) ---- */
  const handleSave = async (id, payload, isNew) => {
    try {
      let res;

      if (isNew) {
        res = await fetch(`${API}/timetable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/timetable/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      showNotification(isNew ? "Entry created!" : "Entry updated!");
      setEditTarget(null);
      fetchTimetable();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ---- DELETE ---- */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/timetable/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }

      showNotification("Entry deleted!", "delete");
      setEditTarget(null);
      fetchTimetable();
    } catch (err) {
      alert("Error: " + err.message);
    }
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
        <p className="timetable-hint">Click any cell to edit or add an entry</p>
      </div>

      <div className="timetable-scroll">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th className="day-col">Day</th>
              <th className="period-col">
                1<br />
                <span className="time-label">08:00</span>
              </th>
              <th className="period-col">
                2<br />
                <span className="time-label">08:45</span>
              </th>
              <th className="break-col">Break</th>
              <th className="period-col">
                3<br />
                <span className="time-label">09:45</span>
              </th>
              <th className="period-col">
                4<br />
                <span className="time-label">10:30</span>
              </th>
              <th className="period-col">
                5<br />
                <span className="time-label">11:15</span>
              </th>
              <th className="break-col">Lunch</th>
              <th className="period-col">
                6<br />
                <span className="time-label">13:00</span>
              </th>
              <th className="period-col">
                7<br />
                <span className="time-label">13:45</span>
              </th>
              <th className="period-col">
                8<br />
                <span className="time-label">14:30</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {days.map((day) => {
              let skip = 0;
              const cells = [];

              periods.forEach((period) => {
                if (skip > 0) {
                  skip--;
                  return;
                }

                const cell = timetable?.[day.id]?.[period];

                if (cell?.span > 1) {
                  skip = cell.span - 1;
                }

                const isEmpty = !cell;
                const isLab = cell?.span > 1;

                cells.push(
                  <td
                    key={period}
                    colSpan={cell?.span || 1}
                    className={`tt-cell ${isEmpty ? "tt-cell-empty" : ""} ${
                      isLab ? "tt-cell-lab" : ""
                    }`}
                    onClick={() => handleCellClick(day.id, period, cell || null)}
                    title={isEmpty ? "Click to add" : "Click to edit"}
                  >
                    {cell ? (
                      <>
                        <div className="cell-subject">{cell.subject}</div>
                        <div className="cell-staff">{cell.staff}</div>
                      </>
                    ) : (
                      <div className="cell-plus">+</div>
                    )}
                  </td>
                );

                /* Break after period 2 */
                if (period === 2) {
                  cells.push(
                    <td key={`break-${day.id}`} className="break-cell">
                      Break
                    </td>
                  );
                }

                /* Lunch after period 5 */
                if (period === 5) {
                  cells.push(
                    <td key={`lunch-${day.id}`} className="break-cell">
                      Lunch
                    </td>
                  );
                }
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
          period={editTarget.period}
          className={className}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default Timetable;