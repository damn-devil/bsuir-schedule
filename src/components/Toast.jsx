import { useStore } from '../store.jsx'
export function Toast() {
  const { s } = useStore()
  if (!s.toast) return null
  return <div className={`toast ${s.toast.type || ''}`} role="status">{s.toast.msg}</div>
}
