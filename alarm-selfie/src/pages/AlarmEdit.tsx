import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Alarm, useAlarms } from '../state/alarms'

type Props = {
  mode: 'new' | 'edit'
}

function normalizeHHmm(value: string): string {
  // IonDatetime can yield "HH:mm" or ISO; we keep just HH:mm
  if (/^\d{2}:\d{2}$/.test(value)) return value
  const d = new Date(value)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function AlarmEdit({ mode }: Props) {
  const router = useIonRouter()
  const params = useParams<{ id?: string }>()
  const { alarms, addAlarm, updateAlarm, removeAlarm } = useAlarms()

  const existing = useMemo<Alarm | undefined>(() => alarms.find((a) => a.id === params.id), [alarms, params.id])

  const [time, setTime] = useState(() => (mode === 'edit' && existing ? existing.time : '07:00'))
  const [label, setLabel] = useState(() => (mode === 'edit' && existing ? existing.label : ''))
  const [enabled, setEnabled] = useState(() => (mode === 'edit' && existing ? existing.enabled : true))

  const title = mode === 'new' ? 'New Alarm' : 'Edit Alarm'

  const onSave = () => {
    if (mode === 'new') {
      addAlarm({ time, label, enabled })
      router.push('/alarms', 'back')
      return
    }
    if (!existing) {
      router.push('/alarms', 'back')
      return
    }
    updateAlarm(existing.id, { time, label, enabled })
    router.push('/alarms', 'back')
  }

  const onDelete = () => {
    if (existing) removeAlarm(existing.id)
    router.push('/alarms', 'back')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/alarms" />
          </IonButtons>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={onSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Time</IonLabel>
            <IonDatetime
              presentation="time"
              value={`1970-01-01T${time}:00`}
              onIonChange={(e) => setTime(normalizeHHmm(String(e.detail.value)))}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Label</IonLabel>
            <IonInput value={label} placeholder="e.g. Gym" onIonInput={(e) => setLabel(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Enabled</IonLabel>
            <IonToggle checked={enabled} onIonChange={(e) => setEnabled(e.detail.checked)} aria-label="Enabled" />
          </IonItem>
        </IonList>

        {mode === 'edit' && (
          <div style={{ padding: '0 16px 24px' }}>
            <IonButton color="danger" expand="block" onClick={onDelete}>
              Delete Alarm
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

