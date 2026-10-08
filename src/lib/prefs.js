const K = 'bsuir_'
const g = (k, d) => { try { const v = localStorage.getItem(K + k); return v !== null ? JSON.parse(v) : d } catch { return d } }
const sv = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)) } catch {} }

export const savedGroup = () => g('grp', null)
export const saveGroup = (v) => sv('grp', v)
export const savedEmployee = () => g('emp', null)
export const saveEmployee = (v) => sv('emp', v)
export const savedTheme = () => g('thm', 'auto')
export const saveTheme = (v) => sv('thm', v)
export const savedAccent = () => g('acc', '#e8573a')
export const saveAccent = (v) => sv('acc', v)
export const savedSubgroup = () => g('sub', 0)
export const saveSubgroup = (v) => sv('sub', v)
export const savedOnboarded = () => g('onb', false)
export const saveOnboarded = () => sv('onb', true)
export const savedLang = () => g('lang', 'ru')
export const saveLang = (v) => sv('lang', v)
export const savedPinned = () => g('pin', null)
export const savePinned = (v) => sv('pin', v)
export const savedStudentCard = () => g('scard', null)
export const saveStudentCard = (v) => sv('scard', v)

const THEMES = {
  light: { bg: '#ffffff', themeColor: '#ffffff' },
  dark: { bg: '#000000', themeColor: '#000000' },
}

export function applyTheme(themeName) {
  const r = document.documentElement
  let dark = themeName === 'dark' || (themeName === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const t = dark ? THEMES.dark : THEMES.light

  r.style.colorScheme = dark ? 'dark' : 'light'
  r.classList.toggle('is-dark', dark)

  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const isDarkTag = m.media?.includes('dark')
    const isLightTag = m.media?.includes('light')
    if (isDarkTag) m.content = dark ? t.themeColor : 'about:blank'
    else if (isLightTag) m.content = dark ? 'about:blank' : t.themeColor
    else m.content = t.themeColor
  })
  return dark
}

let mqCleanup = null

export function initThemeListener(getTheme, getAccent, onChange) {
  if (mqCleanup) mqCleanup()
  mqCleanup = null
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => { const th = getTheme(); applyTheme(th, getAccent()); onChange(th) }
  mq.addEventListener?.('change', handler)
  mqCleanup = () => mq.removeEventListener?.('change', handler)
}

export function destroyThemeListener() {
  if (mqCleanup) { mqCleanup(); mqCleanup = null }
}
