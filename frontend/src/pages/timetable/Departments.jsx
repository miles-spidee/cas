import { useEffect, useState } from 'react'
import { fetchTimetableDepartments } from '../../services/api'

function Departments({ setDepartment }) {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTimetableDepartments()
        setDepartments(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
        setDepartments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h2 className="tt-title">Departments</h2>
      <p className="tt-subtitle">Select a department to manage classes and timetable</p>

      {loading && <p>Loading departments...</p>}
      {!loading && error && <p style={{ color: '#b00020' }}>{error}</p>}
      {!loading && !error && departments.length === 0 && <p>No departments available</p>}

      {!loading && !error && departments.length > 0 && (
        <div className="tt-grid">
          {departments.map((d) => (
            <div key={d.id} className="tt-card" onClick={() => setDepartment(d)}>
              {d.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Departments
