import { IonApp, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from "@ionic/react";
import { platformHealthSchema, type PlatformHealth } from "@codexsun/contracts";
import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_PLATFORM_MOBILE_API_URL;

export function App() {
  const [health, setHealth] = useState<PlatformHealth | null>(null);

  useEffect(() => {
    void fetch(`${apiUrl}/api/v1/platform/health`)
      .then(async (response) => platformHealthSchema.parse(await response.json()))
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar>
          <IonTitle>CODEXSUN Platform</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Mobile workspace</h1>
        <p>Public API contracts support this Ionic and Capacitor host.</p>
        <IonList inset>
          <IonItem>
            <IonLabel>API status</IonLabel>
            <IonLabel slot="end">{health?.status ?? "offline"}</IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>Providers</IonLabel>
            <IonLabel slot="end">{health?.providers.length ?? 0}</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonApp>
  );
}
