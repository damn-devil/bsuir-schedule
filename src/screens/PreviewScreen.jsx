import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { api } from '../api.js'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { WEEKDAYS, lessonColor, lessonTime, filterBySubgroup, sortLessonsByTime, getLessonProgress, isLessonNow, LESSON_SLOTS, BREAK_TIMES } from '../lib/format.js'
import { t, getLang } from '../lib/i18n.js'

const DAY_ORDER = { 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5, 'Суббота': 6, 'Воскресенье': 0 }

function getTodayDow() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

function getDateForDay(dayKey, weekOffset) {
  const dow = DAY_ORDER[dayKey]
  if (!dow) return null
  const today = new Date()
  const todayDow = today.getDay() || 7
  let diff = dow - todayDow
  if (weekOffset) diff += 7 * weekOffset
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d
}

function timeToMs(time) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime()
}

function isLessonEndedToday(start, end) {
  if (!start || !end) return false
  return Date.now() >= timeToMs(end)
}

function lessonMatchesWeek(lesson, weekNums) {
  const weeks = lesson.weekNumber || []
  if (weeks.length === 0) return true
  return weeks.some((w) => weekNums.includes(w))
}

function getLessonNumber(start) {
  for (const s of LESSON_SLOTS) {
    if (s.start === start) return s.num
  }
  return null
}

function buildSchedule(days, subgroup, currentWeek) {
  const todayDow = getTodayDow()
  const nextWeek = currentWeek < 4 ? currentWeek + 1 : 1
  const thisWeekNums = [currentWeek]
  const nextWeekNums = [nextWeek]

  const thisWeek = []
  const nextWeekDays = []

  Object.keys(days).forEach((dk) => {
    const dow = DAY_ORDER[dk] ?? 99
    const isToday = dow === todayDow
    const isPast = dow < todayDow
    const isFuture = dow > todayDow

    let lessons = filterBySubgroup(days[dk] || [], subgroup)

    if (isToday) {
      lessons = lessons.filter((l) => lessonMatchesWeek(l, thisWeekNums))
      lessons = lessons.filter((l) => !isLessonEndedToday(l.startLessonTime, l.endLessonTime))
      if (lessons.length > 0) thisWeek.push({ dk, lessons: sortLessonsByTime(lessons), isToday: true, weekOffset: 0 })
    } else if (isFuture) {
      lessons = lessons.filter((l) => lessonMatchesWeek(l, thisWeekNums))
      if (lessons.length > 0) thisWeek.push({ dk, lessons: sortLessonsByTime(lessons), isToday: false, weekOffset: 0 })
    } else {
      lessons = lessons.filter((l) => lessonMatchesWeek(l, nextWeekNums))
      if (lessons.length > 0) nextWeekDays.push({ dk, lessons: sortLessonsByTime(lessons), isToday: false, weekOffset: 1 })
    }
  })

  thisWeek.sort((a, b) => (DAY_ORDER[a.dk] ?? 99) - (DAY_ORDER[b.dk] ?? 99))
  nextWeekDays.sort((a, b) => (DAY_ORDER[a.dk] ?? 99) - (DAY_ORDER[b.dk] ?? 99))

  return [...thisWeek, ...nextWeekDays]
}

export function PreviewScreen() {
  const { s, a } = useStore()
  const preview = s.preview
  const [localSchedule, setLocalSchedule] = useState(null)
  const [localWeek, setLocalWeek] = useState(null)
  const [localLoading, setLocalLoading] = useState(true)
  const [localError, setLocalError] = useState(null)
  const [localAnnouncements, setLocalAnnouncements] = useState([])
  const [showExamsOnly, setShowExamsOnly] = useState(false)

  useEffect(() => {
    if (!preview) return
    let cancelled = false
    setLocalLoading(true)
    setLocalError(null)
    setLocalSchedule(null)

    const id = preview.type === 'group' ? preview.data.name : preview.data.urlId
    const fetcher = preview.type === 'group' ? api.scheduleGroup(id) : api.scheduleEmployee(id)

    Promise.all([fetcher, api.currentWeek().catch(() => null)])
      .then(([sched, week]) => {
        if (cancelled) return
        setLocalSchedule(sched)
        if (week !== null) setLocalWeek(Number(week) || 1)
        setLocalLoading(false)
        if (preview.type === 'employee') {
          api.announcementsEmployee(id).then((a) => { if (!cancelled) setLocalAnnouncements(a || []) }).catch(() => {})
        }
      })
      .catch((e) => {
        if (cancelled) return
        setLocalError(e.message || 'Ошибка загрузки')
        setLocalLoading(false)
      })

    return () => { cancelled = true }
  }, [preview?.type, preview?.data?.name, preview?.data?.urlId])

  if (!preview) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('preview')}</h1></div>
          <button className="icon-btn" onClick={() => a.setView('search-group')}><Icon name="arrow-left" size={18} /></button>
        </header>
        <div className="empty-state"><p>{t('nothingFound')}</p></div>
      </div>
    )
  }

  if (localLoading) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div>
            <h1>{preview.type === 'group' ? `${t('group')} ${preview.data.name}` : preview.data.fio || t('loading')}</h1>
            {preview.type === 'employee' && preview.data.academicDepartment?.[0] && (
              <p className="screen-sub">{preview.data.academicDepartment[0]}</p>
            )}
          </div>
          <button className="icon-btn" onClick={() => a.setView('search-group')}><Icon name="arrow-left" size={18} /></button>
        </header>
        <div className="boot-screen"><Loader /></div>
      </div>
    )
  }

  if (localError) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('error')}</h1></div>
          <button className="icon-btn" onClick={() => a.setView('search-group')}><Icon name="arrow-left" size={18} /></button>
        </header>
        <div className="error-card glass">
          <p>{localError}</p>
          <button className="btn btn-primary" onClick={() => {
            setLocalLoading(true)
            setLocalError(null)
            const id = preview.type === 'group' ? preview.data.name : preview.data.urlId
            const fetcher = preview.type === 'group' ? api.scheduleGroup(id) : api.scheduleEmployee(id)
            fetcher.then((sched) => { setLocalSchedule(sched); setLocalLoading(false) }).catch((e) => { setLocalError(e.message); setLocalLoading(false) })
          }}>{t('retry')}</button>
        </div>
      </div>
    )
  }

  const schedule = localSchedule
  if (!schedule) return null

  const title = preview.type === 'group' ? `${t('group')} ${preview.data.name}` : preview.data.fio || ''
  const subtitle = preview.type === 'employee' ? (preview.data.academicDepartment?.[0] || '') : ''
  const days = schedule.schedules || {}
  const currentWeek = localWeek || 1
  const examLessons = schedule.exams || []
  const filteredDays = buildSchedule(days, s.subgroup, currentWeek)

  const thisWeekDays = filteredDays.filter((d) => d.weekOffset === 0)
  const nextWeekDays = filteredDays.filter((d) => d.weekOffset === 1)

  const isPinned = s.pinned &&
    ((preview.type === 'group' && s.pinned.type === 'group' && s.pinned.data.name === preview.data.name) ||
     (preview.type === 'employee' && s.pinned.type === 'employee' && s.pinned.data.urlId === preview.data.urlId))

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>{title}</h1>
          {subtitle && <p className="screen-sub">{subtitle}</p>}
        </div>
        <button className="icon-btn" onClick={() => a.setView('search-group')}><Icon name="arrow-left" size={18} /></button>
      </header>

      <div className="preview-bar">
        {isPinned ? (
          <button className="btn btn-primary" disabled>
            <Icon name="check" size={16} /> {t('pinned')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => {
            a.pinPreviewTo(localSchedule, localWeek, preview, localAnnouncements)
          }}>
            <Icon name="pin" size={16} /> {t('pinSchedule')}
          </button>
        )}
      </div>

      {preview.type === 'group' && (
        <div className="subgroup-bar">
          <span className="subgroup-label">{t('subgroup')}:</span>
          {[0, 1, 2].map((n) => (
            <button key={n} className={`chip ${s.subgroup === n ? 'active' : ''}`} onClick={() => a.setSubgroup(n)}>
              {n === 0 ? t('all') : n}
            </button>
          ))}
        </div>
      )}

      {examLessons.length > 0 && (
        <div className="subgroup-bar">
          <button className={`chip ${!showExamsOnly ? 'active' : ''}`} onClick={() => setShowExamsOnly(false)}>{t('tabSchedule')}</button>
          <button className={`chip ${showExamsOnly ? 'active' : ''}`} onClick={() => setShowExamsOnly(true)}>{t('exams')} ({examLessons.length})</button>
        </div>
      )}

      {!showExamsOnly && (
        <div className="schedule-days">
          {filteredDays.length === 0 && (
            <div className="empty-state"><p>{t('noLessons')}</p><span>{t('noLessonsDesc')}</span></div>
          )}

          {thisWeekDays.length > 0 && thisWeekDays.map(({ dk, lessons, isToday }) => {
            const dd = getDateForDay(dk, 0)
            return (
              <div key={dk} className={`day-section ${isToday ? 'today' : ''}`}>
                <div className="day-header">
                  <span className="day-name">{dk}</span>
                  {dd && <span className="day-date">{dd.toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' })}</span>}
                  {isToday && <span className="today-badge">{t('today')}</span>}
                </div>
                <div className="day-lessons">
                  {lessons.map((l, i) => {
                    const num = getLessonNumber(l.startLessonTime)
                    return (
                      <div key={i}>
                        <LessonCard lesson={l} isToday={isToday} />
                        {num && num < 7 && lessons[i + 1] && <BreakIndicator after={num} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {nextWeekDays.length > 0 && (
            <div className="week-divider">
              <span className="week-divider-line" />
              <span className="week-divider-text">{t('nextWeek')}</span>
              <span className="week-divider-line" />
            </div>
          )}

          {nextWeekDays.map(({ dk, lessons }) => {
            const dd = getDateForDay(dk, 1)
            return (
              <div key={`nw-${dk}`} className="day-section">
                <div className="day-header">
                  <span className="day-name">{dk}</span>
                  {dd && <span className="day-date">{dd.toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' })}</span>}
                </div>
                <div className="day-lessons">
                  {lessons.map((l, i) => {
                    const num = getLessonNumber(l.startLessonTime)
                    return (
                      <div key={i}>
                        <LessonCard lesson={l} isToday={false} />
                        {num && num < 7 && lessons[i + 1] && <BreakIndicator after={num} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showExamsOnly && (
        <div className="schedule-days">
          {examLessons.length === 0 ? (
            <div className="empty-state"><p>{t('noExams')}</p></div>
          ) : (
            examLessons.map((l, i) => <LessonCard key={`exam-${i}`} lesson={l} isExam />)
          )}
        </div>
      )}

      {preview.type === 'employee' && localAnnouncements?.length > 0 && (
        <div className="announcements-section">
          <h3 className="section-title">{t('announcements')}</h3>
          {localAnnouncements.map((an, i) => (
            <div key={i} className="announcement-card glass">
              <div className="ann-title">{an.title || ''}</div>
              <div className="ann-date">{an.date ? new Date(an.date).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU') : ''}</div>
              <div className="ann-text" dangerouslySetInnerHTML={{ __html: an.body || an.text || '' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({ lesson, isExam, isToday }) {
  const [, setTick] = useState(0)
  const color = isExam ? '#8b5cf6' : lessonColor(lesson.lessonTypeAbbrev || lesson.lessonType)
  const weeks = lesson.weekNumber || []
  const weekStr = Array.isArray(weeks) && weeks.length ? `${t('lessonWeeks')}: ${weeks.join(', ')}` : ''
  const auditories = lesson.auditories || []
  const audStr = auditories.map((a) => typeof a === 'string' ? a : a.name || '').filter(Boolean).join(', ')
  const employees = lesson.employees || []
  const empStr = employees.map((e) => e.fio || e.shortName || [e.lastName, e.firstName?.[0], e.middleName?.[0]].filter(Boolean).join(' ')).filter(Boolean).join(', ')
  const numSub = lesson.numSubgroup || 0
  const lessonNum = getLessonNumber(lesson.startLessonTime)

  const timer = isToday ? getLessonProgress(lesson.startLessonTime, lesson.endLessonTime) : { progress: 0, isNow: false, remaining: '' }
  const nowActive = isToday && isLessonNow(lesson.startLessonTime, lesson.endLessonTime)

  useEffect(() => {
    if (!nowActive) return
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(iv)
  }, [nowActive])

  return (
    <div className={`lesson-card glass ${isExam ? 'exam' : ''} ${nowActive ? 'is-now' : ''}`}>
      <div className="lesson-timer-col">
        <div className="lesson-color" style={{ background: color }} />
        <div className="lesson-timer-track">
          {isToday && <div className="lesson-timer-fill" style={{ height: `${timer.progress}%`, background: color }} />}
        </div>
      </div>
      <div className="lesson-body">
        <div className="lesson-top">
          <span className="lesson-type" style={{ color }}>
            {lessonNum && <span className="lesson-num">{lessonNum}</span>}
            {isExam ? 'EXAM' : lesson.lessonTypeAbbrev || lesson.lessonType || '?'}
          </span>
          <span className="lesson-time">{lessonTime(lesson.startLessonTime, lesson.endLessonTime)}</span>
        </div>
        <div className="lesson-name">{lesson.subject || lesson.name || ''}</div>
        {empStr && <div className="lesson-detail"><Icon name="user" size={12} /> {empStr}</div>}
        {audStr && <div className="lesson-detail"><Icon name="map" size={12} /> {audStr}</div>}
        <div className="lesson-footer">
          {weekStr && <span className="lesson-weeks">{weekStr}</span>}
          {numSub > 0 && <span className="lesson-subgroup">{t('subgroupShort')} {numSub}</span>}
        </div>
        {isToday && nowActive && timer.isNow && (
          <div className="lesson-countdown" style={{ color }}>
            <Icon name="clock" size={12} />
            <span>{timer.remaining}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function BreakIndicator({ after }) {
  const brk = BREAK_TIMES.find((b) => b.after === after)
  if (!brk) return null
  return (
    <div className="break-indicator">
      <span className="break-line" />
      <span className="break-text">{brk.minutes} {t('breakMin')}</span>
      <span className="break-line" />
    </div>
  )
}
