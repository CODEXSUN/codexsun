import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import { useRequirements } from "../requirement/requirement.hooks";
import type { Buyer, CatalogProduct } from "./buyer.types";
export function BuyerEnquiry({
  gateway,
  buyer,
  product,
  onCancel,
  onSent
}: {
  gateway: TconnectGateway;
  buyer: Buyer;
  product: CatalogProduct;
  onCancel: () => void;
  onSent: () => void;
}) {
  const query = useRequirements(gateway);
  const client = useQueryClient();
  const [requirementUuid, setRequirementUuid] = useState("");
  const [description, setDescription] = useState(
    `I am interested in ${product.name}. Please share your quotation, availability and delivery details.`
  );
  const [quantity, setQuantity] = useState(product.minimumOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await gateway.buyer.send({
        companyUuid: product.companyUuid,
        productUuid: product.uuid,
        requirementUuid: requirementUuid || null,
        phone: String(form.get("phone") ?? ""),
        requirement: description,
        quantity,
        consent: true
      });
      await client.invalidateQueries({ queryKey: ["tconnect", "sent"] });
      onSent();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Enquiry could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title={`Enquire about ${product.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm">
          To {product.sellerName} · {product.city}
        </p>
        <p className="text-sm text-muted-foreground">
          Your registered name and email ({buyer.email}) will be shared with this seller.
        </p>
        {error ? <WorkspaceFormBanner title="Enquiry error">{error}</WorkspaceFormBanner> : null}
        <label className="block space-y-1 text-sm">
          Link one of your requirements (optional)
          <WorkspaceSelect
            value={requirementUuid || "none"}
            onValueChange={(value) => {
              const id = value === "none" ? "" : value;
              setRequirementUuid(id);
              const record = query.data?.find((row) => row.uuid === id);
              if (record) {
                setDescription(`${record.title}. ${record.description}`.slice(0, 4000));
                setQuantity(record.quantity);
              }
            }}
            options={[
              { value: "none", label: "General product enquiry" },
              ...(query.data ?? [])
                .filter((row) => row.status !== "closed")
                .map((row) => ({ value: row.uuid, label: row.title }))
            ]}
          />
        </label>
        <label className="block space-y-1 text-sm">
          Requirement *
          <Textarea
            required
            minLength={20}
            maxLength={4000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          Quantity *
          <Input
            required
            maxLength={100}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          Phone *
          <Input
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={30}
            defaultValue={buyer.phone}
          />
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" required />I agree to share these contact details with this seller.
        </label>
        <div className="flex gap-2">
          <Button disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
