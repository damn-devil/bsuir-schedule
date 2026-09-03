let reg = null

export async function initNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
  try {
    reg = await navigator.serviceWorker.ready
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  } catch { return false }
}

export function isNotificationsSupported() {
  return 'serviceWorker' in navigator && 'Notification' in window
}

export function getPermission() {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

function notify(title, body, tag) {
  if (Notification.permission !== 'granted') return
  if (reg) {
    reg.showNotification(title, { body, tag, icon: './icons/icon-192.png', badge: './icons/icon-192.png', silent: false })
  } else {
    new Notification(title, { body, icon: './icons/icon-192.png' })
  }
}

export function scheduleLessonNotifications(lessons) {
  if (!lessons || !lessons.length) return
  const now = Date.now()
  const today = new Date()
  const dow = today.getDay()

  lessons.forEach((l) => {
    if (!l.startLessonTime || !l.endLessonTime) return
    const [sh, sm] = l.startLessonTime.split(':').map(Number)
    const [eh, em] = l.endLessonTime.split(':').map(Number)

    const lessonDay = getLessonDay(l, dow)
    if (lessonDay === null) return

    const startMs = lessonDay.setHours(sh, sm, 0, 0)
    const endMs = lessonDay.setHours(eh, em, 0, 0)

    scheduleAt(startMs - 5 * 60000, `${l.subject || 'Занятие'}`, 'Начало через 5 минут', `lesson-start-${l.id || l.subject}-${startMs}`)
    scheduleAt(startMs, `${l.subject || 'Занятие'}`, 'Занятие началось', `lesson-begins-${l.id || l.subject}-${startMs}`)
    scheduleAt(endMs, `${l.subject || 'Занятие'}`, 'Занятие закончилось', `lesson-ends-${l.id || l.subject}-${endMs}`)
  })
}

function getLessonDay(lesson, currentDow) {
  const weeks = lesson.weekNumber || []
  const dayName = (lesson.dayOfWeek || '').toLowerCase()
  const dayMap = { 'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4, 'пятница': 5, 'суббота': 6 }
  const targetDow = dayMap[dayName]
  if (!targetDow) return null

  const now = new Date()
  const result = new Date(now)
  const diff = targetDow - currentDow
  result.setDate(now.getDate() + (diff >= 0 ? diff : diff + 7))
  return result
}

function scheduleAt(ms, title, body, tag) {
  const delay = ms - Date.now()
  if (delay <= 0 || delay > 7 * 24 * 3600 * 1000) return
  setTimeout(() => notify(title, body, tag), delay)
}
