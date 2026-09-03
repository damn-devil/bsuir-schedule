import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { t } from '../lib/i18n.js'

export function AuditoriesScreen() {
  const { s, a } = useStore()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    a.loadAuditories().finally(() => setLoading(false))
  }, [])

  const allAud = s.auditories || []
  const filtered = allAud.filter((x) => {
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
        <div><h1>{t('auditories')}</h1><p className="screen-sub">{allAud.length}</p></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      <div className="search-field glass">
        <Icon name="search" size={16} />
        <input placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="search-clear" onClick={() => setQuery('')}><Icon name="x" size={14} /></button>}
      </div>
      {loading ? <div style={{ padding: '60px', textAlign: 'center' }}><Loader /></div> : (
        <div className="auditories-list">
          {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((build) => (
            <div key={build}>
              <h3 className="section-title">{build}</h3>
              {grouped[build].map((x) => (
                <div key={x.id || x.name} className="auditory-item glass">
                  <span className="auditory-name">{x.name}</span>
                  {x.auditoryType?.name && <span className="auditory-type">{x.auditoryType.name}</span>}
                  {x.capacity && <span className="auditory-cap">{x.capacity}</span>}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && <div className="empty-state"><p>{t('nothingFound')}</p></div>}
        </div>
      )}
    </div>
  )
}
