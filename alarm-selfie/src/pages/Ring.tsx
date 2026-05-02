import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonRouter } from '@ionic/react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useAlarms } from '../state/alarms'

type BrightnessResult = {
  mean: number
  brightRatio: number
}

async function analyzeBrightness(dataUrl: string): Promise<BrightnessResult> {
  const img = new Image()
  img.decoding = 'async'
  img.src = dataUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
  })

  const canvas = document.createElement('canvas')
  const maxW = 360
  const scale = Math.min(1, maxW / img.width)
  canvas.width = Math.max(1, Math.floor(img.width * scale))
  canvas.height = Math.max(1, Math.floor(img.height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Sample every Nth pixel for speed
  const step = 16
  let sum = 0
  let bright = 0
  let count = 0

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    // Relative luminance (sRGB approximation)
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += y
    if (y > 0.72) bright++
    count++
  }

  const mean = sum / Math.max(1, count)
  const brightRatio = bright / Math.max(1, count)
  return { mean, brightRatio }
}

function useAlarmBeep(active: boolean) {
  useEffect(() => {
    if (!active) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    let cancelled = false

    const playPattern = async () => {
      try {
        await ctx.resume()
      } catch {
        // ignore
      }
      const gain = ctx.createGain()
      gain.gain.value = 0.0001
      gain.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 880
      osc.connect(gain)
      osc.start()

      const tick = () => {
        if (cancelled) return
        const t = ctx.currentTime
        gain.gain.cancelScheduledValues(t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.22)
      }

      tick()
      const interval = window.setInterval(tick, 650)

      return () => {
        window.clearInterval(interval)
        try {
          osc.stop()
        } catch {
          // ignore
        }
        osc.disconnect()
        gain.disconnect()
      }
    }

    let stopOsc: undefined | (() => void)
    void playPattern().then((stop) => {
      stopOsc = stop
    })

    return () => {
      cancelled = true
      stopOsc?.()
      void ctx.close()
    }
  }, [active])
}

export default function Ring() {
  const router = useIonRouter()
  const { id } = useParams<{ id: string }>()
  const { alarms, toggleAlarm } = useAlarms()

  const alarm = useMemo(() => alarms.find((a) => a.id === id), [alarms, id])

  const [photo, setPhoto] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<BrightnessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useAlarmBeep(!dismissed)

  useEffect(() => {
    // If alarm disappears, go back
    if (!alarm) router.push('/alarms', 'back', 'replace')
  }, [alarm, router])

  const takeSelfie = async () => {
    setError(null)
    setChecking(true)
    setResult(null)
    try {
      const p = await Camera.getPhoto({
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
        resultType: CameraResultType.DataUrl,
        quality: 80,
        saveToGallery: false,
      })
      const dataUrl = p.dataUrl
      if (!dataUrl) throw new Error('No photo data')
      setPhoto(dataUrl)
      const r = await analyzeBrightness(dataUrl)
      setResult(r)
      const pass = r.mean >= 0.62 && r.brightRatio >= 0.45
      if (pass) {
        setDismissed(true)
      } else {
        setError('Too dark. Take a selfie with a brighter background (near a window / lights on).')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not open camera')
    } finally {
      setChecking(false)
    }
  }

  const stopAlarm = () => {
    if (!dismissed) return
    if (alarm) toggleAlarm(alarm.id, false)
    router.push('/alarms', 'back', 'replace')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>Alarm</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ display: 'grid', gap: 12, placeItems: 'center', textAlign: 'center', paddingTop: 24 }}>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>{alarm?.time ?? '--:--'}</div>
          <div style={{ opacity: 0.9 }}>{alarm?.label || 'Wake up'}</div>
          <div style={{ opacity: 0.75, maxWidth: 420 }}>
            This alarm can only be stopped after a selfie with a bright background.
          </div>

          <IonButton expand="block" strong onClick={takeSelfie} disabled={checking || dismissed}>
            {checking ? 'Checking…' : dismissed ? 'Selfie verified' : 'Take Selfie to Stop'}
          </IonButton>

          <IonButton expand="block" color={dismissed ? 'success' : 'medium'} onClick={stopAlarm} disabled={!dismissed}>
            Stop Alarm
          </IonButton>

          {error && <div style={{ color: 'var(--ion-color-danger)', fontWeight: 600 }}>{error}</div>}

          {result && (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Brightness mean: {(result.mean * 100).toFixed(0)}% • Bright pixels: {(result.brightRatio * 100).toFixed(0)}%
            </div>
          )}

          {photo && (
            <img
              src={photo}
              alt="Selfie preview"
              style={{
                width: 'min(320px, 92vw)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.15)',
                marginTop: 6,
              }}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

