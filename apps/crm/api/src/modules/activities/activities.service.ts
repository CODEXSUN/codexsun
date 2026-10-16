import type { ActivitiesRepository } from "./activities.repository.js";
import type { ActivityFilters } from "./activities.types.js";

export class ActivitiesService {
  constructor(private readonly repository: ActivitiesRepository) {}

  list(filters: ActivityFilters) {
    return this.repository.list(filters);
  }

  statuses() {
    return this.repository.statuses();
  }
}
