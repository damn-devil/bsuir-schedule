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

function timeToMs(time) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime()
}

export function scheduleLessonNotifications(lessons) {
  if (!lessons || !lessons.length) return
  clearAllScheduled()

  lessons.forEach((l) => {
    if (!l.startLessonTime || !l.endLessonTime) return
    const subject = l.subject || 'Занятие'
    const startMs = timeToMs(l.startLessonTime)
    const endMs = timeToMs(l.endLessonTime)
    const tag = `lesson-${l.subject}-${l.startLessonTime}`

    scheduleAt(startMs - 5 * 60000, subject, `Начало через 5 мин`, `${tag}-5min`)
    scheduleAt(startMs, subject, `Пара началась`, `${tag}-start`)
    scheduleAt(endMs, subject, `Пара закончилась`, `${tag}-end`)
  })

  const now = Date.now()
  let nextLesson = null
  for (const l of lessons) {
    if (!l.startLessonTime) continue
    const s = timeToMs(l.startLessonTime)
    if (s > now) { nextLesson = l; break }
  }
  if (nextLesson) {
    const ms = timeToMs(nextLesson.startLessonTime) - 15 * 60000
    if (ms > now) {
      scheduleAt(ms, nextLesson.subject || 'Занятие', `Следующая пара через 15 мин`, `next-15min`)
    }
  }
}

const timers = []

function scheduleAt(ms, title, body, tag) {
  const delay = ms - Date.now()
  if (delay <= 0 || delay > 7 * 24 * 3600 * 1000) return
  const id = setTimeout(() => notify(title, body, tag), delay)
  timers.push(id)
}

function clearAllScheduled() {
  timers.forEach(clearTimeout)
  timers.length = 0
}
