import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchAbsentStaff,
  fetchAffectedClasses,
  fetchSwapCandidates,
  generateAlterRequests,
  assignSwap
} from '../services/api'
import logo from '../assets/logo.png'
import ipsLogo from '../assets/ips-logo.png'
import '../styles/hod-dashboard.css'

function HODDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [absentStaff, setAbsentStaff] = useState([])
  const [affectedClasses, setAffectedClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Swap-candidate state
  const [selectedClass, setSelectedClass] = useState(null)
  const [swapCandidates, setSwapCandidates] = useState([])
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapError, setSwapError] = useState(null)

  // Custom selection in right panel
  const [pickedCandidate, setPickedCandidate] = useState(null) // candidate object user clicked
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Search in right panel
  const [searchQuery, setSearchQuery] = useState('')

  // Current date/time
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // ── helpers ──
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
    // Re-fetch every 60s so period_status (ONGOING/COMPLETED) stays live
    const interval = setInterval(() => loadData(), 60000)
    return () => clearInterval(interval)
  }, [])

  // ── update current date/time every second ──
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      // Trigger alter-request generation (best-effort — cron also handles this)
      generateAlterRequests().catch((e) =>
        console.warn('generate-alter-requests failed (cron handles it):', e.message)
      )
      // Fetch dashboard data
      const [staffResponse, classes] = await Promise.all([
        fetchAbsentStaff(),
        fetchAffectedClasses()
      ])
      
      // Handle response with message (e.g., attendance not yet recorded)
      if (staffResponse && staffResponse.rows) {
        setAbsentStaff(staffResponse.rows)
        if (staffResponse.message) {
          setError(staffResponse.message)
        } else {
          setError(null)
        }
      } else {
        setAbsentStaff(staffResponse)
        setError(null)
      }
      
      setAffectedClasses(classes)
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
    setSearchQuery('')
    try {
      const candidates = await fetchSwapCandidates({
        absent_staff_id: cls.absent_staff_id,
        start_time: cls.start_time,
        end_time: cls.end_time
      })
      setSwapCandidates(candidates)

      // Auto-pick: if there's already an assignment use that, otherwise top candidate
      if (cls.recommended_staff_id) {
        const match = candidates.find((c) => c.id === cls.recommended_staff_id)
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
        alter_request_id: selectedClass.alter_request_id,
        recommended_staff_id: pickedCandidate.id
      })
      // Update the affected class in-place with the new assignment data
      setAffectedClasses((prev) =>
        prev.map((cls) =>
          cls.alter_request_id === selectedClass.alter_request_id
            ? {
                ...cls,
                recommended_staff_id: result.recommended_staff_id,
                assigned_staff_name: result.assigned_staff_name,
                status: result.status,
              }
            : cls
        )
      )
      // Update selectedClass too so the right panel reflects the change
      setSelectedClass((prev) =>
        prev
          ? {
              ...prev,
              recommended_staff_id: result.recommended_staff_id,
              assigned_staff_name: result.assigned_staff_name,
              status: result.status,
            }
          : prev
      )
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
    setSearchQuery('')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="hod-dashboard">
      {/* Header Bar */}
      <header className="hod-header">
        <div className="hod-header__left">
          <img src={logo} alt="KITE Logo" className="hod-header__logo" />
        </div>
        <div className="hod-header__right">
          <span className="hod-header__user">{user?.name}</span>
          <span className="hod-header__dept">{user?.department_name} — HOD</span>
          <button className="hod-header__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Date/Time Info Bar */}
      <div className="hod-info-bar">
        <span className="hod-info-bar__label">Today:</span>
        <span className="hod-info-bar__date">
          {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        <span className="hod-info-bar__time">
          {currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="hod-info-bar__title">Class Alter System</span>
      </div>

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
                selectedClass.alter_request_id === cls.alter_request_id

              const hasAssignment = !!cls.recommended_staff_id
              const isCompleted = cls.period_status === 'COMPLETED'
              const isOngoing = cls.period_status === 'ONGOING'

              return (
                <div
                  className={`hod-card ${isSelected ? 'hod-card--selected' : ''} ${hasAssignment ? 'hod-card--assigned' : ''} ${isCompleted ? 'hod-card--completed' : ''} ${isOngoing ? 'hod-card--ongoing' : ''}`}
                  key={cls.alter_request_id || i}
                  onClick={() => !isCompleted && handleClassClick(cls)}
                >
                  <div className="hod-card__top">
                    <span className="hod-card__class">
                      {cls.class_name}
                      {isOngoing && <span className="hod-card__live-dot" title="Ongoing now" />}
                    </span>
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
                  {hasAssignment && (
                    <div className="hod-card__assignment">
                      <span className="hod-card__assign-icon">↻</span>
                      <span className="hod-card__assign-name">
                        {cls.assigned_staff_name}
                      </span>
                      {cls.approval_method && (
                        <span className={`hod-card__approval-badge hod-card__approval-badge--${cls.approval_method.toLowerCase()}`}>
                          {cls.approval_method === 'Auto' ? 'Auto' : '👤 HOD'}
                        </span>
                      )}
                      <span className={`hod-card__assign-status hod-card__assign-status--${cls.status?.toLowerCase()}`}>
                        {cls.status}
                      </span>
                    </div>
                  )}

                  {/* Completed overlay label */}
                  {isCompleted && (
                    <div className="hod-card__completed-label">
                      Completed
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

              {/* Confirm button – right below class details */}
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

              {/* Search */}
              <input
                className="hod-search"
                type="text"
                placeholder="Search candidates…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {swapLoading && <p className="hod-status">Finding candidates…</p>}
              {swapError && <p className="hod-status hod-status--error">⚠ {swapError}</p>}

              {!swapLoading && !swapError && swapCandidates.length === 0 && (
                <p className="hod-status">No available candidates found</p>
              )}

              <div className="hod-list">
                {swapCandidates
                  .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((c, idx) => {
                    const isPicked = pickedCandidate?.id === c.id
                    const isTopRecommended = idx === 0 && !searchQuery

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
            </>
          ) : (
            <>
              {/* ── Absent Staff view (default) ── */}
              <h2 className="hod-panel__heading">Absent Staff</h2>

              {/* Search */}
              <input
                className="hod-search"
                type="text"
                placeholder="Search absent staff…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {loading && <p className="hod-status">Loading…</p>}
              {error && <p className="hod-status hod-status--error">ℹ {error}</p>}

              {!loading && !error && absentStaff.length === 0 && (
                <p className="hod-status">All staff present today ✓</p>
              )}

              <div className="hod-list">
                {absentStaff
                  .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((staff) => (
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

      {/* Footer */}
      <footer className="hod-footer">
        <img src={ipsLogo} alt="IPS Tech Community" className="hod-footer__logo" />
        <span className="hod-footer__text">powered by IPS Tech Community</span>
      </footer>
    </div>
  )
}

export default HODDashboard
