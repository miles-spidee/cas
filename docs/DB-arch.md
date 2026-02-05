# CLASS ALTER SYSTEM – Database Documentation

## Overview

**CLASS ALTER SYSTEM** is an automated class substitution platform designed to handle staff absences efficiently.  
When a staff member is absent, the system automatically:

- Identifies affected classes  
- Finds available substitute staff  
- Recommends the most suitable replacement based on free time  
- Notifies the respective HOD  
- Auto-approves and assigns if no action is taken within a fixed time window  

This document explains the **database design**, the **purpose of each table**, and how data flows across the system.

---

## Database Design Principles

- **UUIDs** are used for all primary and foreign keys for security and scalability  
- Tables are **normalized** to avoid duplication  
- Time-based logic uses `DATE`, `TIME`, and `TIMESTAMP`  
- Workflow state is explicitly tracked  
- Live staff availability is derived, not manually entered  

---

## Tables Overview

| Table Name | Purpose |
|-----------|---------|
| `departments` | Stores academic departments |
| `staff` | Master data of all staff members |
| `attendance` | Daily attendance records |
| `timetable` | Class schedules |
| `staff_status` | Live staff availability |
| `alter_requests` | Substitution workflow |
| `alter_candidates` | Ranked substitute candidates |

---

## Table Details

### 1. `departments`

**Purpose**  
Stores the list of departments in the institution.

**Key Columns**
- `id` (UUID, PK) – Unique department identifier  
- `name` (TEXT, UNIQUE) – Department name  

---

### 2. `staff`

**Purpose**  
Acts as the master table for all staff members and HODs.

**Key Columns**
- `id` (UUID, PK) – Staff identifier  
- `name` (TEXT) – Staff full name  
- `email` (TEXT, UNIQUE) – Used for login and notifications  
- `rfid_uid` (TEXT, UNIQUE) – RFID card identifier  
- `department_id` (UUID, FK) – Department mapping  
- `role` (TEXT) – `STAFF` or `HOD`  
- `is_active` (BOOLEAN) – Soft enable/disable staff  

---

### 3. `attendance`

**Purpose**  
Stores daily attendance information collected via RFID.

**Key Columns**
- `id` (UUID, PK) – Attendance record identifier  
- `staff_id` (UUID, FK) – Related staff  
- `date` (DATE) – Attendance date  
- `check_in_time` (TIME) – Null if absent  
- `status` (TEXT) – `PRESENT` or `ABSENT`  

**Constraints**
- One attendance record per staff per day  

---

### 4. `timetable`

**Purpose**  
Defines class schedules for each staff member.

**Key Columns**
- `id` (UUID, PK) – Timetable slot identifier  
- `staff_id` (UUID, FK) – Assigned staff  
- `class_name` (TEXT) – Class or section  
- `subject` (TEXT) – Subject name  
- `day_of_week` (INT) – 1 (Monday) to 7 (Sunday)  
- `start_time` (TIME) – Class start time  
- `end_time` (TIME) – Class end time  

---

### 5. `staff_status`

**Purpose**  
Tracks the real-time working status of each staff member.

**Key Columns**
- `staff_id` (UUID, PK, FK) – One record per staff  
- `current_status` (TEXT) – `FREE` or `TEACHING`  
- `last_class_end_time` (TIMESTAMP) – Last class end time  
- `free_since` (TIMESTAMP) – Start of free duration  

**Note**  
This table is system-managed and should not be manually edited.

---

### 6. `alter_requests`

**Purpose**  
Represents a substitution request created due to staff absence.

**Key Columns**
- `id` (UUID, PK) – Request identifier  
- `absent_staff_id` (UUID, FK) – Absent staff  
- `class_name` (TEXT) – Affected class  
- `subject` (TEXT) – Subject name  
- `class_date` (DATE) – Class date  
- `start_time` (TIME) – Start time  
- `end_time` (TIME) – End time  
- `department_id` (UUID, FK) – Department  
- `recommended_staff_id` (UUID, FK) – System-recommended substitute  
- `status` (TEXT) – `PENDING`, `APPROVED`, `AUTO_APPROVED`, `MODIFIED`, `REJECTED`  
- `created_at` (TIMESTAMP) – Request creation time  
- `expires_at` (TIMESTAMP) – Auto-approval deadline  
- `approved_by` (UUID, FK, nullable) – HOD  

---

### 7. `alter_candidates`

**Purpose**  
Stores all eligible substitute staff for a request along with ranking.

**Key Columns**
- `id` (UUID, PK) – Record identifier  
- `alter_request_id` (UUID, FK) – Parent request  
- `staff_id` (UUID, FK) – Candidate staff  
- `free_duration_minutes` (INT) – Free time duration  
- `rank` (INT) – Priority order (1 = best)  

---

## Data Flow Summary

1. Attendance is recorded  
2. Absent staff are detected  
3. Timetable identifies affected classes  
4. `staff_status` identifies free staff  
5. Ranking logic selects candidates  
6. Alter requests and candidates are created  
7. HOD is notified  
8. Manual or auto-approval assigns the substitute  

---

## Notes for Developers

- All UUIDs are generated at the database level  
- `staff_status` should be updated only by backend jobs  
- Auto-approval is handled via scheduled background tasks  
- Emails redirect to the HOD dashboard for actions  

---

## Project Status

- Database schema: Completed  
- Visualization: dbdiagram.io  
- Backend: Node.js (in progress)  
- Frontend: React JSX (in progress)  

---

## Next Documentation Targets

- API documentation  
- Approval workflow sequence  
- Cron job behavior  
- Deployment guide  
