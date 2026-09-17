const apiUrl = process.env.CONTAINER_PLATFORM_API_URL ?? "http://127.0.0.1:6100";
const webUrl = process.env.CONTAINER_PLATFORM_WEB_URL ?? "http://127.0.0.1:6101";

await verify(`${apiUrl}/api/v1/platform/health`, "application/json");
await verify(webUrl, "text/html");

async function verify(url, contentType) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Container check failed for ${url}: HTTP ${response.status}.`);
  if (!response.headers.get("content-type")?.includes(contentType)) {
    throw new Error(`Container check returned an unexpected content type for ${url}.`);
  }
}
