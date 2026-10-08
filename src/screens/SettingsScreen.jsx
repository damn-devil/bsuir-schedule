import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { isNotificationsSupported, getPermission, initNotifications } from '../lib/notifications.js'
import { t, getLang, setLang, langs } from '../lib/i18n.js'

export function SettingsScreen() {
  const { s, a } = useStore()

  return (
    <div className="screen">
      <header className="screen-header"><div><h1>{t('settings')}</h1></div></header>

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
        <h3 className="section-title">{t('accent')}</h3>
        <div className="accent-options">
          {['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5856d6', '#ff2d55', '#00c7be'].map((c) => (
            <button key={c} className={`accent-dot ${s.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => a.setAccent(c)} />
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
          <p><strong>БГУИР Расписание</strong> v1.0</p>
          <small>iis.bsuir.by/api/v1</small><br />
          <small>{t('pwaOffline')}</small>
        </div>
      </div>

      {s.studentCard ? (
        <div className="settings-section">
          <h3 className="section-title">Профиль студента</h3>
          <div className="glass" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Icon name="book" size={20} />
              <div>
                <strong style={{ display: 'block' }}>№ {s.studentCard}</strong>
                <small style={{ color: 'var(--text2)' }}>{s.studentRating?.lessons?.length || 0} записей</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => a.setView('student')}>Открыть оценки</button>
              <button className="btn btn-danger-soft btn-sm" onClick={() => a.logoutStudent()}>Выйти</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-section">
          <h3 className="section-title">Вход в систему</h3>
          <div className="glass" style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
              Введите номер студенческого билета для просмотра оценок и пропусков
            </p>
            <input type="text" id="studentCard" placeholder="15350060" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid var(--brutal-ink)', background: 'var(--brutal-card)', color: 'var(--brutal-paper)', fontSize: '15px', fontWeight: 700, boxSizing: 'border-box' }} />
            <button className="btn btn-primary btn-block" style={{ marginTop: '8px' }} onClick={() => {
              const val = document.getElementById('studentCard')?.value || ''
              a.login(val)
            }}>Войти</button>
          </div>
        </div>
      )}
    </div>
  )
}
