export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const WEEKDAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const LESSON_SLOTS = [
  { num: 1, start: '08:30', end: '09:55' },
  { num: 2, start: '10:05', end: '11:30' },
  { num: 3, start: '12:00', end: '13:25' },
  { num: 4, start: '13:35', end: '15:00' },
  { num: 5, start: '15:30', end: '16:55' },
  { num: 6, start: '17:05', end: '18:30' },
  { num: 7, start: '18:40', end: '20:05' },
]

export const BREAK_TIMES = [
  { after: 1, start: '09:55', end: '10:05', minutes: 10 },
  { after: 2, start: '11:30', end: '12:00', minutes: 30 },
  { after: 3, start: '13:25', end: '13:35', minutes: 10 },
  { after: 4, start: '15:00', end: '15:30', minutes: 30 },
  { after: 5, start: '16:55', end: '17:05', minutes: 10 },
  { after: 6, start: '18:30', end: '18:40', minutes: 30 },
]

const LESSON_COLORS = {
  'ЛК': '#34c759',
  'Лекция': '#34c759',
  'ПЗ': '#ff3b30',
  'Практическое занятие': '#ff3b30',
  'ЛР': '#ff9500',
  'Лабораторная работа': '#ff9500',
  'Консультация': '#af52de',
  'КП': '#5856d6',
  'Курсовое проектирование': '#5856d6',
  'Экзамен': '#8b5cf6',
  'Зачет': '#8b5cf6',
  'КР': '#8b5cf6',
  'Дифференцированный зачет': '#8b5cf6',
}

export function lessonColor(type) {
  return LESSON_COLORS[type] || '#8e8e93'
}

export function lessonTime(start, end) {
  return `${start || '??:??'} – ${end || '??:??'}`
}

export function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function isToday(d) {
  if (!d) return false
  const now = new Date()
  const date = new Date(d)
  return now.toDateString() === date.toDateString()
}

export function parseSchedule(schedule) {
  if (!schedule) return { days: {}, exams: [] }
  const days = {}
  const s = schedule.schedules || {}
  for (const [dayKey, lessons] of Object.entries(s)) {
    if (Array.isArray(lessons) && lessons.length > 0) {
      days[dayKey] = lessons
    }
  }
  const exams = Array.isArray(schedule.exams) ? schedule.exams : []
  return { days, exams }
}

export function filterBySubgroup(lessons, subgroup) {
  if (!subgroup || subgroup === 0) {
    const seen = new Set()
    return lessons.filter((l) => {
      const key = `${l.subject}-${l.startLessonTime}-${l.numSubgroup || 0}-${(l.weekNumber || []).join(',')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  const seen = new Set()
  return lessons.filter((l) => {
    const sub = l.numSubgroup || 0
    if (sub !== 0 && sub !== subgroup) return false
    const key = `${l.subject}-${l.startLessonTime}-${l.numSubgroup || 0}-${(l.weekNumber || []).join(',')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sortLessonsByTime(lessons) {
  return [...lessons].sort((a, b) => {
    const at = a.startLessonTime || '99:99'
    const bt = b.startLessonTime || '99:99'
    return at.localeCompare(bt)
  })
}

function timeToMs(time) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime()
}

export function getLessonProgress(start, end) {
  if (!start || !end) return { progress: 0, isNow: false, remaining: '' }
  const now = Date.now()
  const startMs = timeToMs(start)
  const endMs = timeToMs(end)

  if (now < startMs) return { progress: 0, isNow: false, remaining: '' }
  if (now >= endMs) return { progress: 100, isNow: false, remaining: '' }

  const total = endMs - startMs
  const elapsed = now - startMs
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100))
  const remainingMs = endMs - now
  const rMin = Math.floor(remainingMs / 60000)
  const rSec = Math.floor((remainingMs % 60000) / 1000)
  const remaining = `${rMin}:${String(rSec).padStart(2, '0')}`

  return { progress, isNow: true, remaining }
}

export function isLessonNow(start, end) {
  if (!start || !end) return false
  const now = Date.now()
  return now >= timeToMs(start) && now < timeToMs(end)
}

export function getNextLesson(lessons) {
  const now = Date.now()
  for (const l of lessons) {
    if (!l.startLessonTime) continue
    const startMs = timeToMs(l.startLessonTime)
    if (startMs > now) return l
  }
  return null
}

export function isBreakNow() {
  const now = Date.now()
  for (const b of BREAK_TIMES) {
    const startMs = timeToMs(b.start)
    const endMs = timeToMs(b.end)
    if (now >= startMs && now < endMs) return b
  }
  return null
}
