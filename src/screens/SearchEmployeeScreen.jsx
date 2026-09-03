import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { t } from '../lib/i18n.js'

export function SearchEmployeeScreen() {
  const { s, a } = useStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const timer = useRef(null)

  useEffect(() => { setLoading(true); a.loadEmployees().finally(() => setLoading(false)) }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setEmployees(s.employees); return }
    setLoading(true)
    timer.current = setTimeout(() => {
      const q = query.toLowerCase().trim()
      setEmployees(s.employees.filter((e) => {
        const name = (e.shortName || e.name || '').toLowerCase()
        const dep = (e.department?.name || '').toLowerCase()
        return name.includes(q) || dep.includes(q)
      }))
      setLoading(false)
    }, 150)
  }, [query, s.employees])

  return (
    <div className="screen">
      <header className="screen-header">
        <div><h1>{t('employeeSearch')}</h1><p className="screen-sub">{t('search')}</p></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      <div className="search-field glass">
        <Icon name="search" size={16} />
        <input autoFocus placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="search-clear" onClick={() => setQuery('')}><Icon name="x" size={14} /></button>}
      </div>
      <div className="search-results">
        {loading && employees.length === 0 && <div style={{ padding: '40px', textAlign: 'center' }}><Loader /></div>}
        {!loading && employees.length === 0 && query && <div className="empty-state"><p>{t('nothingFound')}</p></div>}
        {employees.map((e) => (
          <button key={e.id || e.urlId} className="search-item glass" onClick={() => a.selectEmployee(e)}>
            <span className="search-item-main"><strong>{e.shortName || e.name}</strong>{e.department?.name && <small>{e.department.name}</small>}</span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
