import { IonApp, IonBadge, IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonTitle, IonToolbar } from "@ionic/react";
import { useEffect, useState } from "react";
import { readZunoMobileHealth, readZunoMobileOverview, type ZunoMobileOverview } from "./control-client";

export function App() {
  const [overview, setOverview] = useState<ZunoMobileOverview | null>(null);
  const [connected, setConnected] = useState(false);

  async function refresh(): Promise<void> {
    const [health, nextOverview] = await Promise.allSettled([readZunoMobileHealth(), readZunoMobileOverview()]);
    setConnected(health.status === "fulfilled" && health.value.status === "ok");
    setOverview(nextOverview.status === "fulfilled" ? nextOverview.value : null);
  }

  useEffect(() => { void refresh(); }, []);

  return <IonApp><IonHeader><IonToolbar><IonTitle>Zuno</IonTitle><IonButton fill="clear" onClick={() => void refresh()} slot="end">Refresh</IonButton></IonToolbar></IonHeader><IonContent className="ion-padding">
    <p>ZUNO MOBILE CLIENT</p><h1>Worker progress, without worker control.</h1><p>Zuno reads CXForge health and task state. Source code and isolated workspaces remain on the worker server.</p>
    <IonList inset><IonItem><IonLabel><h2>Connection</h2><p>CXForge worker server</p></IonLabel><IonBadge color={connected ? "success" : "medium"} slot="end">{connected ? "Connected" : "Offline"}</IonBadge></IonItem><IonItem><IonLabel><h2>Runner</h2><p>{overview?.runnerUrl ?? "Waiting for CXForge"}</p></IonLabel></IonItem></IonList>
    <h2>Task overview</h2><IonList inset>{overview?.tasks.length ? overview.tasks.map((task) => <IonItem key={task.id}><IonLabel><h3>{task.title}</h3><IonNote>{task.id}</IonNote></IonLabel><IonBadge slot="end">{task.status}</IonBadge></IonItem>) : <IonItem><IonLabel><p>No CXForge task contracts are available.</p></IonLabel></IonItem>}</IonList>
  </IonContent></IonApp>;
}
