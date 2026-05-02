import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import type { Alarm } from '../state/alarms'
import { nextOccurrenceMs } from '../utils/time'

function isNative(): boolean {
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android'
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return true
  const req = await LocalNotifications.requestPermissions()
  return req.display === 'granted'
}

function notificationIdForAlarm(alarmId: string): number {
  // Stable 31-bit hash for Capacitor's numeric notification IDs
  let hash = 0
  for (let i = 0; i < alarmId.length; i++) {
    hash = (hash * 31 + alarmId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 2_000_000_000
}

export async function scheduleNextAlarmNotification(alarm: Alarm): Promise<void> {
  if (!isNative()) return
  if (!alarm.enabled) return
  const next = nextOccurrenceMs(alarm.time)
  if (!next) return

  const ok = await ensureNotificationPermission()
  if (!ok) return

  await LocalNotifications.schedule({
    notifications: [
      {
        id: notificationIdForAlarm(alarm.id),
        title: 'Alarm',
        body: alarm.label || alarm.time,
        schedule: { at: new Date(next), allowWhileIdle: true },
        extra: { alarmId: alarm.id },
      },
    ],
  })
}

export async function cancelAlarmNotification(alarmId: string): Promise<void> {
  if (!isNative()) return
  await LocalNotifications.cancel({
    notifications: [{ id: notificationIdForAlarm(alarmId) }],
  })
}

