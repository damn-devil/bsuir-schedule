const BASE = 'https://iis.bsuir.by/api/v1'

async function get(path, signal) {
  const res = await fetch(`${BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const t = await res.text()
  try { return JSON.parse(t) } catch { return t }
}

export const api = {
  scheduleGroup: (num, signal) => get(`/schedule?studentGroup=${encodeURIComponent(num)}`, signal),
  scheduleEmployee: (urlId, signal) => get(`/employees/schedule/${encodeURIComponent(urlId)}`, signal),
  currentWeek: (signal) => get('/schedule/current-week', signal),
  groups: (signal) => get('/student-groups', signal),
  employees: (signal) => get('/employees/all', signal),
  faculties: (signal) => get('/faculties', signal),
  auditories: (signal) => get('/auditories', signal),
  announcementsEmployee: (urlId, signal) => get(`/announcements/employees?url-id=${encodeURIComponent(urlId)}`, signal),
  announcementsDepartment: (id, signal) => get(`/announcements/departments?id=${id}`, signal),
}
