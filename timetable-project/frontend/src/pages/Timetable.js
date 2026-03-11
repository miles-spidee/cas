import { useEffect, useState } from "react";

function Timetable({ className }) {
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/timetable/${className}`)
      .then(res => res.json())
      .then(data => setTimetable(data));
  }, [className]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div>
      <h2>Timetable for {className}</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((entry, idx) => (
            <tr key={idx}>
              <td>{entry.day_of_week}</td>
              <td>{entry.start_time} - {entry.end_time}</td>
              <td>{entry.subject_name}</td>
              <td>{entry.staff_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Timetable;
