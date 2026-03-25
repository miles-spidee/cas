import { useEffect, useState } from 'react'
import {
  createDepartmentClass,
  createStaff,
  deleteStaff,
  fetchActiveStaff,
  fetchDepartmentClasses,
  fetchStaffByDepartment,
  updateStaff,
} from '../../services/api'

const DAY_OPTIONS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
]

const TIME_OPTIONS = [
  '08:00:00', '08:45:00', '09:30:00', '09:45:00', '10:30:00',
  '11:15:00', '12:00:00', '13:00:00', '13:45:00', '14:30:00', '15:15:00',
]

function Classes({ department, setClassName, onBack }) {
  const [classes, setClasses] = useState([])
  const [staff, setStaff] = useState([])
  const [allStaff, setAllStaff] = useState([])

  const [newClassForm, setNewClassForm] = useState({
    class_name: '',
    day_of_week: 1,
    start_time: '08:00:00',
    end_time: '08:45:00',
    subject: '',
    staff_id: '',
  })
  const [facultyInput, setFacultyInput] = useState('')

  const [staffForm, setStaffForm] = useState({ name: '', email: '' })
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [editingStaffForm, setEditingStaffForm] = useState({ name: '', email: '' })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const getFacultyOptionLabel = (member) =>
    `${member.name}${member.email ? ` (${member.email})` : ''} - ${String(member.id).slice(0, 8)}`

  const load = async () => {
    setLoading(true)
    try {
      const [classesData, staffData, allStaffData] = await Promise.all([
        fetchDepartmentClasses(department.id),
        fetchStaffByDepartment(department.id),
        fetchActiveStaff(),
      ])
      setClasses(Array.isArray(classesData) ? classesData : [])
      setStaff(Array.isArray(staffData) ? staffData : [])
      setAllStaff(Array.isArray(allStaffData) ? allStaffData : [])
    } catch {
      setClasses([])
      setStaff([])
      setAllStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [department.id])

  const updateClassForm = (key, value) => {
    setNewClassForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleFacultyInput = (value) => {
    setFacultyInput(value)
    const selected = allStaff.find((m) => getFacultyOptionLabel(m) === value)
    updateClassForm('staff_id', selected ? selected.id : '')
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    if (!newClassForm.class_name.trim() || !newClassForm.subject.trim() || !newClassForm.staff_id) {
      alert('Class name, subject and assigned staff are required')
      return
    }
    if (newClassForm.start_time >= newClassForm.end_time) {
      alert('End time must be later than start time')
      return
    }

    setSaving(true)
    try {
      await createDepartmentClass({
        class_name: newClassForm.class_name.trim(),
        department_id: department.id,
        day_of_week: Number(newClassForm.day_of_week),
        start_time: newClassForm.start_time,
        end_time: newClassForm.end_time,
        subject: newClassForm.subject.trim(),
        staff_id: newClassForm.staff_id,
      })

      setNewClassForm({
        class_name: '',
        day_of_week: 1,
        start_time: '08:00:00',
        end_time: '08:45:00',
        subject: '',
        staff_id: '',
      })
      setFacultyInput('')
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      alert('Staff name and email are required')
      return
    }

    setSaving(true)
    try {
      await createStaff({
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        department_id: department.id,
      })
      setStaffForm({ name: '', email: '' })
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStaff = async () => {
    if (!editingStaffId) return
    if (!editingStaffForm.name.trim() || !editingStaffForm.email.trim()) {
      alert('Staff name and email are required')
      return
    }

    setSaving(true)
    try {
      await updateStaff(editingStaffId, {
        name: editingStaffForm.name.trim(),
        email: editingStaffForm.email.trim(),
        department_id: department.id,
      })
      setEditingStaffId(null)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member?')) return
    setSaving(true)
    try {
      await deleteStaff(id)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button className="tt-back-btn" onClick={onBack}>Back to Departments</button>
      <h2 className="tt-title">{department.name}</h2>
      <p className="tt-subtitle">Select a class to view and edit timetable</p>

      {loading ? <p>Loading classes...</p> : (
        <div className="tt-grid">
          {classes.map((c) => (
            <div key={c.class_name} className="tt-card" onClick={() => setClassName(c.class_name)}>
              {c.class_name}
            </div>
          ))}
        </div>
      )}

      <hr className="tt-divider" />
      <h3>Create New Class</h3>

      <form className="tt-form" onSubmit={handleCreateClass}>
        <div className="tt-field">
          <label>Class Name</label>
          <input value={newClassForm.class_name} onChange={(e) => updateClassForm('class_name', e.target.value)} required />
        </div>
        <div className="tt-field">
          <label>Day</label>
          <select value={newClassForm.day_of_week} onChange={(e) => updateClassForm('day_of_week', Number(e.target.value))}>
            {DAY_OPTIONS.map((day) => <option key={day.id} value={day.id}>{day.name}</option>)}
          </select>
        </div>
        <div className="tt-field">
          <label>Start</label>
          <select value={newClassForm.start_time} onChange={(e) => updateClassForm('start_time', e.target.value)}>
            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time.slice(0, 5)}</option>)}
          </select>
        </div>
        <div className="tt-field">
          <label>End</label>
          <select value={newClassForm.end_time} onChange={(e) => updateClassForm('end_time', e.target.value)}>
            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time.slice(0, 5)}</option>)}
          </select>
        </div>
        <div className="tt-field">
          <label>Subject</label>
          <input value={newClassForm.subject} onChange={(e) => updateClassForm('subject', e.target.value)} required />
        </div>
        <div className="tt-field">
          <label>Assigned Staff</label>
          <input
            type="text"
            list="tt-all-faculty-options"
            value={facultyInput}
            onChange={(e) => handleFacultyInput(e.target.value)}
            required
          />
          <datalist id="tt-all-faculty-options">
            {allStaff.map((member) => <option key={member.id} value={getFacultyOptionLabel(member)} />)}
          </datalist>
        </div>
        <button className="tt-btn tt-btn-primary" type="submit" disabled={saving}>Add Class</button>
      </form>

      <hr className="tt-divider" />
      <h3>Staff Management</h3>

      <form className="tt-form" onSubmit={handleCreateStaff}>
        <div className="tt-field">
          <label>Name</label>
          <input value={staffForm.name} onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))} required />
        </div>
        <div className="tt-field">
          <label>Email</label>
          <input type="email" value={staffForm.email} onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))} required />
        </div>
        <button className="tt-btn tt-btn-primary" type="submit" disabled={saving}>Add Staff</button>
      </form>

      <div className="tt-staff-list">
        {staff.map((member) => {
          const isEditing = editingStaffId === member.id
          return (
            <div key={member.id} className="tt-staff-row">
              {isEditing ? (
                <>
                  <input value={editingStaffForm.name} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, name: e.target.value }))} />
                  <input value={editingStaffForm.email} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <button className="tt-mini-btn tt-mini-btn-save" type="button" onClick={handleUpdateStaff}>Save</button>
                  <button className="tt-mini-btn" type="button" onClick={() => setEditingStaffId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="tt-staff-main">
                    <strong>{member.name}</strong>
                    <span>{member.email || '-'}</span>
                  </div>
                  <div className="tt-actions">
                    <button className="tt-mini-btn" type="button" onClick={() => {
                      setEditingStaffId(member.id)
                      setEditingStaffForm({ name: member.name || '', email: member.email || '' })
                    }}>Edit</button>
                    <button className="tt-mini-btn tt-mini-btn-danger" type="button" onClick={() => handleDeleteStaff(member.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Classes
