import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { lessonColor, lessonTime, lessonTypeName } from '../lib/format.js'
import { t, getLang } from '../lib/i18n.js'

function ExamCard({ exam }) {
  const color = lessonColor(exam.lessonTypeAbbrev || exam.lessonType || 'Экзамен')
  const weeks = exam.weekNumber || []
  const weekStr = Array.isArray(weeks) && weeks.length ? `${t('lessonWeeks')}: ${weeks.join(', ')}` : ''
  const auditories = exam.auditories || []
  const audStr = auditories.map((a) => typeof a === 'string' ? a : a.name || '').filter(Boolean).join(', ')
  const employees = exam.employees || []
  const empStr = employees.map((e) => e.fio || e.shortName || [e.lastName, e.firstName?.[0], e.middleName?.[0]].filter(Boolean).join(' ')).filter(Boolean).join(', ')

  const dateStr = exam.date ? new Date(exam.date).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className="lesson-card glass exam">
      <div className="lesson-timer-col">
        <div className="lesson-color" style={{ background: color }} />
      </div>
      <div className="lesson-body">
        <div className="lesson-top">
          <span className="lesson-type" style={{ color }}>
            {lessonTypeName(exam.lessonTypeAbbrev || exam.lessonType || 'Экзамен')}
          </span>
          {dateStr && <span className="lesson-time">{dateStr}</span>}
        </div>
        <div className="lesson-name">{exam.subject || exam.name || ''}</div>
        {empStr && <div className="lesson-detail"><Icon name="user" size={12} /> {empStr}</div>}
        {audStr && <div className="lesson-detail"><Icon name="map" size={12} /> {audStr}</div>}
        <div className="lesson-footer">
          {weekStr && <span className="lesson-weeks">{weekStr}</span>}
        </div>
      </div>
    </div>
  )
}

export function ExamsScreen() {
  const { s } = useStore()
  const pinned = s.pinned
  const schedule = s.pinnedSchedule

  if (!pinned) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('tabExams')}</h1></div>
        </header>
        <div className="empty-state">
          <p>{t('noPinned')}</p>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>{t('tabExams')}</h1></div>
        </header>
        <div className="empty-state">
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  const exams = schedule.exams || []
  const title = pinned.type === 'group' ? `${t('group')} ${pinned.data.name}` : pinned.data.fio || ''

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>{t('tabExams')}</h1>
          <p className="screen-sub">{title}</p>
        </div>
      </header>

      <div className="schedule-days">
        {exams.length === 0 ? (
          <div className="empty-state">
            <p>{t('noExams')}</p>
          </div>
        ) : (
          exams.map((ex, i) => <ExamCard key={i} exam={ex} />)
        )}
      </div>
    </div>
  )
}
