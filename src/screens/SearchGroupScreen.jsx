import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'

export function SearchGroupScreen() {
  const { s, a } = useStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState([])
  const timer = useRef(null)

  useEffect(() => { setLoading(true); a.loadGroups().finally(() => setLoading(false)) }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setGroups(s.groups); return }
    setLoading(true)
    timer.current = setTimeout(() => {
      const q = query.toLowerCase().trim()
      setGroups(s.groups.filter((g) => String(g.studentGroup).includes(q) || (g.name || '').toLowerCase().includes(q)))
      setLoading(false)
    }, 150)
  }, [query, s.groups])

  return (
    <div className="screen">
      <header className="screen-header">
        <div><h1>Группа</h1><p className="screen-sub">Введите номер группы</p></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      <div className="search-field glass">
        <Icon name="search" size={16} />
        <input autoFocus placeholder="251301, 053503..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="search-clear" onClick={() => setQuery('')}><Icon name="x" size={14} /></button>}
      </div>
      <div className="search-results">
        {loading && groups.length === 0 && <div style={{ padding: '40px', textAlign: 'center' }}><Loader /></div>}
        {!loading && groups.length === 0 && query && <div className="empty-state"><p>Ничего не найдено</p></div>}
        {groups.map((g) => (
          <button key={g.id || g.studentGroup} className="search-item glass" onClick={() => a.selectGroup(g)}>
            <span className="search-item-main"><strong>{g.studentGroup}</strong>{g.name && <small>{g.name}</small>}</span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
