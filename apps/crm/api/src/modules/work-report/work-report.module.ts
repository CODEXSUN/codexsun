import { registerWorkReportRoutes } from "./work-report.routes.js";
/** Append-only reports use existing work/view permissions; no separate seed or edit/delete lifecycle. */
export const workReportModule = {key:"crm.work-report",register:registerWorkReportRoutes};
