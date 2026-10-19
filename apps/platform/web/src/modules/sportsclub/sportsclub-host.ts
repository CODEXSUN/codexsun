import { apiGet } from "../../shared/api/platform-api";
import type { SportsclubGateway } from "./sportsclub-contract";

export type { SportsclubGateway, SportsclubStudentTab, SportsclubWebModule } from "./sportsclub-contract";

export const sportsclubGateway: SportsclubGateway = {
  attendance: {
    list: () => apiGet("/sportsclub/attendance", "tenant")
  },
  batches: {
    list: () => apiGet("/sportsclub/batches", "tenant")
  },
  session: () => apiGet("/sportsclub/student/session", "tenant"),
  students: {
    get: (uuid: string) => apiGet(`/sportsclub/students/${encodeURIComponent(uuid)}`, "tenant"),
    list: () => apiGet("/sportsclub/students", "tenant")
  }
};
