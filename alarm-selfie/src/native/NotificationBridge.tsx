import { LocalNotifications } from '@capacitor/local-notifications'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { ensureNotificationPermission } from './localNotifications'

export function NotificationBridge() {
  const history = useHistory()

  useEffect(() => {
    let remove: undefined | (() => void)

    const init = async () => {
      await ensureNotificationPermission()
      const handle = await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
        const alarmId = (event.notification.extra as any)?.alarmId
        if (alarmId) history.push(`/ring/${alarmId}`)
      })
      remove = () => handle.remove()
    }

    void init()
    return () => remove?.()
  }, [history])

  return null
}

