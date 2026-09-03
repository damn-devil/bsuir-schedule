import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { WEEKDAYS, lessonColor, lessonTime, filterBySubgroup, getLessonProgress, isLessonNow } from '../lib/format.js'
import { t, getLang } from '../lib/i18n.js'

export function HomeScreen() {
  const { s, a } = useStore()

  if (!s.group && !s.employee) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('tabSchedule')}</h1></div>
        </header>
        {s.loading ? (
          <div className="boot-screen"><Loader /></div>
        ) : s.error ? (
          <div className="error-card glass">
            <p>{s.error}</p>
            <button className="btn btn-primary" onClick={() => a.refresh()}>{t('retry')}</button>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('selectGroupOrEmployee')}</p>
          </div>
        )}
      </div>
    )
  }

  if (s.loading && !s.schedule) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{s.group ? `${t('group')} ${s.group.name}` : s.employee?.fio || t('loading')}</h1></div>
          <button className="icon-btn" onClick={() => a.clearSchedule()}><Icon name="x" size={18} /></button>
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
          <button className="icon-btn" onClick={() => a.clearSchedule()}><Icon name="x" size={18} /></button>
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
  const schedule = s.schedule
  if (!schedule) return null

  const title = s.group ? `${t('group')} ${s.group.name}` : s.employee?.fio || ''
  const subtitle = s.employee?.academicDepartment?.[0] || ''

  const days = schedule.schedules || {}
  const dayKeys = Object.keys(days).sort((a, b) => new Date(a) - new Date(b))

  const examLessons = schedule.exams || []

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>{title}</h1>
          {subtitle && <p className="screen-sub">{subtitle}</p>}
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => a.refresh()} title={t('refresh')}><Icon name="refresh" size={18} /></button>
          <button className="icon-btn" onClick={() => a.clearSchedule()} title={t('close')}><Icon name="x" size={18} /></button>
        </div>
      </header>

      <WeekBar />

      {s.group && (
        <div className="subgroup-bar">
          <span className="subgroup-label">{t('subgroup')}:</span>
          {[0, 1, 2].map((n) => (
            <button key={n} className={`chip ${s.subgroup === n ? 'active' : ''}`} onClick={() => a.setSubgroup(n)}>
              {n === 0 ? t('all') : n}
            </button>
          ))}
        </div>
      )}

      <div className="schedule-days">
        {dayKeys.length === 0 && examLessons.length === 0 && (
          <div className="empty-state"><p>{t('noLessons')}</p><span>{t('noLessonsDesc')}</span></div>
        )}
        {dayKeys.map((dk) => {
          const lessons = filterBySubgroup(days[dk] || [], s.subgroup)
          if (lessons.length === 0) return null
          const d = new Date(dk)
          const wd = d.getDay()
          const isT = new Date().toDateString() === d.toDateString()
          return (
            <div key={dk} className={`day-section ${isT ? 'today' : ''}`}>
              <div className="day-header">
                <span className="day-name">{WEEKDAYS[(wd + 6) % 7]}</span>
                <span className="day-date">{d.toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' })}</span>
                {isT && <span className="today-badge">{t('today')}</span>}
              </div>
              <div className="day-lessons">
                {lessons.map((l, i) => <LessonCard key={i} lesson={l} isToday={isT} />)}
              </div>
            </div>
          )
        })}
      </div>

      {examLessons.length > 0 && (
        <div className="exams-section">
          <h3 className="section-title">{t('exams')}</h3>
          {examLessons.map((l, i) => <LessonCard key={`exam-${i}`} lesson={l} isExam />)}
        </div>
      )}

      {s.announcements.length > 0 && (
        <div className="announcements-section">
          <h3 className="section-title">{t('announcements')}</h3>
          {s.announcements.map((an, i) => (
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
        {nowActive && (
          <div className="lesson-timer-bar" style={{ background: `${color}22` }}>
            <div className="lesson-timer-fill" style={{ height: `${timer.progress}%`, background: color }} />
          </div>
        )}
      </div>
      <div className="lesson-body">
        <div className="lesson-top">
          <span className="lesson-type" style={{ color }}>{isExam ? 'EXAM' : lesson.lessonTypeAbbrev || lesson.lessonType || '?'}</span>
          <span className="lesson-time">{lessonTime(lesson.startLessonTime, lesson.endLessonTime)}</span>
        </div>
        <div className="lesson-name">{lesson.subject || lesson.name || ''}</div>
        {empStr && <div className="lesson-detail"><Icon name="user" size={12} /> {empStr}</div>}
        {audStr && <div className="lesson-detail"><Icon name="map" size={12} /> {audStr}</div>}
        <div className="lesson-footer">
          {weekStr && <span className="lesson-weeks">{weekStr}</span>}
          {numSub > 0 && <span className="lesson-subgroup">{t('subgroupShort')} {numSub}</span>}
        </div>
        {nowActive && timer.isNow && (
          <div className="lesson-countdown" style={{ color }}>
            <Icon name="clock" size={12} />
            <span>{timer.remaining}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function WeekBar() {
  const { s } = useStore()
  const week = s.currentWeek || 1
  return (
    <div className="week-bar glass">
      <div className="week-info">
        <Icon name="calendar" size={16} />
        <span>{t('week')} <strong>{week}</strong> {t('weekOf')} 4</span>
      </div>
      <div className="week-dots">
        {[1, 2, 3, 4].map((w) => (
          <span key={w} className={`week-dot ${w === week ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
