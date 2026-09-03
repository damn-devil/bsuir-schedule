import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { Icon } from '../components/Icon.jsx'
import { isNotificationsSupported, getPermission } from '../lib/notifications.js'

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
      title: 'БГУИР Расписание',
      desc: 'Удобное расписание занятий для студентов и преподавателей БГУИР',
    },
    {
      icon: '📲',
      title: 'Добавьте на экран',
      desc: '',
      isInstall: true,
    },
    {
      icon: '🔔',
      title: 'Уведомления',
      desc: 'Получайте напоминания о начале и конце занятий, а также за 5 минут до начала',
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
            <button className="btn btn-primary btn-block" onClick={() => setStep(step + 1)}>Далее</button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => a.completeOnboard()}>Начать</button>
          )}
          {step === steps.length - 1 && notifState === 'default' && (
            <button className="btn btn-soft btn-block" onClick={() => a.enableNotifications().then(() => setNotifState(getPermission()))}>
              Включить уведомления
            </button>
          )}
          <button className="btn-text" onClick={() => a.completeOnboard()}>Пропустить</button>
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
      <div className="install-step"><span className="install-num">1</span><span>Нажмите кнопку <strong>Поделиться</strong> ▣ внизу Safari</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Выберите <strong>На экран Домой</strong></span></div>
      <div className="install-step"><span className="install-num">3</span><span>Нажмите <strong>Добавить</strong></span></div>
    </div>
  )
  if (ua === 'android') return (
    <div className="install-guide">
      <div className="install-step"><span className="install-num">1</span><span>Нажмите <strong>три точки</strong> вверху Chrome</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Выберите <strong>Установить приложение</strong></span></div>
      <div className="install-step"><span className="install-num">3</span><span>Подтвердите установку</span></div>
    </div>
  )
  return (
    <div className="install-guide">
      <div className="install-step"><span className="install-num">1</span><span>Нажмите на иконку <strong>+</strong> в адресной строке</span></div>
      <div className="install-step"><span className="install-num">2</span><span>Выберите <strong>Установить приложение</strong></span></div>
    </div>
  )
}
