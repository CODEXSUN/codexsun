export interface IdentityDatabase {
  identity_actors: {
    id: string;
    kind: "user" | "service";
  };
  identity_actor_permissions: {
    actor_id: string;
    permission: string;
  };
  identity_actor_roles: {
    actor_id: string;
    role_id: string;
  };
  identity_roles: {
    id: string;
    permissions: string;
  };
}
