import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { Loader } from '../components/Loader.jsx'
import { t } from '../lib/i18n.js'

export function FacultiesScreen() {
  const { a } = useStore()
  const [loading, setLoading] = useState(true)
  const [faculties, setFaculties] = useState([])

  useEffect(() => {
    a.loadFaculties().finally(() => setLoading(false))
  }, [])

  return (
    <div className="screen">
      <header className="screen-header">
        <div><h1>{t('faculties')}</h1></div>
        <button className="icon-btn" onClick={() => a.setView('home')}><Icon name="arrow-left" size={18} /></button>
      </header>
      {loading ? <div style={{ padding: '60px', textAlign: 'center' }}><Loader /></div> : (
        <div className="faculties-list">
          {faculties.map((f) => (
            <div key={f.id} className="faculty-card glass">
              <div className="faculty-name">{f.name}</div>
              {f.abbrev && <div className="faculty-abbrev">{f.abbrev}</div>}
            </div>
          ))}
          {faculties.length === 0 && <div className="empty-state"><p>{t('nothingFound')}</p></div>}
        </div>
      )}
    </div>
  )
}
