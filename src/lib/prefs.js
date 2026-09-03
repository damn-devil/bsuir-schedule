const K = 'bsuir_'
const g = (k, d) => { try { const v = localStorage.getItem(K + k); return v !== null ? JSON.parse(v) : d } catch { return d } }
const sv = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)) } catch {} }

export const savedGroup = () => g('grp', null)
export const saveGroup = (v) => sv('grp', v)
export const savedEmployee = () => g('emp', null)
export const saveEmployee = (v) => sv('emp', v)
export const savedTheme = () => g('thm', 'auto')
export const saveTheme = (v) => sv('thm', v)
export const savedAccent = () => g('acc', '#007aff')
export const saveAccent = (v) => sv('acc', v)
export const savedSubgroup = () => g('sub', 0)
export const saveSubgroup = (v) => sv('sub', v)
export const savedOnboarded = () => g('onb', false)
export const saveOnboarded = () => sv('onb', true)

export function applyTheme(theme, accent) {
  const r = document.documentElement
  if (accent) r.style.setProperty('--accent', accent)
  let dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  r.classList.toggle('is-dark', dark)
  const m = document.querySelector('meta[name="theme-color"]')
  if (m) m.content = dark ? '#1c1c1e' : '#f6f5f2'
  return dark
}
