import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { api } from './api.js'
import {
  savedGroup, saveGroup, savedEmployee, saveEmployee,
  savedTheme, saveTheme, savedAccent, saveAccent,
  savedSubgroup, saveSubgroup, savedOnboarded, saveOnboarded,
  savedPinned, savePinned,
  applyTheme, initThemeListener,
} from './lib/prefs.js'
import { initNotifications, scheduleLessonNotifications } from './lib/notifications.js'

const Ctx = createContext(null)

const init = {
  pinned: savedPinned(),
  pinnedSchedule: null,
  pinnedWeek: null,
  pinnedAnnouncements: [],
  selectedWeek: null,
  preview: null,
  previewSchedule: null,
  previewWeek: null,
  previewAnnouncements: [],
  groups: [],
  employees: [],
  faculties: [],
  auditories: [],
  loading: false,
  error: null,
  toast: null,
  view: savedPinned() ? 'home' : 'search-group',
  isDark: false,
  theme: savedTheme(),
  accent: savedAccent(),
  subgroup: savedSubgroup(),
  onboarded: true,
  notifEnabled: false,
}

function reducer(s, a) {
  switch (a.type) {
    case 'SET_PINNED_SCHEDULE': return { ...s, pinnedSchedule: a.v, loading: false, error: null }
    case 'SET_PINNED_WEEK': return { ...s, pinnedWeek: a.v }
    case 'SET_PINNED_ANNOUNCEMENTS': return { ...s, pinnedAnnouncements: a.v }
    case 'SET_PREVIEW_SCHEDULE': return { ...s, previewSchedule: a.v, loading: false, error: null }
    case 'SET_PREVIEW_WEEK': return { ...s, previewWeek: a.v }
    case 'SET_PREVIEW_ANNOUNCEMENTS': return { ...s, previewAnnouncements: a.v }
    case 'SET_PREVIEW': return { ...s, preview: a.v, previewSchedule: null, previewWeek: null, previewAnnouncements: [], loading: true, error: null }
    case 'SET_PINNED': return { ...s, pinned: a.v }
    case 'SET_SELECTED_WEEK': return { ...s, selectedWeek: a.v }
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
    case 'SET_GROUPS': return { ...s, groups: a.v }
    case 'SET_EMPLOYEES': return { ...s, employees: a.v }
    case 'SET_FACULTIES': return { ...s, faculties: a.v }
    case 'SET_AUDITORIES': return { ...s, auditories: a.v }
    case 'CLEAR_PREVIEW': return { ...s, preview: null, previewSchedule: null, previewAnnouncements: [] }
    default: return s
  }
}

let tt
function toast(d, msg, type = 'info') {
  clearTimeout(tt)
  d({ type: 'TOAST', toast: { msg, type } })
  tt = setTimeout(() => d({ type: 'TOAST', toast: null }), 3500)
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

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  const loadSchedule = useCallback(async (type, data, setSchedule, setWeek, setAnnouncements) => {
    if (!type || !data) return
    dispatch({ type: 'SET_LOADING', v: true })
    try {
      const id = type === 'group' ? data.name : data.urlId
      const [sched, week] = await Promise.all([
        type === 'group' ? api.scheduleGroup(id) : api.scheduleEmployee(id),
        api.currentWeek().catch(() => null),
      ])
      dispatch({ type: setSchedule, v: sched })
      if (week !== null) dispatch({ type: setWeek, v: Number(week) || 1 })
      if (type === 'employee') {
        api.announcementsEmployee(id).then((a) => {
          const list = Array.isArray(a) ? a : (a?.content || [])
          dispatch({ type: setAnnouncements, v: list })
        }).catch(() => {})
      } else {
        dispatch({ type: setAnnouncements, v: [] })
      }
      if (setSchedule === 'SET_PINNED_SCHEDULE') {
        const dayLessons = getTodayLessons(sched)
        scheduleLessonNotifications(dayLessons)
      }
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

    const p = savedPinned()
    if (p) {
      dispatch({ type: 'SET_PINNED', v: p })
      loadSchedule(p.type, p.data, 'SET_PINNED_SCHEDULE', 'SET_PINNED_WEEK', 'SET_PINNED_ANNOUNCEMENTS')
    }
  }, [])

  const act = {
    previewGroup: (g) => {
      dispatch({ type: 'SET_PREVIEW', v: { type: 'group', data: g } })
      dispatch({ type: 'VIEW', v: 'preview' })
    },
    previewEmployee: (e) => {
      dispatch({ type: 'SET_PREVIEW', v: { type: 'employee', data: e } })
      dispatch({ type: 'VIEW', v: 'preview' })
    },
    pinPreviewTo: (schedule, week, preview, announcements) => {
      if (!preview || !schedule) return
      savePinned(preview)
      dispatch({ type: 'SET_PINNED', v: preview })
      dispatch({ type: 'SET_PINNED_SCHEDULE', v: schedule })
      if (week !== null) {
        dispatch({ type: 'SET_PINNED_WEEK', v: week })
        dispatch({ type: 'SET_SELECTED_WEEK', v: week })
      }
      dispatch({ type: 'SET_PINNED_ANNOUNCEMENTS', v: announcements || [] })
      dispatch({ type: 'VIEW', v: 'home' })
      const dayLessons = getTodayLessons(schedule)
      scheduleLessonNotifications(dayLessons)
      toast(dispatch, 'Расписание закреплено', 'success')
    },
    pinPreview: () => {
      const { preview, previewSchedule, previewWeek, previewAnnouncements } = state
      if (!preview || !previewSchedule) return
      savePinned(preview)
      dispatch({ type: 'SET_PINNED', v: preview })
      dispatch({ type: 'SET_PINNED_SCHEDULE', v: previewSchedule })
      if (previewWeek !== null) {
        dispatch({ type: 'SET_PINNED_WEEK', v: previewWeek })
        dispatch({ type: 'SET_SELECTED_WEEK', v: previewWeek })
      }
      dispatch({ type: 'SET_PINNED_ANNOUNCEMENTS', v: previewAnnouncements || [] })
      dispatch({ type: 'CLEAR_PREVIEW' })
      dispatch({ type: 'VIEW', v: 'home' })
      const dayLessons = getTodayLessons(previewSchedule)
      scheduleLessonNotifications(dayLessons)
      toast(dispatch, 'Расписание закреплено', 'success')
    },
    unpin: () => {
      savePinned(null)
      dispatch({ type: 'SET_PINNED', v: null })
      dispatch({ type: 'SET_PINNED_SCHEDULE', v: null })
      dispatch({ type: 'SET_PINNED_WEEK', v: null })
      dispatch({ type: 'SET_PINNED_ANNOUNCEMENTS', v: [] })
    },
    clearPreview: () => dispatch({ type: 'CLEAR_PREVIEW' }),
    refresh: async () => {
      const p = state.pinned
      if (p) await loadSchedule(p.type, p.data, 'SET_PINNED_SCHEDULE', 'SET_PINNED_WEEK', 'SET_PINNED_ANNOUNCEMENTS')
    },
    refreshWeek: async () => {
      try { const w = await api.currentWeek(); dispatch({ type: 'SET_PINNED_WEEK', v: Number(w) || 1 }) } catch {}
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
    setSelectedWeek: (w) => dispatch({ type: 'SET_SELECTED_WEEK', v: w }),
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

export function useStore() { return useContext(Ctx) }
