import { useEffect, useState } from "react";

const API = "http://localhost:5001";

function Classes({ department, setClassName, onBack }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---- Create class form ---- */
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department.id]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch(`${API}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: name,
          department_id: department.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create class");
      }

      setNewClassName("");
      fetchClasses();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCreating(false);
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
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn-create"
          disabled={creating || !newClassName.trim()}
        >
          {creating ? "Creating..." : "+ Add Class"}
        </button>
      </form>
    </div>
  );
}

export default Classes;
