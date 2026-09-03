import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { isNotificationsSupported, getPermission, initNotifications } from '../lib/notifications.js'

export function SettingsScreen() {
  const { s, a } = useStore()

  return (
    <div className="screen">
      <header className="screen-header"><div><h1>Настройки</h1></div></header>

      <div className="settings-section">
        <h3 className="section-title">Тема</h3>
        <div className="theme-options">
          {[{ id: 'auto', label: 'Авто', icon: 'sun' }, { id: 'light', label: 'Светлая', icon: 'sun' }, { id: 'dark', label: 'Тёмная', icon: 'moon' }].map((t) => (
            <button key={t.id} className={`theme-btn glass ${s.theme === t.id ? 'active' : ''}`} onClick={() => a.setTheme(t.id)}>
              <Icon name={t.icon} size={18} /><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Акцент</h3>
        <div className="accent-options">
          {['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5856d6', '#ff2d55', '#00c7be'].map((c) => (
            <button key={c} className={`accent-dot ${s.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => a.setAccent(c)} />
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Уведомления</h3>
        <div className="notif-setting glass">
          <div className="notif-info">
            <Icon name="bell" size={18} />
            <span>{getPermission() === 'granted' ? 'Уведомления включены' : 'Уведомления выключены'}</span>
          </div>
          {isNotificationsSupported() && getPermission() !== 'granted' && (
            <button className="btn btn-primary btn-sm" onClick={() => a.enableNotifications()}>Включить</button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Текущая группа</h3>
        {s.group ? (
          <div className="current-group glass">
            <div>
              <strong>{s.group.studentGroup}</strong>
              {s.group.name && <small style={{ display: 'block', color: 'var(--text2)', fontSize: '13px' }}>{s.group.name}</small>}
            </div>
            <button className="btn btn-danger-soft btn-sm" onClick={() => { a.clearSchedule(); a.setView('search-group') }}>Сменить</button>
          </div>
        ) : s.employee ? (
          <div className="current-group glass">
            <div>
              <strong>{s.employee.shortName || s.employee.name}</strong>
              {s.employee.department?.name && <small style={{ display: 'block', color: 'var(--text2)', fontSize: '13px' }}>{s.employee.department.name}</small>}
            </div>
            <button className="btn btn-danger-soft btn-sm" onClick={() => { a.clearSchedule(); a.setView('search-employee') }}>Сменить</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => a.setView('search-group')}>Выбрать группу</button>
        )}
      </div>

      <div className="settings-section">
        <h3 className="section-title">О приложении</h3>
        <div className="about-card glass">
          <p><strong>БГУИР Расписание</strong> v1.0</p>
          <small>Данные: iis.bsuir.by/api/v1</small><br />
          <small>PWA — работает оффлайн</small>
        </div>
      </div>
    </div>
  )
}
