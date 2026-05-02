import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { cancelAlarmNotification, scheduleNextAlarmNotification } from '../native/localNotifications'

export type Alarm = {
  id: string
  time: string // "HH:mm"
  label: string
  enabled: boolean
  lastFiredAt?: number // epoch ms
}

type AlarmState = {
  alarms: Alarm[]
}

type Action =
  | { type: 'add'; alarm: Alarm }
  | { type: 'update'; id: string; patch: Partial<Alarm> }
  | { type: 'remove'; id: string }
  | { type: 'toggle'; id: string; enabled: boolean }
  | { type: 'markFired'; id: string; at: number }

const STORAGE_KEY = 'alarm-selfie:alarms:v1'

function safeParse(json: string | null): AlarmState | null {
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as AlarmState
    if (!parsed || !Array.isArray(parsed.alarms)) return null
    return parsed
  } catch {
    return null
  }
}

function reducer(state: AlarmState, action: Action): AlarmState {
  switch (action.type) {
    case 'add':
      return { alarms: [action.alarm, ...state.alarms] }
    case 'update':
      return {
        alarms: state.alarms.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      }
    case 'remove':
      return { alarms: state.alarms.filter((a) => a.id !== action.id) }
    case 'toggle':
      return {
        alarms: state.alarms.map((a) => (a.id === action.id ? { ...a, enabled: action.enabled } : a)),
      }
    case 'markFired':
      return {
        alarms: state.alarms.map((a) => (a.id === action.id ? { ...a, lastFiredAt: action.at } : a)),
      }
    default:
      return state
  }
}

type AlarmContextValue = {
  alarms: Alarm[]
  addAlarm: (alarm: Omit<Alarm, 'id'>) => string
  updateAlarm: (id: string, patch: Partial<Alarm>) => void
  removeAlarm: (id: string) => void
  toggleAlarm: (id: string, enabled: boolean) => void
  markFired: (id: string, at: number) => void
}

const AlarmContext = createContext<AlarmContextValue | null>(null)

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
    return {
      alarms: [
        { id: makeId(), time: '07:00', label: 'Wake up', enabled: true },
        { id: makeId(), time: '08:30', label: 'Backup alarm', enabled: false },
      ],
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ alarms: state.alarms }))
  }, [state.alarms])

  // Best-effort native scheduling: keep notifications aligned with current state.
  // (Real “alarm clock” behavior in background is OS-limited; notifications are the portable option.)
  useEffect(() => {
    const sync = async () => {
      for (const a of state.alarms) {
        if (!a.enabled) {
          await cancelAlarmNotification(a.id)
          continue
        }
        await cancelAlarmNotification(a.id)
        await scheduleNextAlarmNotification(a)
      }
    }
    void sync()
  }, [state.alarms])

  const addAlarm = useCallback((alarm: Omit<Alarm, 'id'>) => {
    const id = makeId()
    dispatch({ type: 'add', alarm: { ...alarm, id } })
    return id
  }, [])

  const updateAlarm = useCallback((id: string, patch: Partial<Alarm>) => {
    dispatch({ type: 'update', id, patch })
  }, [])

  const removeAlarm = useCallback((id: string) => {
    dispatch({ type: 'remove', id })
  }, [])

  const toggleAlarm = useCallback((id: string, enabled: boolean) => {
    dispatch({ type: 'toggle', id, enabled })
  }, [])

  const markFired = useCallback((id: string, at: number) => {
    dispatch({ type: 'markFired', id, at })
  }, [])

  const value = useMemo<AlarmContextValue>(
    () => ({
      alarms: state.alarms,
      addAlarm,
      updateAlarm,
      removeAlarm,
      toggleAlarm,
      markFired,
    }),
    [addAlarm, markFired, removeAlarm, state.alarms, toggleAlarm, updateAlarm],
  )

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
}

export function useAlarms(): AlarmContextValue {
  const ctx = useContext(AlarmContext)
  if (!ctx) throw new Error('useAlarms must be used within AlarmProvider')
  return ctx
}

