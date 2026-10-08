import { useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { lessonColor, lessonTypeName } from '../lib/format.js'

function SubjectCard({ subject, lessons }) {
  const color = lessonColor(lessons[0]?.lessonTypeAbbrev || '')
  const allMarks = lessons.flatMap((l) => l.marks || [])
  const totalOmissions = lessons.reduce((s, l) => s + (l.gradebookOmissions || 0), 0)
  const avg = allMarks.length ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1) : null

  return (
    <div className="lesson-card glass">
      <div className="lesson-timer-col">
        <div className="lesson-color" style={{ background: color }} />
      </div>
      <div className="lesson-body">
        <div className="lesson-top">
          <span className="lesson-type" style={{ color }}>
            {lessonTypeName(lessons[0]?.lessonTypeAbbrev || '')}
          </span>
          {avg && <span className="lesson-time" style={{ fontWeight: 800 }}>{avg}</span>}
        </div>
        <div className="lesson-name">{subject}</div>
        <div className="lesson-footer" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
          {allMarks.map((m, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '24px', height: '24px', padding: '0 5px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 800,
              background: m >= 9 ? 'var(--green)' : m >= 7 ? 'var(--accent)' : 'var(--red)',
              color: '#fff',
            }}>{m}</span>
          ))}
          {allMarks.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text2)' }}>нет оценок</span>}
          {totalOmissions > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              height: '24px', padding: '0 8px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 800,
              background: 'var(--red)', color: '#fff',
            }}>
              <Icon name="x" size={10} /> {totalOmissions}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function StudentScreen() {
  const { s, a } = useStore()
  const card = s.studentCard
  const rating = s.studentRating
  const loading = s.studentRatingLoading

  useEffect(() => {
    if (card && !rating && !loading) a.refreshStudentRating()
  }, [card])

  if (!card) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>Студент</h1></div>
        </header>
        <div className="empty-state">
          <Icon name="user" size={40} />
          <p>Введите номер студенческого билета в настройках</p>
          <button className="btn btn-primary" onClick={() => a.setView('more')}>В настройки</button>
        </div>
      </div>
    )
  }

  if (loading || !rating) {
    return (
      <div className="screen">
        <header className="screen-header">
          <div><h1>Студент</h1><p className="screen-sub">№ {card}</p></div>
        </header>
        <div style={{ padding: '40px', textAlign: 'center' }}><Loader /></div>
      </div>
    )
  }

  const lessons = rating.lessons || []
  const grouped = {}
  for (const l of lessons) {
    const key = `${l.lessonNameAbbrev}__${l.lessonTypeAbbrev}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  }

  const allMarks = lessons.flatMap((l) => l.marks || [])
  const totalOmissions = lessons.reduce((s, l) => s + (l.gradebookOmissions || 0), 0)
  const avg = allMarks.length ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(2) : null
  const subjectsCount = Object.keys(grouped).length

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>Студент</h1>
          <p className="screen-sub">№ {card}</p>
        </div>
        <button className="icon-btn" onClick={() => a.refreshStudentRating()}>
          <Icon name="refresh" size={18} />
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <div className="glass" style={{ padding: '12px', textAlign: 'center', borderRadius: '10px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: avg ? 'var(--accent)' : 'var(--text2)' }}>{avg || '—'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase' }}>Средний</div>
        </div>
        <div className="glass" style={{ padding: '12px', textAlign: 'center', borderRadius: '10px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800 }}>{allMarks.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase' }}>Оценок</div>
        </div>
        <div className="glass" style={{ padding: '12px', textAlign: 'center', borderRadius: '10px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: totalOmissions > 0 ? 'var(--red)' : 'var(--text2)' }}>{totalOmissions}</div>
          <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase' }}>Пропусков</div>
        </div>
      </div>

      <div className="schedule-days">
        {subjectsCount === 0 ? (
          <div className="empty-state"><p>Нет данных</p></div>
        ) : (
          Object.entries(grouped).map(([key, group]) => {
            const [name, type] = key.split('__')
            return <SubjectCard key={key} subject={`${name} (${type})`} lessons={group} />
          })
        )}
      </div>
    </div>
  )
}
