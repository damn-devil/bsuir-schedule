import { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import { HomeScreen } from './screens/HomeScreen.jsx'
import { PreviewScreen } from './screens/PreviewScreen.jsx'
import { SearchGroupScreen } from './screens/SearchGroupScreen.jsx'
import { SearchEmployeeScreen } from './screens/SearchEmployeeScreen.jsx'
import { AuditoriesScreen } from './screens/AuditoriesScreen.jsx'
import { FacultiesScreen } from './screens/FacultiesScreen.jsx'
import { SettingsScreen } from './screens/SettingsScreen.jsx'
import { Toast } from './components/Toast.jsx'
import { Icon } from './components/Icon.jsx'
import { t } from './lib/i18n.js'
import './index.css'

function TabBar() {
  const { s, a } = useStore()
  if (s.view === 'preview') return null
  const tabs = [
    { id: 'home', icon: 'calendar', label: t('tabSchedule') },
    { id: 'search-group', icon: 'users', label: t('tabGroups') },
    { id: 'search-employee', icon: 'user', label: t('tabEmployees') },
    { id: 'settings', icon: 'settings', label: t('tabSettings') },
  ]
  return (
    <nav className="tab-bar" aria-label="Navigation">
      {tabs.map((t) => (
        <button key={t.id} className={`tab-item ${s.view === t.id ? 'active' : ''}`} onClick={() => a.setView(t.id)}>
          <span className="tab-icon"><Icon name={t.icon} /></span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

function AutoUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) { reloading = true; window.location.reload() }
    })
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return
      const triggerUpdate = (w) => {
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && reg.active) {
            w.postMessage('SKIP_WAITING')
          }
        })
      }
      if (reg.installing) triggerUpdate(reg.installing)
      reg.addEventListener('updatefound', () => { if (reg.installing) triggerUpdate(reg.installing) })
    })
  }, [])
  return null
}

function AppInner() {
  const { s, a } = useStore()

  let screen
  switch (s.view) {
    case 'preview': screen = <PreviewScreen />; break
    case 'search-group': screen = <SearchGroupScreen />; break
    case 'search-employee': screen = <SearchEmployeeScreen />; break
    case 'auditories': screen = <AuditoriesScreen />; break
    case 'faculties': screen = <FacultiesScreen />; break
    case 'settings': screen = <SettingsScreen />; break
    default: screen = <HomeScreen />
  }

  return (
    <div className={`app${s.isDark ? ' is-dark' : ''}`}>
      <AutoUpdate />
      <div className="screen-view" key={s.view}>{screen}</div>
      <TabBar />
      <Toast />
    </div>
  )
}

export default function App() {
  return <StoreProvider><AppInner /></StoreProvider>
}
