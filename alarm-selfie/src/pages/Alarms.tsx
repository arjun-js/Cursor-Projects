import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react'
import { add } from 'ionicons/icons'
import { useEffect } from 'react'
import { useAlarms } from '../state/alarms'
import { formatTime24, nextOccurrenceMs } from '../utils/time'

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function shouldFireNow(now: Date, alarmTime: string): boolean {
  // Fire within a small window to avoid missing exact minute
  const next = nextOccurrenceMs(alarmTime, new Date(now.getTime() - 60_000))
  if (!next) return false
  const diff = Math.abs(next - now.getTime())
  return diff <= 20_000
}

export default function Alarms() {
  const router = useIonRouter()
  const { alarms, toggleAlarm, markFired } = useAlarms()

  // Foreground “scheduler” for quick testing in browser / when app is open.
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = new Date()
      for (const alarm of alarms) {
        if (!alarm.enabled) continue
        if (alarm.lastFiredAt && isSameDay(new Date(alarm.lastFiredAt), now) && formatTime24(new Date(alarm.lastFiredAt)) === alarm.time) {
          continue
        }
        if (shouldFireNow(now, alarm.time)) {
          markFired(alarm.id, now.getTime())
          router.push(`/ring/${alarm.id}`, 'forward')
          break
        }
      }
    }, 5_000)
    return () => window.clearInterval(t)
  }, [alarms, markFired, router])

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Alarms</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => router.push('/alarm/new', 'forward')} aria-label="Add alarm">
              <IonIcon icon={add} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList inset>
          {alarms.map((a) => (
            <IonItem key={a.id} button onClick={() => router.push(`/alarm/${a.id}`, 'forward')}>
              <IonLabel>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{a.time}</div>
                <div style={{ opacity: 0.8 }}>{a.label || 'Alarm'}</div>
              </IonLabel>
              <IonToggle
                aria-label={`Toggle ${a.label || a.time}`}
                checked={a.enabled}
                onIonChange={(e) => toggleAlarm(a.id, e.detail.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  )
}

