import { useEffect, useState } from 'react'
import { fetchActiveStaff, fetchTimetableSubjects } from '../../services/api'

const TIME_OPTIONS = [
  '08:00:00', '08:45:00', '09:30:00', '09:45:00', '10:30:00',
  '11:15:00', '12:00:00', '13:00:00', '13:45:00', '14:30:00', '15:15:00',
]

const DAY_NAMES = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

function EditModal({ cell, day, slotKey, slot, className, onClose, onSave, onDelete }) {
  const [staffList, setStaffList] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [loading, setLoading] = useState(true)
  const [facultyInput, setFacultyInput] = useState('')

  const isNew = !cell || !cell.id
  const isBreakOrLunch = slotKey === 'BREAK' || slotKey === 'LUNCH'

  const [form, setForm] = useState({
    subject: cell?.subject || (isBreakOrLunch ? slotKey : ''),
    staff_id: cell?.staff_id || '',
    start_time: cell?.start_time || slot.start,
    end_time: cell?.end_time || slot.end,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [staff, subjects] = await Promise.all([fetchActiveStaff(), fetchTimetableSubjects()])
        setStaffList(Array.isArray(staff) ? staff : [])
        const subjectArray = Array.isArray(subjects) ? subjects : []
        setSubjectList(Array.from(new Set([...subjectArray, 'BREAK', 'LUNCH'])))
      } catch {
        setStaffList([])
        setSubjectList(['BREAK', 'LUNCH'])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const getFacultyOptionLabel = (member) =>
    `${member.name}${member.email ? ` (${member.email})` : ''} - ${String(member.id).slice(0, 8)}`

  useEffect(() => {
    if (isBreakOrLunch || !form.staff_id || staffList.length === 0) return
    const selected = staffList.find((member) => String(member.id) === String(form.staff_id))
    if (selected) {
      setFacultyInput(getFacultyOptionLabel(selected))
    }
  }, [staffList, form.staff_id, isBreakOrLunch])

  const handleFacultyInput = (value) => {
    setFacultyInput(value)
    const selected = staffList.find((member) => getFacultyOptionLabel(member) === value)
    setForm((prev) => ({ ...prev, staff_id: selected ? selected.id : '' }))
  }

  const handleSave = () => {
    if (!form.subject.trim()) {
      alert('Subject is required')
      return
    }

    if (!isBreakOrLunch && !form.staff_id) {
      alert('Staff is required')
      return
    }

    if (form.start_time >= form.end_time) {
      alert('End time must be later than start time')
      return
    }

    const selectedStaff = staffList.find((s) => String(s.id) === String(form.staff_id))
    const finalSubject = isBreakOrLunch ? slotKey : form.subject.trim()

    const payload = {
      class_name: className,
      day_of_week: day,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: finalSubject,
      staff_id: isBreakOrLunch ? null : (form.staff_id || null),
      staff_name: isBreakOrLunch ? '' : (selectedStaff?.name || ''),
      department_id: selectedStaff?.department_id || cell?.department_id || null,
    }

    onSave(cell?.id, payload, isNew, { day, slotKey })
  }

  if (loading) {
    return (
      <div className="tt-modal-overlay">
        <div className="tt-modal">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tt-modal-overlay" onClick={onClose}>
      <div className="tt-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isNew ? 'Add Timetable Entry' : 'Edit Timetable Entry'}</h3>

        <div className="tt-modal-info">
          <span className="tt-badge">{DAY_NAMES[day]}</span>
          <span className="tt-badge">{slot.label}</span>
          <span className="tt-badge">{className}</span>
        </div>

        <div className="tt-field">
          <label>Subject</label>
          <input
            list="tt-subject-list"
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
            disabled={isBreakOrLunch}
          />
          <datalist id="tt-subject-list">
            {subjectList.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div className="tt-field">
          <label>Staff</label>
          <input
            type="text"
            list="tt-modal-faculty-options"
            value={facultyInput}
            onChange={(e) => handleFacultyInput(e.target.value)}
            disabled={isBreakOrLunch}
          />
          <datalist id="tt-modal-faculty-options">
            {staffList.map((member) => <option key={member.id} value={getFacultyOptionLabel(member)} />)}
          </datalist>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="tt-field" style={{ flex: 1 }}>
            <label>Start</label>
            <select value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}>
              {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time.slice(0, 5)}</option>)}
            </select>
          </div>
          <div className="tt-field" style={{ flex: 1 }}>
            <label>End</label>
            <select value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}>
              {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time.slice(0, 5)}</option>)}
            </select>
          </div>
        </div>

        <div className="tt-modal-actions">
          <button className="tt-modal-btn tt-modal-save" type="button" onClick={handleSave}>{isNew ? 'Create' : 'Save'}</button>
          {!isNew && <button className="tt-modal-btn tt-modal-delete" type="button" onClick={() => onDelete(cell.id, { day, slotKey })}>Delete</button>}
          <button className="tt-modal-btn tt-modal-cancel" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default EditModal
