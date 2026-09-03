import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'

export function AuditoriesScreen() {
  const { s, a } = useStore()
  const [loading, setLoading] = useState(true)
  const [auditories, setAuditories] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    a.loadAuditories().finally(() => setLoading(false))
  }, [])

  const filtered = auditories.filter((x) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (x.name || '').toLowerCase().includes(q) || String(x.buildingNumber || '').includes(q)
  })

  const grouped = {}
  filtered.forEach((x) => {
    const b = x.buildingNumber || '?'
    if (!grouped[b]) grouped[b] = []
    grouped[b].push(x)
  })

  return (
    <div className="screen">
      <header className="screen-header">
        <div><h1>Аудитории</h1><p className="screen-sub">{auditories.length} аудиторий</p></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      <div className="search-field glass">
        <Icon name="search" size={16} />
        <input placeholder="Поиск аудитории" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="search-clear" onClick={() => setQuery('')}><Icon name="x" size={14} /></button>}
      </div>
      {loading ? <div style={{ padding: '60px', textAlign: 'center' }}><Loader /></div> : (
        <div className="auditories-list">
          {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((build) => (
            <div key={build}>
              <h3 className="section-title">Корпус {build}</h3>
              {grouped[build].map((x) => (
                <div key={x.id || x.name} className="auditory-item glass">
                  <span className="auditory-name">{x.name}</span>
                  {x.auditoryType?.name && <span className="auditory-type">{x.auditoryType.name}</span>}
                  {x.capacity && <span className="auditory-cap">{x.capacity} мест</span>}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && <div className="empty-state"><p>Ничего не найдено</p></div>}
        </div>
      )}
    </div>
  )
}
