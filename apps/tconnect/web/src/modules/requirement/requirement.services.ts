import type { TconnectGateway } from "../../workspace.types";
export const loadRequirements = (gateway: TconnectGateway, board = false) =>
  board ? gateway.requirement.board() : gateway.requirement.list();
