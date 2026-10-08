import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { isNotificationsSupported, getPermission } from '../lib/notifications.js'
import { t, getLang, setLang, langs } from '../lib/i18n.js'

export function MoreScreen() {
  const { s, a } = useStore()
  const [cardInput, setCardInput] = useState('')
  const [searching, setSearching] = useState(false)

  const handleLogin = async () => {
    if (!cardInput.trim()) return
    setSearching(true)
    await a.login(cardInput.trim())
    setSearching(false)
  }

  return (
    <div className="screen">
      <header className="screen-header"><div><h1>{t('tabMore')}</h1></div></header>

      <div className="settings-section">
        <h3 className="section-title">{t('studentProfile')}</h3>
        {s.studentCard ? (
          <div className="glass" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Icon name="user" size={20} />
              <div>
                <strong style={{ display: 'block' }}>№ {s.studentCard}</strong>
                <small style={{ color: 'var(--text2)' }}>{s.studentRating?.lessons?.length || 0} {t('records')}</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => a.setView('student')}>{t('openGrades')}</button>
              <button className="btn btn-danger-soft btn-sm" onClick={() => a.logoutStudent()}>{t('logout')}</button>
            </div>
          </div>
        ) : (
          <div className="glass" style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
              {t('enterCardHint')}
            </p>
            <input
              type="text"
              placeholder="15350060"
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '13px 16px', borderRadius: '999px', background: 'var(--surface)', color: 'var(--text)', fontSize: '15px', fontWeight: 700, boxSizing: 'border-box', textAlign: 'center' }}
            />
            {s.searchingGroup && (
              <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px', fontWeight: 700 }}>
                {t('searchingGroup')} {s.searchProgress ? `${s.searchProgress.done}/${s.searchProgress.total}` : '...'}
              </p>
            )}
            <button className="btn btn-primary btn-block" style={{ marginTop: '8px' }} disabled={searching || s.searchingGroup} onClick={handleLogin}>
              {s.searchingGroup ? '...' : t('login')}
            </button>
          </div>
        )}

        {s.foundGroups && s.foundGroups.length > 1 && (
          <div className="glass" style={{ padding: '12px', marginTop: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>{t('selectGroup')}:</p>
            {s.foundGroups.map((g) => (
              <button key={g.name} className="search-item" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }} onClick={() => a.selectFoundGroup(g)}>
                <span className="search-item-main">
                  <strong>{g.name}</strong>
                  <small>{g.specialityName}</small>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)' }}>{Math.round(g.matchPct * 100)}%</span>
              </button>
            ))}
            <button className="btn btn-danger-soft btn-sm" style={{ width: '100%', marginTop: '4px' }} onClick={() => a.dismissFoundGroups()}>{t('close')}</button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('tabGroups')}</h3>
        <button className="btn btn-block" onClick={() => a.setView('search-group')}>
          <Icon name="users" size={16} /> {t('findGroup')}
        </button>
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('tabEmployees')}</h3>
        <button className="btn btn-block" onClick={() => a.setView('search-employee')}>
          <Icon name="user" size={16} /> {t('findEmployee')}
        </button>
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('language')}</h3>
        <div className="theme-options">
          {langs().map((l) => (
            <button key={l.id} className={`theme-btn glass ${getLang() === l.id ? 'active' : ''}`} onClick={() => { setLang(l.id); window.location.reload() }}>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('theme')}</h3>
        <div className="theme-options">
          {[{ id: 'auto', label: t('auto'), icon: 'sun' }, { id: 'light', label: t('light'), icon: 'sun' }, { id: 'dark', label: t('dark'), icon: 'moon' }].map((th) => (
            <button key={th.id} className={`theme-btn glass ${s.theme === th.id ? 'active' : ''}`} onClick={() => a.setTheme(th.id)}>
              <Icon name={th.icon} size={18} /><span>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('notifications')}</h3>
        <div className="notif-setting glass">
          <div className="notif-info">
            <Icon name="bell" size={18} />
            <span>{getPermission() === 'granted' ? t('notifOn') : t('notifOff')}</span>
          </div>
          {isNotificationsSupported() && getPermission() !== 'granted' && (
            <button className="btn btn-primary btn-sm" onClick={() => a.enableNotifications()}>{t('enable')}</button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('currentGroup')}</h3>
        {s.pinned ? (
          <div className="current-group glass">
            <div>
              <strong>{s.pinned.type === 'group' ? s.pinned.data.name : s.pinned.data.fio}</strong>
              {s.pinned.type === 'group' && s.pinned.data.specialityName && <small style={{ display: 'block', color: 'var(--text2)', fontSize: '13px' }}>{s.pinned.data.specialityName}</small>}
              {s.pinned.type === 'employee' && s.pinned.data.academicDepartment?.[0] && <small style={{ display: 'block', color: 'var(--text2)', fontSize: '13px' }}>{s.pinned.data.academicDepartment[0]}</small>}
            </div>
            <button className="btn btn-danger-soft btn-sm" onClick={() => { a.unpin(); a.setView('search-group') }}>{t('change')}</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => a.setView('search-group')}>{t('selectGroup')}</button>
        )}
      </div>

      <div className="settings-section">
        <h3 className="section-title">{t('about')}</h3>
        <div className="about-card glass">
          <p><strong>БГУИР Расписание</strong> v2.0</p>
          <small>iis.bsuir.by/api/v1</small><br />
          <small>{t('pwaOffline')}</small>
        </div>
      </div>
    </div>
  )
}
