import { useEffect, useState } from "react";

function Departments({ setDepartment }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/timemaster/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Departments</h1>
      <p className="page-subtitle">Select a department to view its classes and timetables</p>

      {loading ? (
        <p>Loading departments...</p>
      ) : (
        <div className="card-grid">
          {departments.map((d) => (
            <div
              key={d.id}
              className="card-item"
              onClick={() => setDepartment(d)}
            >
              {d.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Departments;
