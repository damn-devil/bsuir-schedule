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

const THEMES = {
  light: {
    brutalInk: '#1b1b1b',
    brutalPaper: '#efe9dc',
    brutalCard: '#f7f2e5',
    brutalMuted: '#6f675a',
    brutalBtnBg: '#e9e3d3',
    brutalBtnFg: '#1b1b1b',
    brutalBtnBd: '#1b1b1b',
    brutalBtnSh: '#1b1b1b',
    brutalFieldBg: '#f7f2e5',
    brutalFieldFg: '#1b1b1b',
  },
  dark: {
    brutalInk: '#f2ede0',
    brutalPaper: '#141414',
    brutalCard: '#222222',
    brutalMuted: '#9a9080',
    brutalBtnBg: '#000000',
    brutalBtnFg: '#f2ede0',
    brutalBtnBd: '#f2ede0',
    brutalBtnSh: '#f2ede0',
    brutalFieldBg: '#000000',
    brutalFieldFg: '#f2ede0',
  },
}

export function applyTheme(themeName, accent) {
  const r = document.documentElement
  let dark = themeName === 'dark' || (themeName === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const t = dark ? THEMES.dark : THEMES.light

  r.style.setProperty('--brutal-ink', t.brutalInk)
  r.style.setProperty('--brutal-paper', t.brutalPaper)
  r.style.setProperty('--brutal-card', t.brutalCard)
  r.style.setProperty('--brutal-muted', t.brutalMuted)
  r.style.setProperty('--brutal-btn-bg', t.brutalBtnBg)
  r.style.setProperty('--brutal-btn-fg', t.brutalBtnFg)
  r.style.setProperty('--brutal-btn-bd', t.brutalBtnBd)
  r.style.setProperty('--brutal-btn-sh', t.brutalBtnSh)
  r.style.setProperty('--brutal-field-bg', t.brutalFieldBg)
  r.style.setProperty('--brutal-field-fg', t.brutalFieldFg)
  if (accent) r.style.setProperty('--accent', accent)
  r.style.setProperty('--bg', t.brutalPaper)
  r.style.setProperty('--text', t.brutalInk)
  r.style.setProperty('--text2', t.brutalMuted)
  r.style.setProperty('--border', t.brutalInk)
  r.style.setProperty('--separator', t.brutalMuted)
  r.style.setProperty('--card', t.brutalCard)
  r.style.setProperty('--glass', t.brutalCard)
  r.style.colorScheme = dark ? 'dark' : 'light'
  r.classList.toggle('is-dark', dark)

  const m = document.querySelector('meta[name="theme-color"]')
  if (m) m.content = dark ? t.brutalPaper : '#efe9dc'
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
