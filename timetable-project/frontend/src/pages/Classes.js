import { useEffect, useState } from "react";

function Classes({ department, setClassName }) {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/classes/${department.id}`)
      .then(res => res.json())
      .then(data => setClasses(data));
  }, [department.id]);

  return (
    <div>
      <h2>{department.name} Classes</h2>
      {classes.map(c => (
        <button key={c.class_name} onClick={() => setClassName(c.class_name)}>
          {c.class_name}
        </button>
      ))}
    </div>
  );
}

export default Classes;
