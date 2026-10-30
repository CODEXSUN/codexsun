import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
import { loadRequirements } from "./requirement.services";
export const useRequirements = (gateway: TconnectGateway, board = false) =>
  useQuery({
    queryKey: ["tconnect", "requirement", board ? "board" : "own"],
    queryFn: () => loadRequirements(gateway, board)
  });
