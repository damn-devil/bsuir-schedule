import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { isNotificationsSupported, getPermission } from '../lib/notifications.js'
import { t } from '../lib/i18n.js'

export function OnboardScreen() {
  const { a } = useStore()
  const [step, setStep] = useState(0)
  const [notifState, setNotifState] = useState('unknown')

  useEffect(() => {
    setNotifState(getPermission())
  }, [])

  const steps = [
    {
      icon: '📚',
      title: t('onboardTitle'),
      desc: t('onboardDesc'),
    },
    {
      icon: '📲',
      title: t('installTitle'),
      desc: t('installDesc'),
      isInstall: true,
    },
    {
      icon: '🔔',
      title: t('notifications'),
      desc: '',
    },
  ]

  const s = steps[step]

  return (
    <div className="onboard-screen">
      <div className="onboard-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>
      <div className="onboard-content">
        <div className="onboard-icon">{s.icon}</div>
        <h1>{s.title}</h1>
        {s.desc && <p>{s.desc}</p>}
        {s.isInstall && <InstallGuide />}
        <div className="onboard-dots">
          {steps.map((_, i) => <span key={i} className={`onboard-dot ${i === step ? 'active' : ''}`} />)}
        </div>
        <div className="onboard-actions">
          {step < steps.length - 1 ? (
            <button className="btn btn-primary btn-block" onClick={() => setStep(step + 1)}>{t('next')}</button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => a.completeOnboard()}>{t('start')}</button>
          )}
          {step === steps.length - 1 && notifState === 'default' && (
            <button className="btn btn-soft btn-block" onClick={() => a.enableNotifications().then(() => setNotifState(getPermission()))}>
              {t('enable')}
            </button>
          )}
          <button className="btn-text" onClick={() => a.completeOnboard()}>{t('back')}</button>
        </div>
      </div>
    </div>
  )
}

function InstallGuide() {
  const [ua, setUa] = useState('')
  useEffect(() => {
    const n = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(n)) setUa('ios')
    else if (/Android/.test(n)) setUa('android')
    else setUa('desktop')
  }, [])

  if (ua === 'ios') return (
    <div className="install-guide">
      <div className="install-step"><span className="install-num">1</span><span>Tap <strong>Share</strong> ▣ in Safari</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Select <strong>Add to Home Screen</strong></span></div>
      <div className="install-step"><span className="install-num">3</span><span>Tap <strong>Add</strong></span></div>
    </div>
  )
  if (ua === 'android') return (
    <div className="install-guide">
      <div className="install-step"><span className="install-num">1</span><span>Tap <strong>three dots</strong> in Chrome</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Select <strong>Install app</strong></span></div>
      <div className="install-step"><span className="install-num">3</span><span>Confirm installation</span></div>
    </div>
  )
  return (
    <div className="install-guide">
      <div className="install-step"><span className="install-num">1</span><span>Click <strong>+</strong> in address bar</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Select <strong>Install app</strong></span></div>
    </div>
  )
}
