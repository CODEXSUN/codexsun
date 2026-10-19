import type { ActivitiesRepository } from "./activities.repository.js";
import type { ActivityFilters } from "./activities.types.js";

export class ActivitiesService {
  constructor(private readonly repository: ActivitiesRepository) {}

  list(filters: ActivityFilters) {
    return this.repository.list(applyUserActivityWindow(filters));
  }

  statuses() {
    return this.repository.statuses();
  }
}

const defaultUserActivityWindowDays = 7;
const maximumUserActivityWindowDays = 30;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function applyUserActivityWindow(
  filters: ActivityFilters,
  now = new Date()
): ActivityFilters {
  if (filters.scope !== "mine" && filters.canViewAll) return filters;

  const defaultStart = now.getTime() - defaultUserActivityWindowDays * millisecondsPerDay;
  const maximumStart = now.getTime() - maximumUserActivityWindowDays * millisecondsPerDay;
  const requestedStart = filters.createdAfter ? Date.parse(filters.createdAfter) : defaultStart;
  const safeRequestedStart = Number.isFinite(requestedStart) ? requestedStart : defaultStart;

  return {
    ...filters,
    createdAfter: new Date(Math.max(safeRequestedStart, maximumStart)).toISOString()
  };
}
