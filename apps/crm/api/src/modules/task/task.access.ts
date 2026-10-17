export function taskPermissionForRequest(method: string, path: string) {
  if (method === "PATCH" && /^\/crm\/tasks\/\d+\/properties$/u.test(path)) return "respond";
  if (method !== "POST") return null;
  if (/^\/crm\/tasks\/closure-requests\/\d+\/review$/u.test(path)) return "closure.review";
  if (/^\/crm\/tasks\/\d+\/(?:comments|closure-requests)$/u.test(path)) return "respond";
  if (/^\/crm\/tasks\/\d+\/jobs\/(?:start|stop)$/u.test(path)) return "work";
  return null;
}
