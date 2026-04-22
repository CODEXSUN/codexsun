export type MultipartFile = {
  buffer: Buffer
  contentType: string
  fieldName: string
  fileName: string
}

export type MultipartField = {
  fieldName: string
  value: string
}

export function parseMultipartFormData(
  body: Buffer,
  contentType: string
): {
  files: MultipartFile[]
  fields: MultipartField[]
} {
  const boundaryMatch = /boundary=([^;]+)/i.exec(contentType)

  if (!boundaryMatch?.[1]) {
    throw new Error("Multipart boundary is missing.")
  }

  const boundary = Buffer.from(`--${boundaryMatch[1]}`)
  const files: MultipartFile[] = []
  const fields: MultipartField[] = []
  let startIndex = body.indexOf(boundary)

  while (startIndex !== -1) {
    const nextBoundaryIndex = body.indexOf(boundary, startIndex + boundary.length)

    if (nextBoundaryIndex === -1) {
      break
    }

    const part = body.subarray(startIndex + boundary.length + 2, nextBoundaryIndex - 2)
    const headerEndIndex = part.indexOf(Buffer.from("\r\n\r\n"))

    if (headerEndIndex === -1) {
      startIndex = nextBoundaryIndex
      continue
    }

    const headerText = part.subarray(0, headerEndIndex).toString("utf8")
    const content = part.subarray(headerEndIndex + 4)
    const dispositionMatch = /name="([^"]+)"/i.exec(headerText)

    if (!dispositionMatch?.[1]) {
      startIndex = nextBoundaryIndex
      continue
    }

    const fieldName = dispositionMatch[1]
    const fileNameMatch = /filename="([^"]*)"/i.exec(headerText)
    const contentTypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText)

    if (fileNameMatch?.[1]) {
      files.push({
        buffer: content,
        contentType: contentTypeMatch?.[1]?.trim() || "application/octet-stream",
        fieldName,
        fileName: fileNameMatch[1],
      })
    } else {
      fields.push({
        fieldName,
        value: content.toString("utf8"),
      })
    }

    startIndex = nextBoundaryIndex
  }

  return { files, fields }
}
