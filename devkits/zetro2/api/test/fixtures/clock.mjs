// Clock fixture for deterministic time progression in tests

export function createTestClock(initialDate = new Date('2026-09-24T00:00:00Z')) {
  let currentTime = new Date(initialDate).getTime();

  return {
    now() {
      return new Date(currentTime);
    },
    iso() {
      return new Date(currentTime).toISOString();
    },
    epochMs() {
      return currentTime;
    },
    epochSeconds() {
      return Math.floor(currentTime / 1000);
    },
    advance(ms) {
      currentTime += ms;
      return new Date(currentTime);
    },
    advanceSeconds(seconds) {
      currentTime += seconds * 1000;
      return new Date(currentTime);
    },
    advanceMinutes(minutes) {
      currentTime += minutes * 60 * 1000;
      return new Date(currentTime);
    },
    advanceHours(hours) {
      currentTime += hours * 60 * 60 * 1000;
      return new Date(currentTime);
    },
    set(date) {
      currentTime = new Date(date).getTime();
      return new Date(currentTime);
    },
  };
}
