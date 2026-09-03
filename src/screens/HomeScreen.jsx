import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { WEEKDAYS, lessonColor, lessonTime, lessonTypeName, filterBySubgroup, sortLessonsByTime, getLessonProgress, isLessonNow, LESSON_SLOTS, BREAK_TIMES } from '../lib/format.js'
import { t, getLang } from '../lib/i18n.js'

function getDayName(date) {
  const d = date.getDay()
  return WEEKDAYS[d === 0 ? 6 : d - 1]
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function lessonMatchesWeek(lesson, weekNums) {
  const weeks = lesson.weekNumber || []
  if (weeks.length === 0) return false
  return weeks.some((w) => weekNums.includes(w))
}

function getLessonNumber(start) {
  for (const s of LESSON_SLOTS) {
    if (s.start === start) return s.num
  }
  return null
}

function buildSchedule(days, subgroup, currentWeek) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result = []

  const bsuirDay = (today.getDay() + 6) % 7
  const mondayOfThisWeek = new Date(today)
  mondayOfThisWeek.setDate(today.getDate() - bsuirDay)

  for (let i = 0; i < 28; i++) {
    const d = new Date(mondayOfThisWeek)
    d.setDate(mondayOfThisWeek.getDate() + i)
    if (d < today) continue
    const dayName = getDayName(d)
    const daysFromMonday = Math.floor((d - mondayOfThisWeek) / 86400000)
    const weeksFromMonday = Math.floor(daysFromMonday / 7)
    const weekNum = ((currentWeek - 1 + weeksFromMonday) % 4) + 1
    const isToday = sameDay(d, today)

    let lessons = filterBySubgroup(days[dayName] || [], subgroup)
    lessons = lessons.filter((l) => lessonMatchesWeek(l, [weekNum]))
    if (lessons.length > 0) {
      result.push({ date: d, dk: dayName, lessons: sortLessonsByTime(lessons), isToday, weekNum })
    }
  }

  return result
}

export function HomeScreen() {
  const { s, a } = useStore()
  const pinned = s.pinned

  if (!pinned) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('tabSchedule')}</h1></div>
        </header>
        <div className="empty-state">
          <p>{t('noPinned')}</p>
          <button className="btn btn-primary" onClick={() => a.setView('search-group')}>
            <Icon name="search" size={16} /> {t('findGroup')}
          </button>
        </div>
      </div>
    )
  }

  if (s.loading && !s.pinnedSchedule) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{pinned.type === 'group' ? `${t('group')} ${pinned.data.name}` : pinned.data.fio || t('loading')}</h1></div>
          <button className="icon-btn" onClick={() => a.unpin()}><Icon name="x" size={18} /></button>
        </header>
        <div className="boot-screen"><Loader /></div>
      </div>
    )
  }

  if (s.error) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('error')}</h1></div>
          <button className="icon-btn" onClick={() => a.unpin()}><Icon name="x" size={18} /></button>
        </header>
        <div className="error-card glass">
          <p>{s.error}</p>
          <button className="btn btn-primary" onClick={() => a.refresh()}>{t('retry')}</button>
        </div>
      </div>
    )
  }

  return <ScheduleView />
}

function ScheduleView() {
  const { s, a } = useStore()
  const [showExamsOnly, setShowExamsOnly] = useState(false)
  const schedule = s.pinnedSchedule
  const pinned = s.pinned
  if (!schedule || !pinned) return null

  const title = pinned.type === 'group' ? `${t('group')} ${pinned.data.name}` : pinned.data.fio || ''
  const subtitle = pinned.type === 'employee' ? (pinned.data.academicDepartment?.[0] || '') : ''
  const days = schedule.schedules || {}
  const currentWeek = s.selectedWeek || s.pinnedWeek || 1
  const examLessons = schedule.exams || []
  const filteredDays = buildSchedule(days, s.subgroup, currentWeek)

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>{title}</h1>
          {subtitle && <p className="screen-sub">{subtitle}</p>}
          {pinned.type === 'group' && (
            <div className="subgroup-bar inline">
              {[0, 1, 2].map((n) => (
                <button key={n} className={`chip ${s.subgroup === n ? 'active' : ''}`} onClick={() => a.setSubgroup(n)}>
                  {n === 0 ? t('all') : n}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => a.refresh()} title={t('refresh')}><Icon name="refresh" size={18} /></button>
          <button className="icon-btn" onClick={() => a.unpin()} title={t('close')}><Icon name="x" size={18} /></button>
        </div>
      </header>

      <WeekBar />

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

          {filteredDays.map(({ date, dk, lessons, isToday, weekNum }) => {
            return (
              <div key={date.toISOString()} className={`day-section ${isToday ? 'today' : ''}`}>
                <div className="day-header">
                  <span className="day-name">{dk}</span>
                  <span className="day-date">{date.toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' })}</span>
                  <span className="day-week-badge">{t('week')} {weekNum}</span>
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

      {pinned.type === 'employee' && s.pinnedAnnouncements?.length > 0 && (
        <div className="announcements-section">
          <h3 className="section-title">{t('announcements')}</h3>
          {s.pinnedAnnouncements.map((an, i) => {
            const dateStr = an.date ? new Date(an.date).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
            const timeStr = an.startTime && an.endTime ? `${an.startTime} – ${an.endTime}` : ''
            const audStr = an.auditory?.name || ''
            return (
              <div key={an.id || i} className="announcement-card glass">
                <div className="ann-header">
                  {dateStr && <span className="ann-date">{dateStr}</span>}
                  {timeStr && <span className="ann-time">{timeStr}</span>}
                  {audStr && <span className="ann-aud">{audStr}</span>}
                </div>
                <div className="ann-text">{an.content || ''}</div>
              </div>
            )
          })}
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
            {isExam ? 'Экзамен' : lessonTypeName(lesson.lessonTypeAbbrev || lesson.lessonType)}
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

function WeekBar() {
  const { s, a } = useStore()
  const week = s.selectedWeek || s.pinnedWeek || 1
  return (
    <div className="week-bar glass">
      <div className="week-info">
        <Icon name="calendar" size={16} />
        <span>{t('week')} <strong>{week}</strong> {t('weekOf')} 4</span>
      </div>
      <div className="week-dots">
        {[1, 2, 3, 4].map((w) => (
          <button key={w} className={`week-dot ${w === week ? 'active' : ''}`} onClick={() => a.setSelectedWeek(w)} />
        ))}
      </div>
    </div>
  )
}
