/** Query values can contain credentials, personal data, or limited-purpose public bindings. */
export function requestLogUrl(url: string) {
  return url.split("?", 1)[0] ?? "/";
}
