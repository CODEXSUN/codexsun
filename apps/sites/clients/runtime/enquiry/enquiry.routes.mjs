export async function submitEnquiry(request, response, { origin, service, address }) {
  if (request.headers.origin !== origin)
    throw Object.assign(new Error("Submit the enquiry from this website."), { status: 403 });
  if (!request.headers["content-type"]?.startsWith("application/json"))
    throw Object.assign(new Error("Use a JSON enquiry request."), { status: 415 });
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error("The enquiry is too large."), { status: 413 });
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid enquiry request."), { status: 400 });
  }
  const result = service.receive(body, request.headers["idempotency-key"], address);
  response.writeHead(201, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ success: true, data: result }));
}
