import { actorSchema, type Actor } from "@codexsun/platform-core/identity";

export interface IdentitySessionGateway {
  readCurrentActor(token: string): Promise<Actor>;
}

export class HttpIdentitySessionGateway implements IdentitySessionGateway {
  constructor(
    private readonly apiUrl: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async readCurrentActor(token: string): Promise<Actor> {
    const response = await this.request(`${this.apiUrl}/api/v1/identity/actors/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("The session is not valid.");
    return actorSchema.parse(await response.json());
  }
}
