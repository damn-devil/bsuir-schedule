export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const WEEKDAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const LESSON_COLORS = {
  'Лекция': '#34c759',
  'Практическое занятие': '#ff3b30',
  'Лабораторная работа': '#ff9500',
  'Консультация': '#af52de',
  'Экзамен': '#8b5cf6',
  'Зачет': '#8b5cf6',
  'Курсовое проектирование': '#5856d6',
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

export function getLessonTimeRange(start, end) {
  if (!start || !end) return null
  const now = new Date()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startDate = new Date(now)
  startDate.setHours(sh, sm, 0, 0)
  const endDate = new Date(now)
  endDate.setHours(eh, em, 0, 0)
  return { start: startDate, end: endDate }
}

export function getLessonProgress(start, end) {
  if (!start || !end) return { progress: 0, isNow: false, remaining: '' }
  const now = Date.now()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const today = new Date()
  const startMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0, 0).getTime()
  const endMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0, 0).getTime()

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
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const today = new Date()
  const startMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0, 0).getTime()
  const endMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0, 0).getTime()
  return now >= startMs && now < endMs
}
