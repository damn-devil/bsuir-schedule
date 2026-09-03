import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { t } from '../lib/i18n.js'

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
      setGroups(s.groups.filter((g) => String(g.name).includes(q) || (g.specialityName || '').toLowerCase().includes(q)))
      setLoading(false)
    }, 150)
  }, [query, s.groups])

  return (
    <div className="screen">
      <header className="screen-header">
        <div><h1>{t('group')}</h1><p className="screen-sub">{t('enterGroup')}</p></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      <div className="search-field glass">
        <Icon name="search" size={16} />
        <input autoFocus placeholder={t('enterGroupPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="search-clear" onClick={() => setQuery('')}><Icon name="x" size={14} /></button>}
      </div>
      <div className="search-results">
        {loading && groups.length === 0 && <div style={{ padding: '40px', textAlign: 'center' }}><Loader /></div>}
        {!loading && groups.length === 0 && query && <div className="empty-state"><p>{t('nothingFound')}</p></div>}
        {groups.map((g) => (
          <button key={g.id || g.name} className="search-item glass" onClick={() => a.previewGroup(g)}>
            <span className="search-item-main"><strong>{g.name}</strong>{g.specialityName && <small>{g.specialityName}</small>}</span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
