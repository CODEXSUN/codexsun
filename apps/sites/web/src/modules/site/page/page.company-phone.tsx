import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { PageGateway, PageContent } from "./page.types.js";
export function PageCompanyPhone({
  gateway,
  value,
  onChange
}: {
  gateway: PageGateway | undefined;
  value: PageContent["profile"];
  onChange: (profile: PageContent["profile"]) => void;
}) {
  const [companies, setCompanies] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    if (!gateway?.companyPhones) return;
    setBusy(true);
    setError("");
    try {
      setCompanies(await gateway.companyPhones());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load company phones.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="grid gap-3 rounded-md border p-4">
      <div>
        <h3 className="font-medium">Use a Core company phone</h3>
        <p className="text-sm text-muted-foreground">
          Choose this client's company. The selected number is copied into this website draft and
          WhatsApp contact.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={busy || !gateway?.companyPhones}
        onClick={() => void load()}
      >
        {busy ? "Loading…" : "Load company phones"}
      </Button>
      <WorkspaceLookup
        ariaLabel="Client company phone"
        allowTextValue={false}
        loading={busy}
        value={selected}
        options={companies.map((company) => ({
          value: String(company.id),
          label: company.name,
          description: company.phone
        }))}
        onValueChange={(id) => {
          setSelected(id);
          const company = companies.find((company) => String(company.id) === id);
          if (!company) return;
          const digits = company.phone.replace(/\D/g, "");
          if (
            !/^[1-9][0-9]{6,14}$/.test(digits) ||
            (!company.phone.trim().startsWith("+") && digits.length < 11)
          ) {
            setError(
              "Save the company's full international phone number in Core before using it here."
            );
            return;
          }
          setError("");
          onChange({
            ...value,
            phones: [{ label: company.phone, href: `+${digits}` }],
            whatsappNumber: digits
          });
        }}
      />
      {error ? (
        <WorkspaceFormBanner title="Company phone could not be used">{error}</WorkspaceFormBanner>
      ) : null}
    </section>
  );
}
