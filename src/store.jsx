import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { api } from './api.js'
import {
  savedGroup, saveGroup, savedEmployee, saveEmployee,
  savedTheme, saveTheme, savedAccent, saveAccent,
  savedSubgroup, saveSubgroup, savedOnboarded, saveOnboarded,
  applyTheme, initThemeListener,
} from './lib/prefs.js'
import { initNotifications, scheduleLessonNotifications } from './lib/notifications.js'

const Ctx = createContext(null)

const init = {
  group: savedGroup(),
  employee: savedEmployee(),
  schedule: null,
  currentWeek: null,
  groups: [],
  employees: [],
  faculties: [],
  auditories: [],
  announcements: [],
  loading: false,
  error: null,
  toast: null,
  view: savedGroup() || savedEmployee() ? 'home' : 'onboard',
  isDark: false,
  theme: savedTheme(),
  accent: savedAccent(),
  subgroup: savedSubgroup(),
  onboarded: savedOnboarded(),
  notifEnabled: false,
}

function reducer(s, a) {
  switch (a.type) {
    case 'SET_SCHEDULE': return { ...s, schedule: a.v, loading: false, error: null }
    case 'SET_WEEK': return { ...s, currentWeek: a.v }
    case 'SET_GROUPS': return { ...s, groups: a.v }
    case 'SET_EMPLOYEES': return { ...s, employees: a.v }
    case 'SET_FACULTIES': return { ...s, faculties: a.v }
    case 'SET_AUDITORIES': return { ...s, auditories: a.v }
    case 'SET_ANNOUNCEMENTS': return { ...s, announcements: a.v }
    case 'SET_GROUP': return { ...s, group: a.v, employee: null, mode: 'group', loading: true, error: null }
    case 'SET_EMPLOYEE': return { ...s, employee: a.v, group: null, mode: 'employee', loading: true, error: null }
    case 'SET_LOADING': return { ...s, loading: a.v }
    case 'SET_ERROR': return { ...s, error: a.v, loading: false }
    case 'VIEW': return { ...s, view: a.v }
    case 'TOAST': return { ...s, toast: a.toast }
    case 'SET_DARK': return { ...s, isDark: a.v }
    case 'SET_THEME': return { ...s, theme: a.v }
    case 'SET_ACCENT': return { ...s, accent: a.v }
    case 'SET_SUBGROUP': return { ...s, subgroup: a.v }
    case 'ONBOARDED': return { ...s, onboarded: true, view: 'home' }
    case 'SET_NOTIF': return { ...s, notifEnabled: a.v }
    case 'CLEAR_SCHEDULE': return { ...s, schedule: null, group: null, employee: null, announcements: [] }
    default: return s
  }
}

let tt
function toast(d, msg, type = 'info') {
  clearTimeout(tt)
  d({ type: 'TOAST', toast: { msg, type } })
  tt = setTimeout(() => d({ type: 'TOAST', toast: null }), 3500)
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  const loadSchedule = useCallback(async (mode, id) => {
    if (!mode || !id) return
    dispatch({ type: 'SET_LOADING', v: true })
    try {
      const [sched, week] = await Promise.all([
        mode === 'group' ? api.scheduleGroup(id) : api.scheduleEmployee(id),
        api.currentWeek().catch(() => null),
      ])
      dispatch({ type: 'SET_SCHEDULE', v: sched })
      if (week !== null) dispatch({ type: 'SET_WEEK', v: Number(week) || 1 })
      if (mode === 'employee') {
        api.announcementsEmployee(id).then((a) => dispatch({ type: 'SET_ANNOUNCEMENTS', v: a || [] })).catch(() => {})
      } else {
        dispatch({ type: 'SET_ANNOUNCEMENTS', v: [] })
      }
      const dayLessons = getTodayLessons(sched)
      scheduleLessonNotifications(dayLessons)
    } catch (e) {
      dispatch({ type: 'SET_ERROR', v: e.message || 'Ошибка загрузки' })
    }
  }, [])

  useEffect(() => {
    const th = savedTheme(), ac = savedAccent()
    const dark = applyTheme(th, ac)
    dispatch({ type: 'SET_THEME', v: th })
    dispatch({ type: 'SET_ACCENT', v: ac })
    dispatch({ type: 'SET_DARK', v: dark })

    initThemeListener(
      () => state.theme,
      () => state.accent,
      (th) => dispatch({ type: 'SET_THEME', v: th })
    )

    if (state.group) loadSchedule('group', state.group.name)
    else if (state.employee) loadSchedule('employee', state.employee.urlId)
  }, [])

  const act = {
    selectGroup: async (g) => {
      saveGroup(g); saveEmployee(null)
      dispatch({ type: 'SET_GROUP', v: g })
      await loadSchedule('group', g.name)
      dispatch({ type: 'VIEW', v: 'home' })
    },
    selectEmployee: async (e) => {
      saveEmployee(e); saveGroup(null)
      dispatch({ type: 'SET_EMPLOYEE', v: e })
      await loadSchedule('employee', e.urlId)
      dispatch({ type: 'VIEW', v: 'home' })
    },
    clearSchedule: () => {
      saveGroup(null); saveEmployee(null)
      dispatch({ type: 'CLEAR_SCHEDULE' })
    },
    refresh: async () => {
      if (state.group) await loadSchedule('group', state.group.name)
      else if (state.employee) await loadSchedule('employee', state.employee.urlId)
    },
    refreshWeek: async () => {
      try { const w = await api.currentWeek(); dispatch({ type: 'SET_WEEK', v: Number(w) || 1 }) } catch {}
    },
    loadGroups: async () => {
      try { const g = await api.groups(); dispatch({ type: 'SET_GROUPS', v: g || [] }) } catch { dispatch({ type: 'SET_GROUPS', v: [] }) }
    },
    loadEmployees: async () => {
      try { const e = await api.employees(); dispatch({ type: 'SET_EMPLOYEES', v: e || [] }) } catch { dispatch({ type: 'SET_EMPLOYEES', v: [] }) }
    },
    loadFaculties: async () => {
      try { const f = await api.faculties(); dispatch({ type: 'SET_FACULTIES', v: f || [] }) } catch { dispatch({ type: 'SET_FACULTIES', v: [] }) }
    },
    loadAuditories: async () => {
      try { const a = await api.auditories(); dispatch({ type: 'SET_AUDITORIES', v: a || [] }) } catch { dispatch({ type: 'SET_AUDITORIES', v: [] }) }
    },
    setView: (v) => dispatch({ type: 'VIEW', v }),
    setTheme: (t) => {
      saveTheme(t)
      const dark = applyTheme(t, state.accent)
      dispatch({ type: 'SET_THEME', v: t })
      dispatch({ type: 'SET_DARK', v: dark })
    },
    setAccent: (a) => {
      saveAccent(a)
      applyTheme(state.theme, a)
      dispatch({ type: 'SET_ACCENT', v: a })
    },
    setSubgroup: (s) => { saveSubgroup(s); dispatch({ type: 'SET_SUBGROUP', v: s }) },
    completeOnboard: () => { saveOnboarded(); dispatch({ type: 'ONBOARDED' }) },
    enableNotifications: async () => {
      const ok = await initNotifications()
      dispatch({ type: 'SET_NOTIF', v: ok })
      if (ok) toast(dispatch, 'Уведомления включены', 'success')
      else toast(dispatch, 'Уведомления запрещены в браузере', 'error')
      return ok
    },
    toast: (m, t) => toast(dispatch, m, t),
  }

  return <Ctx.Provider value={{ s: state, a: act }}>{children}</Ctx.Provider>
}

function getTodayLessons(schedule) {
  if (!schedule?.schedules) return []
  const now = new Date()
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  const todayName = days[now.getDay()]
  for (const [key, lessons] of Object.entries(schedule.schedules)) {
    if (key.includes(todayName) || new Date(key).toDateString() === now.toDateString()) {
      return Array.isArray(lessons) ? lessons : []
    }
  }
  return []
}

export function useStore() { return useContext(Ctx) }
