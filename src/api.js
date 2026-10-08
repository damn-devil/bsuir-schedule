const BASE = 'https://iis.bsuir.by/api/v1'

async function get(path, signal) {
  const res = await fetch(`${BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const t = await res.text()
  try { return JSON.parse(t) } catch { return t }
}

async function getSchedule(name, signal) {
  const res = await fetch(`${BASE}/schedule?studentGroup=${encodeURIComponent(name)}`, { signal })
  if (!res.ok) return null
  const t = await res.text()
  try { return JSON.parse(t) } catch { return null }
}

function extractSubjects(sched) {
  const set = new Set()
  if (!sched?.schedules) return set
  for (const lessons of Object.values(sched.schedules)) {
    if (Array.isArray(lessons)) for (const l of lessons) if (l.subject) set.add(l.subject)
  }
  return set
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
  studentRating: (cardNumber, signal) => get(`/rating/studentRating?studentCardNumber=${encodeURIComponent(cardNumber)}`, signal),

  async findGroupsByCard(cardNumber, onProgress) {
    const rating = await this.studentRating(cardNumber)
    const studentSubjects = new Set((rating?.lessons || []).map(l => l.lessonNameAbbrev).filter(Boolean))
    if (studentSubjects.size === 0) return { rating, groups: [] }

    const groups = await this.groups()
    const results = []
    const BATCH = 25
    for (let i = 0; i < groups.length; i += BATCH) {
      if (onProgress) onProgress(Math.min(i + BATCH, groups.length), groups.length)
      const batch = groups.slice(i, i + BATCH)
      const scheds = await Promise.all(batch.map(g => getSchedule(g.name).catch(() => null)))
      for (let j = 0; j < batch.length; j++) {
        const s = scheds[j]
        if (!s) continue
        const groupSubjects = extractSubjects(s)
        if (groupSubjects.size === 0) continue
        let matches = 0
        for (const sub of studentSubjects) if (groupSubjects.has(sub)) matches++
        const pct = matches / studentSubjects.size
        if (pct >= 0.7) results.push({ ...batch[j], matchPct: pct, matches, total: studentSubjects.size })
      }
      if (results.length > 0 && results.some(r => r.matchPct >= 0.95)) break
    }
    results.sort((a, b) => b.matchPct - a.matchPct)
    return { rating, groups: results.slice(0, 5) }
  },
}
