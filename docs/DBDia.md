Table departments {
  id uuid [pk]
  name text [unique, not null]
}

Table staff {
  id uuid [pk]
  name text [not null]
  email text [unique, not null]
  rfid_uid text [unique, not null]
  department_id uuid [not null]
  role text [not null]
  is_active boolean [not null, default: true]
}

Table attendance {
  id uuid [pk]
  staff_id uuid [not null]
  date date [not null]
  check_in_time time
  status text [not null]
}

Table timetable {
  id uuid [pk]
  staff_id uuid [not null]
  class_name text [not null]
  subject text [not null]
  day_of_week int [not null]
  start_time time [not null]
  end_time time [not null]
}

Table staff_status {
  staff_id uuid [pk]
  current_status text [not null]
  last_class_end_time timestamp
  free_since timestamp
}

Table alter_requests {
  id uuid [pk]
  absent_staff_id uuid [not null]
  class_name text [not null]
  subject text [not null]
  class_date date [not null]
  start_time time [not null]
  end_time time [not null]
  department_id uuid [not null]
  recommended_staff_id uuid [not null]
  status text [not null]
  created_at timestamp [not null]
  expires_at timestamp [not null]
  approved_by uuid
}

Table alter_candidates {
  id uuid [pk]
  alter_request_id uuid [not null]
  staff_id uuid [not null]
  free_duration_minutes int [not null]
  rank int [not null]
}

Ref: staff.department_id > departments.id
Ref: attendance.staff_id > staff.id
Ref: timetable.staff_id > staff.id
Ref: staff_status.staff_id > staff.id
Ref: alter_requests.absent_staff_id > staff.id
Ref: alter_requests.recommended_staff_id > staff.id
Ref: alter_requests.approved_by > staff.id
Ref: alter_requests.department_id > departments.id
Ref: alter_candidates.alter_request_id > alter_requests.id
Ref: alter_candidates.staff_id > staff.id
