import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAbsentStaff,
  fetchAffectedClasses,
  fetchSwapCandidates,
  fetchAssignments,
  assignSwap
} from '../services/api'
import '../styles/hod-dashboard.css'

function HODDashboard() {
  const navigate = useNavigate()

  const [absentStaff, setAbsentStaff] = useState([])
  const [affectedClasses, setAffectedClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Assignments map:  key = "className|startTime" → { assigned_staff_name, recommended_staff_id, status, ... }
  const [assignments, setAssignments] = useState({})

  // Swap-candidate state
  const [selectedClass, setSelectedClass] = useState(null)
  const [swapCandidates, setSwapCandidates] = useState([])
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapError, setSwapError] = useState(null)

  // Custom selection in right panel
  const [pickedCandidate, setPickedCandidate] = useState(null) // candidate object user clicked
  const [confirmLoading, setConfirmLoading] = useState(false)

  // ── helpers ──
  const classKey = (cls) => `${cls.class_name}|${cls.start_time}`

  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  // ── load data ──
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [staff, classes, existing] = await Promise.all([
        fetchAbsentStaff(),
        fetchAffectedClasses(),
        fetchAssignments()
      ])
      setAbsentStaff(staff)
      setAffectedClasses(classes)

      // Build assignments map from existing DB records
      const map = {}
      existing.forEach((a) => {
        map[`${a.class_name}|${a.start_time}`] = a
      })
      setAssignments(map)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── click a class card → fetch candidates & auto-pick top ──
  const handleClassClick = async (cls) => {
    setSelectedClass(cls)
    setSwapCandidates([])
    setSwapError(null)
    setSwapLoading(true)
    setPickedCandidate(null)
    try {
      const candidates = await fetchSwapCandidates({
        absent_staff_id: cls.absent_staff_id,
        start_time: cls.start_time,
        end_time: cls.end_time
      })
      setSwapCandidates(candidates)

      // Auto-pick: if there's already an assignment use that, otherwise top candidate
      const existing = assignments[classKey(cls)]
      if (existing) {
        const match = candidates.find((c) => c.id === existing.recommended_staff_id)
        setPickedCandidate(match || candidates[0] || null)
      } else {
        setPickedCandidate(candidates[0] || null)
      }
    } catch (err) {
      console.error(err)
      setSwapError(err.message)
    } finally {
      setSwapLoading(false)
    }
  }

  // ── confirm swap ──
  const handleConfirmSwap = async () => {
    if (!selectedClass || !pickedCandidate) return
    setConfirmLoading(true)
    try {
      const result = await assignSwap({
        absent_staff_id: selectedClass.absent_staff_id,
        class_name: selectedClass.class_name,
        subject: selectedClass.subject,
        start_time: selectedClass.start_time,
        end_time: selectedClass.end_time,
        recommended_staff_id: pickedCandidate.id
      })
      // Update assignments map
      setAssignments((prev) => ({
        ...prev,
        [classKey(selectedClass)]: result
      }))
    } catch (err) {
      console.error(err)
      setSwapError(err.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCloseSwap = () => {
    setSelectedClass(null)
    setSwapCandidates([])
    setSwapError(null)
    setPickedCandidate(null)
  }

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="hod-dashboard">
      {/* Header Bar */}
      <header className="hod-header">
        <h1 className="hod-header__title">HOD Dashboard</h1>
        <span className="hod-header__subtitle">Class Alter System</span>
      </header>

      {/* Body */}
      <div className="hod-body">
        {/* Left Section – 65 % — Affected Classes */}
        <section className="hod-panel hod-panel--main">
          <h2 className="hod-panel__heading">Affected Classes</h2>

          {loading && <p className="hod-status">Loading…</p>}
          {error && <p className="hod-status hod-status--error">⚠ {error}</p>}

          {!loading && !error && affectedClasses.length === 0 && (
            <p className="hod-status">No affected classes today 🎉</p>
          )}

          <div className="hod-list">
            {affectedClasses.map((cls, i) => {
              const isSelected =
                selectedClass &&
                selectedClass.class_name === cls.class_name &&
                selectedClass.start_time === cls.start_time &&
                selectedClass.absent_staff_id === cls.absent_staff_id

              const assignment = assignments[classKey(cls)]

              return (
                <div
                  className={`hod-card ${isSelected ? 'hod-card--selected' : ''} ${assignment ? 'hod-card--assigned' : ''}`}
                  key={i}
                  onClick={() => handleClassClick(cls)}
                >
                  <div className="hod-card__top">
                    <span className="hod-card__class">{cls.class_name}</span>
                    <span className="hod-card__time">
                      {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                    </span>
                  </div>
                  <div className="hod-card__bottom">
                    <span className="hod-card__subject">{cls.subject}</span>
                    <span className="hod-card__teacher">
                      <span className="hod-card__dot"></span>
                      {cls.absent_teacher}
                    </span>
                  </div>

                  {/* Assignment badge on the card */}
                  {assignment && (
                    <div className="hod-card__assignment">
                      <span className="hod-card__assign-icon">↻</span>
                      <span className="hod-card__assign-name">
                        {assignment.assigned_staff_name}
                      </span>
                      <span className={`hod-card__assign-status hod-card__assign-status--${assignment.status?.toLowerCase()}`}>
                        {assignment.status}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Right Section – 35 % */}
        <section className="hod-panel hod-panel--side">
          {selectedClass ? (
            <>
              {/* ── Swap Candidates view ── */}
              <div className="hod-panel__heading-row">
                <h2 className="hod-panel__heading">Swap Candidates</h2>
                <button className="hod-close-btn" onClick={handleCloseSwap} title="Back to Absent Staff">
                  ✕
                </button>
              </div>

              {/* Context: which class */}
              <div className="hod-swap-context">
                <span className="hod-swap-context__class">{selectedClass.class_name}</span>
                <span className="hod-swap-context__meta">
                  {selectedClass.subject} · {formatTime(selectedClass.start_time)} – {formatTime(selectedClass.end_time)}
                </span>
                <span className="hod-swap-context__absent">
                  Absent: {selectedClass.absent_teacher}
                </span>
              </div>

              {swapLoading && <p className="hod-status">Finding candidates…</p>}
              {swapError && <p className="hod-status hod-status--error">⚠ {swapError}</p>}

              {!swapLoading && !swapError && swapCandidates.length === 0 && (
                <p className="hod-status">No available candidates found</p>
              )}

              <div className="hod-list">
                {swapCandidates.map((c, idx) => {
                  const isPicked = pickedCandidate?.id === c.id
                  const isTopRecommended = idx === 0

                  return (
                    <div
                      className={`hod-candidate-row ${isPicked ? 'hod-candidate-row--picked' : ''}`}
                      key={c.id}
                      onClick={() => setPickedCandidate(c)}
                    >
                      <span className="hod-candidate-row__avatar">
                        {c.name.charAt(0)}
                      </span>
                      <div className="hod-candidate-row__info">
                        <span className="hod-candidate-row__name">
                          {c.name}
                          {isTopRecommended && (
                            <span className="hod-candidate-row__badge">★ Recommended</span>
                          )}
                        </span>
                        <span className="hod-candidate-row__free">
                          Free for {Math.round(c.free_minutes)} min
                        </span>
                      </div>
                      {isPicked && <span className="hod-candidate-row__check">✓</span>}
                    </div>
                  )
                })}
              </div>

              {/* Confirm button */}
              {pickedCandidate && (
                <button
                  className="hod-confirm-btn"
                  onClick={handleConfirmSwap}
                  disabled={confirmLoading}
                >
                  {confirmLoading
                    ? 'Assigning…'
                    : `Assign ${pickedCandidate.name.split(' ').pop()}`}
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── Absent Staff view (default) ── */}
              <h2 className="hod-panel__heading">Absent Staff</h2>

              {loading && <p className="hod-status">Loading…</p>}
              {error && <p className="hod-status hod-status--error">⚠ {error}</p>}

              {!loading && !error && absentStaff.length === 0 && (
                <p className="hod-status">All staff present today ✓</p>
              )}

              <div className="hod-list">
                {absentStaff.map((staff) => (
                  <div className="hod-staff-row" key={staff.id}>
                    <span className="hod-staff-row__avatar">
                      {staff.name.charAt(0)}
                    </span>
                    <span className="hod-staff-row__name">{staff.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default HODDashboard
