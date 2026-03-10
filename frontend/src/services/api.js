const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchAbsentStaff(departmentId) {
  const url = departmentId
    ? `${API_BASE}/api/hod/absent-staff?department_id=${departmentId}`
    : `${API_BASE}/api/hod/absent-staff`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch absent staff: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchAffectedClasses() {
  const res = await fetch(`${API_BASE}/api/hod/affected-classes`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch affected classes: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchSwapCandidates({ absent_staff_id, start_time, end_time }) {
  const params = new URLSearchParams({ absent_staff_id, start_time, end_time });
  const res = await fetch(`${API_BASE}/api/hod/swap-candidates?${params}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch swap candidates: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchAssignments() {
  const res = await fetch(`${API_BASE}/api/hod/assignments`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch assignments: ${res.status} ${text}`);
  }
  return res.json();
}

export async function assignSwap(payload) {
  const res = await fetch(`${API_BASE}/api/hod/assign-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to assign swap: ${res.status} ${text}`);
  }
  return res.json();
}
