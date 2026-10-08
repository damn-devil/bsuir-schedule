import { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import { HomeScreen } from './screens/HomeScreen.jsx'
import { PreviewScreen } from './screens/PreviewScreen.jsx'
import { StudentScreen } from './screens/StudentScreen.jsx'
import { MoreScreen } from './screens/MoreScreen.jsx'
import { SearchGroupScreen } from './screens/SearchGroupScreen.jsx'
import { SearchEmployeeScreen } from './screens/SearchEmployeeScreen.jsx'
import { Toast } from './components/Toast.jsx'
import { Icon } from './components/Icon.jsx'
import { t } from './lib/i18n.js'
import './index.css'

function TabBar() {
  const { s, a } = useStore()
  if (s.view === 'preview' || s.view === 'search-group' || s.view === 'search-employee') return null
  const tabs = [
    { id: 'home', icon: 'calendar', label: t('tabSchedule') },
    { id: 'student', icon: 'book', label: t('tabGrades') },
    { id: 'more', icon: 'settings', label: t('tabMore') },
  ]
  const idx = Math.max(0, tabs.findIndex((tab) => tab.id === s.view))
  return (
    <nav className="tab-bar" style={{ '--idx': idx }} aria-label="Navigation">
      <span className="tab-pill" aria-hidden="true" />
      {tabs.map((tab) => (
        <button key={tab.id} className={`tab-item ${s.view === tab.id ? 'active' : ''}`} onClick={() => a.setView(tab.id)}>
          <span className="tab-icon"><Icon name={tab.icon} /></span>
          <span className="tab-label">{tab.label}</span>
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
    navigator.serviceWorker.register?.(`${import.meta.env.BASE_URL}sw.js`)
    navigator.serviceWorker.ready.then((reg) => {
      reg.update()
      const triggerUpdate = (w) => {
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && reg.active) {
            w.postMessage('SKIP_WAITING')
          }
        })
      }
      if (reg.installing) triggerUpdate(reg.installing)
      reg.addEventListener('updatefound', () => { if (reg.installing) triggerUpdate(reg.installing) })
    }).catch(() => {})
  }, [])
  return null
}

function AppInner() {
  const { s } = useStore()

  let screen
  switch (s.view) {
    case 'preview': screen = <PreviewScreen />; break
    case 'student': screen = <StudentScreen />; break
    case 'more': screen = <MoreScreen />; break
    case 'search-group': screen = <SearchGroupScreen />; break
    case 'search-employee': screen = <SearchEmployeeScreen />; break
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
