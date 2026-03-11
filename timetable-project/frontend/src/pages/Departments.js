import { useEffect, useState } from "react";

function Departments({ setDepartment }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/departments")
      .then(res => res.json())
      .then(data => setDepartments(data));
  }, []);

  return (
    <div>
      <h2>Departments</h2>
      {departments.map(d => (
        <button key={d.id} onClick={() => setDepartment(d)}>
          {d.name}
        </button>
      ))}
    </div>
  );
}

export default Departments;
