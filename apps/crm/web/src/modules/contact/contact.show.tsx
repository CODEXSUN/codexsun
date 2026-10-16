import { ContactRelatedTabs } from "./contact.related";
import {
  WorkspaceDetailTable,
  WorkspaceShowCard,
  WorkspaceShowLayout
} from "@codexsun/ui/workspace/show";
import type { ContactRecord } from "./contact.types";

export function CrmContactShow({
  record,
  onOpenEnquiry
}: {
  record: ContactRecord;
  onOpenEnquiry?: (id: string) => void;
}) {
  return (
    <div className="mx-auto -mt-3 w-[calc(100%-2rem)] max-w-[92rem] pt-0 lg:w-[calc(100%-3rem)]">
      <ContactRelatedTabs
        contactId={record.id}
        mobile={record.primaryPhone}
        {...(onOpenEnquiry ? { onOpenEnquiry } : {})}
        details={
          <WorkspaceShowLayout>
            <div className="space-y-4">
              <WorkspaceShowCard title="Contact details">
                <WorkspaceDetailTable
                  rows={[
                    ["Name", record.name],
                    ["Legal name", record.legalName],
                    ["Code", record.code],
                    ["Type", record.typeName],
                    ["Group", record.groupName],
                    ["Status", record.isActive ? "Active" : "Inactive"],
                    ["GSTIN", record.gstin],
                    ["PAN", record.pan],
                    ["MSME number", record.msmeNo],
                    ["MSME category", record.msmeCategory],
                    ["TAN number", record.tanNo],
                    ["Website", record.website],
                    ["Description", record.description]
                  ]}
                />
              </WorkspaceShowCard>
              <WorkspaceShowCard title="Addresses">
                {record.addresses.length ? (
                  <div className="divide-y divide-border/60">
                    {record.addresses.map((address) => (
                      <div className="px-4 py-3" key={address.id}>
                        <p className="text-sm font-medium">
                          {address.addressTypeName ?? "Address"}
                          {address.isDefault ? " · Primary" : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[
                            address.addressLine1,
                            address.addressLine2,
                            address.cityName,
                            address.districtName,
                            address.stateName,
                            address.countryName,
                            address.pincodeName
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No addresses recorded.</p>
                )}
              </WorkspaceShowCard>
            </div>
            <div className="space-y-4">
              <WorkspaceShowCard title="Communication">
                <WorkspaceDetailTable
                  rows={[
                    ["Primary phone", record.primaryPhone],
                    ["Primary email", record.primaryEmail],
                    [
                      "Other phones",
                      record.phones
                        .filter((phone) => !phone.isPrimary)
                        .map((phone) => phone.phone)
                        .join(", ") || null
                    ],
                    [
                      "Other emails",
                      record.emails
                        .filter((email) => !email.isPrimary)
                        .map((email) => email.email)
                        .join(", ") || null
                    ]
                  ]}
                />
              </WorkspaceShowCard>
              <WorkspaceShowCard title="Finance">
                <WorkspaceDetailTable
                  rows={[
                    ["Opening balance", record.openingBalance.toLocaleString()],
                    ["Credit limit", record.creditLimit.toLocaleString()],
                    ["TDS available", record.tdsAvailable ? "Yes" : "No"],
                    ["TCS available", record.tcsAvailable ? "Yes" : "No"]
                  ]}
                />
              </WorkspaceShowCard>
            </div>
          </WorkspaceShowLayout>
        }
      />
    </div>
  );
}
