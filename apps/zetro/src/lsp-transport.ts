type ParsedMessage = {
  message: unknown;
  rest: Buffer;
};

const HEADER_SEPARATOR = "\r\n\r\n";

export function encodeLspMessage(message: unknown) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf-8");
  const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, "utf-8");
  return Buffer.concat([header, payload]);
}

export function decodeLspMessage(buffer: Buffer): ParsedMessage | null {
  const headerEnd = buffer.indexOf(HEADER_SEPARATOR);
  if (headerEnd === -1) {
    return null;
  }

  const headerText = buffer.subarray(0, headerEnd).toString("utf-8");
  const headers = headerText.split("\r\n");
  const contentLengthHeader = headers.find((header) =>
    header.toLowerCase().startsWith("content-length:"),
  );

  if (!contentLengthHeader) {
    throw new Error("LSP message missing Content-Length header");
  }

  const length = Number(contentLengthHeader.split(":")[1]?.trim() || "");
  if (!Number.isFinite(length) || length < 0) {
    throw new Error(`Invalid Content-Length header: ${contentLengthHeader}`);
  }

  const bodyStart = headerEnd + HEADER_SEPARATOR.length;
  const bodyEnd = bodyStart + length;
  if (buffer.length < bodyEnd) {
    return null;
  }

  const body = buffer.subarray(bodyStart, bodyEnd).toString("utf-8");
  return {
    message: JSON.parse(body),
    rest: buffer.subarray(bodyEnd),
  };
}
