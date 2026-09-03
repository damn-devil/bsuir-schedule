export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const LESSON_COLORS = {
  'Лекция': '#007aff',
  'Практическое занятие': '#34c759',
  'Лабораторная работа': '#ff9500',
  'Консультация': '#af52de',
  'Экзамен': '#ff3b30',
  'Зачет': '#ff2d55',
  'Курсовое проектирование': '#5856d6',
  'Дифференцированный зачет': '#ff6482',
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
  if (!subgroup || subgroup === 0) return lessons
  return lessons.filter((l) => !l.numSubgroup || l.numSubgroup === 0 || l.numSubgroup === subgroup)
}
