import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import type { Member, MemberReview } from "./member.types";
export function MemberReviewWorkspace({ gateway }: { gateway: TconnectGateway }) {
  const query = useQuery({ queryKey: ["tconnect", "members"], queryFn: gateway.member.list });
  const associations = useQuery({
    queryKey: ["tconnect", "public-associations"],
    queryFn: gateway.member.associations
  });
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function review(member: Member, input: MemberReview) {
    setBusy(true);
    setError("");
    try {
      await gateway.member.review(member.uuid, input);
      await client.invalidateQueries({ queryKey: ["tconnect"] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update member.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Approve association requests only after checking the applicant’s membership reference.
      </p>
      {error || query.isError ? (
        <WorkspaceFormBanner title="Member review error">
          {error || query.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      <WorkspaceTable
        data={query.data ?? []}
        isLoading={query.isPending}
        columns={[
          { accessorKey: "name", header: "Member" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "accountType", header: "Type" },
          {
            id: "association",
            header: "Requested association",
            cell: ({ row }) =>
              associations.data?.find((item) => item.uuid === row.original.requestedAssociationUuid)
                ?.name ?? "—"
          },
          { accessorKey: "membershipNumber", header: "Reference" },
          { accessorKey: "membershipStatus", header: "Membership" },
          { accessorKey: "status", header: "Account" },
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <div className="flex gap-2">
                {row.original.requestedAssociationUuid ? (
                  <>
                    <Button
                      disabled={busy || row.original.membershipStatus === "approved"}
                      variant="outline"
                      onClick={() =>
                        void review(row.original, {
                          membershipStatus: "approved",
                          status: row.original.status
                        })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={busy || row.original.membershipStatus === "rejected"}
                      variant="outline"
                      onClick={() =>
                        void review(row.original, {
                          membershipStatus: "rejected",
                          status: row.original.status
                        })
                      }
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    void review(row.original, {
                      membershipStatus:
                        row.original.membershipStatus === "approved" ? "approved" : "rejected",
                      status: row.original.status === "active" ? "inactive" : "active"
                    })
                  }
                >
                  {row.original.status === "active" ? "Suspend" : "Restore"}
                </Button>
              </div>
            )
          }
        ]}
        emptyState="No seller or member registrations yet."
      />
    </section>
  );
}
