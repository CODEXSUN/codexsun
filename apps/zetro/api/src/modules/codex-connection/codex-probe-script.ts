import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** Keeps probe code outside approved write roots and out of model transcription. */
export class CodexProbeScript {
  public readonly marker = `probe-${randomUUID()}.cjs`
  public readonly path: string

  private constructor(
    cwd: string,
    private readonly code: string,
  ) {
    this.path = join(dirname(cwd), this.marker)
  }

  public static async create(cwd: string, encoded: string): Promise<CodexProbeScript> {
    const script = new CodexProbeScript(cwd, Buffer.from(encoded, 'base64').toString())
    await writeFile(script.path, script.code, { flag: 'wx' })
    return script
  }

  public command(executable: string): string {
    return `& '${executable.replaceAll("'", "''")}' '${this.path.replaceAll("'", "''")}'`
  }

  public async unchanged(): Promise<boolean> {
    return (await readFile(this.path, 'utf8').catch(() => null)) === this.code
  }
}
