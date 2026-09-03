import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { WEEKDAYS, lessonColor, lessonTime, filterBySubgroup } from '../lib/format.js'

export function HomeScreen() {
  const { s, a } = useStore()

  if (!s.group && !s.employee) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>БГУИР</h1><p className="screen-sub">Расписание занятий</p></div>
        </header>
        <div className="home-hero">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-content">
            <div className="hero-icon">📚</div>
            <h2>Добро пожаловать</h2>
            <p>Выберите группу или преподавателя</p>
          </div>
        </div>
        <div className="home-actions">
          <button className="home-action glass" onClick={() => a.setView('search-group')}>
            <span className="home-action-icon" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}><Icon name="users" size={22} /></span>
            <span className="home-action-text"><strong>Поиск группы</strong><small>Расписание группы</small></span>
            <Icon name="chevron-right" size={16} />
          </button>
          <button className="home-action glass" onClick={() => a.setView('search-employee')}>
            <span className="home-action-icon" style={{ background: 'color-mix(in srgb, #34c759 15%, transparent)', color: '#34c759' }}><Icon name="user" size={22} /></span>
            <span className="home-action-text"><strong>Преподаватель</strong><small>Расписание преподавателя</small></span>
            <Icon name="chevron-right" size={16} />
          </button>
          <button className="home-action glass" onClick={() => a.setView('auditories')}>
            <span className="home-action-icon" style={{ background: 'color-mix(in srgb, #ff9500 15%, transparent)', color: '#ff9500' }}><Icon name="map" size={22} /></span>
            <span className="home-action-text"><strong>Аудитории</strong><small>Список аудиторий</small></span>
            <Icon name="chevron-right" size={16} />
          </button>
          <button className="home-action glass" onClick={() => a.setView('faculties')}>
            <span className="home-action-icon" style={{ background: 'color-mix(in srgb, #af52de 15%, transparent)', color: '#af52de' }}><Icon name="book" size={22} /></span>
            <span className="home-action-text"><strong>Факультеты</strong><small>Структура университета</small></span>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (s.loading && !s.schedule) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{s.group ? `Группа ${s.group.studentGroup}` : s.employee?.shortName || 'Загрузка...'}</h1></div>
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
          <div><h1>Ошибка</h1></div>
          <button className="icon-btn" onClick={() => a.clearSchedule()}><Icon name="x" size={18} /></button>
        </header>
        <div className="error-card glass">
          <p>{s.error}</p>
          <button className="btn btn-primary" onClick={() => a.refresh()}>Повторить</button>
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

  const title = s.group ? `Группа ${s.group.studentGroup}` : s.employee?.shortName || 'Преподаватель'
  const subtitle = s.employee?.faculty?.name || ''

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
          <button className="icon-btn" onClick={() => a.refresh()} title="Обновить"><Icon name="refresh" size={18} /></button>
          <button className="icon-btn" onClick={() => a.clearSchedule()} title="Закрыть"><Icon name="x" size={18} /></button>
        </div>
      </header>

      <WeekBar />

      {s.group && (
        <div className="subgroup-bar">
          <span className="subgroup-label">Подгруппа:</span>
          {[0, 1, 2].map((n) => (
            <button key={n} className={`chip ${s.subgroup === n ? 'active' : ''}`} onClick={() => a.setSubgroup(n)}>
              {n === 0 ? 'Все' : n}
            </button>
          ))}
        </div>
      )}

      <div className="schedule-days">
        {dayKeys.length === 0 && examLessons.length === 0 && (
          <div className="empty-state"><div className="empty-art">📅</div><p>Нет занятий</p><span>Расписание на текущую неделю отсутствует</span></div>
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
                <span className="day-date">{d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                {isT && <span className="today-badge">Сегодня</span>}
              </div>
              <div className="day-lessons">
                {lessons.map((l, i) => <LessonCard key={i} lesson={l} />)}
              </div>
            </div>
          )
        })}
      </div>

      {examLessons.length > 0 && (
        <div className="exams-section">
          <h3 className="section-title">Экзамены / Зачёты</h3>
          {examLessons.map((l, i) => <LessonCard key={`exam-${i}`} lesson={l} isExam />)}
        </div>
      )}

      {s.announcements.length > 0 && (
        <div className="announcements-section">
          <h3 className="section-title">Объявления</h3>
          {s.announcements.map((an, i) => (
            <div key={i} className="announcement-card glass">
              <div className="ann-title">{an.title || ''}</div>
              <div className="ann-date">{an.date ? new Date(an.date).toLocaleDateString('ru-RU') : ''}</div>
              <div className="ann-text" dangerouslySetInnerHTML={{ __html: an.body || an.text || '' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({ lesson, isExam }) {
  const color = isExam ? '#ff3b30' : lessonColor(lesson.lessonTypeAbbrev || lesson.lessonType)
  const weeks = lesson.weekNumber || []
  const weekStr = Array.isArray(weeks) && weeks.length ? `нед: ${weeks.join(', ')}` : ''
  const auditories = lesson.auditories || []
  const audStr = auditories.map((a) => a.name || a).filter(Boolean).join(', ')
  const employees = lesson.employees || []
  const empStr = employees.map((e) => e.shortName || e).filter(Boolean).join(', ')
  const numSub = lesson.numSubgroup || 0

  return (
    <div className={`lesson-card glass ${isExam ? 'exam' : ''}`}>
      <div className="lesson-color" style={{ background: color }} />
      <div className="lesson-body">
        <div className="lesson-top">
          <span className="lesson-type" style={{ color }}>{isExam ? 'ЭКЗАМЕН' : lesson.lessonTypeAbbrev || lesson.lessonType || '?'}</span>
          <span className="lesson-time">{lessonTime(lesson.startLessonTime, lesson.endLessonTime)}</span>
        </div>
        <div className="lesson-name">{lesson.subject || lesson.name || '—'}</div>
        {empStr && <div className="lesson-detail"><Icon name="user" size={12} /> {empStr}</div>}
        {audStr && <div className="lesson-detail"><Icon name="map" size={12} /> {audStr}</div>}
        <div className="lesson-footer">
          {weekStr && <span className="lesson-weeks">{weekStr}</span>}
          {numSub > 0 && <span className="lesson-subgroup">подгр. {numSub}</span>}
        </div>
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
        <span>Неделя <strong>{week}</strong> из 4</span>
      </div>
      <div className="week-dots">
        {[1, 2, 3, 4].map((w) => (
          <span key={w} className={`week-dot ${w === week ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
