import { MainWorkspace } from "@codexsun/ui";
import { GarmentCard } from "./modules/garments-dashboard/garments-dashboard.js";

export function App() {
  return (
    <MainWorkspace applicationId="garments" applicationName="Garments">
      <GarmentCard />
    </MainWorkspace>
  );
}
