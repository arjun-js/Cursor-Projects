import { Redirect, Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { AlarmProvider } from './state/alarms'
import { NotificationBridge } from './native/NotificationBridge'
import AlarmEdit from './pages/AlarmEdit'
import Alarms from './pages/Alarms'
import Ring from './pages/Ring'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact()

const App: React.FC = () => (
  <IonApp>
    <AlarmProvider>
      <IonReactRouter>
        <NotificationBridge />
        <IonRouterOutlet>
          <Route exact path="/alarms">
            <Alarms />
          </Route>
          <Route exact path="/alarm/new">
            <AlarmEdit mode="new" />
          </Route>
          <Route exact path="/alarm/:id">
            <AlarmEdit mode="edit" />
          </Route>
          <Route exact path="/ring/:id">
            <Ring />
          </Route>
          <Route exact path="/">
            <Redirect to="/alarms" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AlarmProvider>
  </IonApp>
)

export default App
