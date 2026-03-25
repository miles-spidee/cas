const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const API_BASE = isLocalHost
  ? import.meta.env.VITE_API_URL_LOCAL || "http://localhost:5000"
  : import.meta.env.VITE_API_URL || "https://cas-szpk.onrender.com";

// ── helpers ──

function getToken() {
  return localStorage.getItem("cas_token");
}

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Token expired / invalid — clear and redirect to login
    localStorage.removeItem("cas_token");
    localStorage.removeItem("cas_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

// ── Auth ──

export async function loginAPI(email, password, options = {}) {
  const { portal } = options;
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, portal }),
  });
  return handleResponse(res);
}

// ── HOD endpoints (JWT required) ──

export async function fetchAbsentStaff() {
  const res = await fetch(`${API_BASE}/api/hod/absent-staff`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchAffectedClasses() {
  const res = await fetch(`${API_BASE}/api/hod/affected-classes`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function generateAlterRequests() {
  const res = await fetch(`${API_BASE}/api/hod/generate-alter-requests`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchSwapCandidates({ absent_staff_id, start_time, end_time }) {
  const params = new URLSearchParams({ absent_staff_id, start_time, end_time });
  const res = await fetch(`${API_BASE}/api/hod/swap-candidates?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function assignSwap(payload) {
  const res = await fetch(`${API_BASE}/api/hod/assign-swap`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Timetable endpoints (JWT required) ──

export async function fetchTimetableDepartments() {
  const res = await fetch(`${API_BASE}/api/timetable/departments`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchDepartmentClasses(deptId) {
  const res = await fetch(`${API_BASE}/api/timetable/classes/${deptId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createDepartmentClass(payload) {
  const res = await fetch(`${API_BASE}/api/timetable/classes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchTimetableByClass(className) {
  const res = await fetch(`${API_BASE}/api/timetable/timetable/${encodeURIComponent(className)}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function saveTimetableBatch(payload) {
  const res = await fetch(`${API_BASE}/api/timetable/timetable/batch`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchActiveStaff() {
  const res = await fetch(`${API_BASE}/api/timetable/staff`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchStaffByDepartment(deptId) {
  const res = await fetch(`${API_BASE}/api/timetable/staff/${deptId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createStaff(payload) {
  const res = await fetch(`${API_BASE}/api/timetable/staff`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStaff(id, payload) {
  const res = await fetch(`${API_BASE}/api/timetable/staff/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStaff(id) {
  const res = await fetch(`${API_BASE}/api/timetable/staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchTimetableSubjects() {
  const res = await fetch(`${API_BASE}/api/timetable/subjects`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}
