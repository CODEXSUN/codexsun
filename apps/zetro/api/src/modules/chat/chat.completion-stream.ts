import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";

const chunkSchema = z.object({
  choices: z.array(
    z.object({ delta: z.object({ content: z.string().nullable().optional() }).optional() })
  )
});

export async function streamCompletion(
  response: Response,
  onProgress: (event: { event: "status" | "token"; content: string }) => void
): Promise<string> {
  if (!response.body) throw AppError.internal("Zetro AI provider returned no reply stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/gu, "\n");
      if (buffer.length > 65_536) throw AppError.internal("Zetro AI provider reply is too large.");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary).replace(/\r/gu, "");
        buffer = buffer.slice(boundary + 2);
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6))
          .join("\n");
        if (data && data !== "[DONE]") {
          let payload: unknown;
          try {
            payload = JSON.parse(data);
          } catch {
            throw AppError.internal("Zetro AI provider returned an invalid reply stream.");
          }
          const parsed = chunkSchema.safeParse(payload);
          if (!parsed.success)
            throw AppError.internal("Zetro AI provider returned an invalid reply stream.");
          const content = parsed.data.choices[0]?.delta?.content ?? "";
          if (content) {
            answer += content;
            if (answer.length > 200_000)
              throw AppError.internal("Zetro AI provider reply is too large.");
            onProgress({ event: "token", content });
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  if (!answer.trim()) throw AppError.internal("Zetro AI provider returned an empty reply.");
  return answer.trim();
}
