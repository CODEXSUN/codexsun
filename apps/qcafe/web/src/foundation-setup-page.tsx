import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { AlertCircleIcon, Building2Icon, CalendarCheckIcon, CloudIcon, DatabaseIcon, PlusIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import {
  createFoundationBusiness,
  createFoundationLocation,
  openFoundationBusinessDay,
  readFoundationSetup,
  type FoundationLocation,
  type FoundationSetup,
} from "./foundation-setup-api";

const setupQueryKey = ["qcafe", "foundation", "setup"] as const;
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Calcutta";

export function FoundationSetupPage({ request }: { request: typeof fetch }) {
  const queryClient = useQueryClient();
  const setup = useQuery({ queryKey: setupQueryKey, queryFn: () => readFoundationSetup(request) });
  const saveResult = (data: FoundationSetup) => queryClient.setQueryData(setupQueryKey, data);
  const createBusiness = useMutation({
    mutationFn: (input: Parameters<typeof createFoundationBusiness>[1]) => createFoundationBusiness(request, input),
    onSuccess: saveResult,
  });
  const createLocation = useMutation({
    mutationFn: (input: Parameters<typeof createFoundationLocation>[1]) => createFoundationLocation(request, input),
    onSuccess: saveResult,
  });
  const openDay = useMutation({
    mutationFn: ({ businessDate, locationId }: { businessDate: string; locationId: string }) =>
      openFoundationBusinessDay(request, locationId, businessDate),
    onSuccess: saveResult,
  });

  if (setup.isPending) return <p className="text-sm text-muted-foreground">Loading foundation setup...</p>;
  if (setup.isError) return <SetupError message={setup.error.message} />;

  const business = setup.data.businesses[0];
  return (
    <div className="grid gap-8">
      <DeploymentStrip dataMode={setup.data.dataMode} syncConfigured={setup.data.syncConfigured} />
      {business ? (
        <ConfiguredSetup business={business} createLocation={createLocation} openDay={openDay} />
      ) : (
        <FirstBusinessForm mutation={createBusiness} />
      )}
    </div>
  );
}

function DeploymentStrip({ dataMode, syncConfigured }: Pick<FoundationSetup, "dataMode" | "syncConfigured">) {
  const DataIcon = dataMode === "local" ? DatabaseIcon : CloudIcon;
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b pb-5">
      <div className="flex items-center gap-2">
        <DataIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{dataMode === "local" ? "Local SQLite" : "Cloud MariaDB"}</span>
      </div>
      <Badge variant={syncConfigured ? "default" : "secondary"}>
        {syncConfigured ? "Cloud sync configured" : "Cloud sync not configured"}
      </Badge>
    </section>
  );
}

type CreateBusinessInput = Parameters<typeof createFoundationBusiness>[1];
type CreateLocationInput = Parameters<typeof createFoundationLocation>[1];
type OpenDayInput = { businessDate: string; locationId: string };

function FirstBusinessForm({ mutation }: { mutation: UseMutationResult<FoundationSetup, Error, CreateBusinessInput> }) {
  return (
    <form
      className="grid max-w-4xl gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        mutation.mutate({
          businessName: String(values.get("businessName")),
          currency: String(values.get("currency")),
          legalName: String(values.get("legalName") || "") || undefined,
          locationCode: String(values.get("locationCode")),
          locationName: String(values.get("locationName")),
          timezone: String(values.get("timezone")),
        });
      }}
    >
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Create the first outlet</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This creates the business, outlet, service channels, and document sequences together.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business name" name="businessName" placeholder="Q Cafe" required />
        <Field label="Legal name" name="legalName" placeholder="Q Cafe Foods Private Limited" />
        <Field label="Outlet name" name="locationName" placeholder="Main Road" required />
        <Field label="Outlet code" name="locationCode" placeholder="MAIN" required />
        <Field defaultValue={defaultTimezone} label="Timezone" name="timezone" required />
        <Field defaultValue="INR" label="Currency" maxLength={3} name="currency" required />
      </div>
      {mutation.error ? <SetupError message={mutation.error.message} /> : null}
      <Button className="w-fit" disabled={mutation.isPending} type="submit">
        <Building2Icon />
        {mutation.isPending ? "Creating..." : "Create business"}
      </Button>
    </form>
  );
}

function ConfiguredSetup({
  business,
  createLocation,
  openDay,
}: {
  business: FoundationSetup["businesses"][number];
  createLocation: UseMutationResult<FoundationSetup, Error, CreateLocationInput>;
  openDay: UseMutationResult<FoundationSetup, Error, OpenDayInput>;
}) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid content-start gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold">{business.name}</h2>
            <p className="text-sm text-muted-foreground">
              {business.currency} · {business.timezone}
            </p>
          </div>
          <Badge variant="outline">
            {business.locations.length} outlet{business.locations.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <div className="divide-y border-y">
          {business.locations.map((location) => (
            <LocationRow key={location.id} location={location} openDay={openDay} />
          ))}
        </div>
      </section>
      <AddLocationForm businessId={business.id} mutation={createLocation} timezone={business.timezone} />
    </div>
  );
}

function LocationRow({
  location,
  openDay,
}: {
  location: FoundationLocation;
  openDay: UseMutationResult<FoundationSetup, Error, OpenDayInput>;
}) {
  return (
    <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{location.name}</span>
          <Badge variant="secondary">{location.code}</Badge>
          {location.businessDay ? <Badge>Day open</Badge> : <Badge variant="outline">Day closed</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {location.serviceChannels
            .filter((channel) => channel.enabled)
            .map((channel) => channel.name)
            .join(" · ")}
        </p>
      </div>
      <Button
        disabled={Boolean(location.businessDay) || openDay.isPending}
        onClick={() => openDay.mutate({ businessDate: localDate(), locationId: location.id })}
        size="sm"
        variant="outline"
      >
        <CalendarCheckIcon />
        {location.businessDay ? location.businessDay.businessDate : "Open today"}
      </Button>
    </div>
  );
}

function AddLocationForm({
  businessId,
  mutation,
  timezone,
}: {
  businessId: string;
  mutation: UseMutationResult<FoundationSetup, Error, CreateLocationInput>;
  timezone: string;
}) {
  return (
    <form
      className="grid content-start gap-4 border-l-0 pt-1 xl:border-l xl:pl-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        mutation.mutate(
          {
            businessId,
            code: String(values.get("code")),
            name: String(values.get("name")),
            timezone: String(values.get("timezone")),
          },
          { onSuccess: () => form.reset() },
        );
      }}
    >
      <div>
        <h2 className="font-semibold">Add outlet</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          New outlets receive standard service channels and sequences.
        </p>
      </div>
      <Field label="Outlet name" name="name" placeholder="Airport Outlet" required />
      <Field label="Outlet code" name="code" placeholder="AIRPORT" required />
      <Field defaultValue={timezone} label="Timezone" name="timezone" required />
      {mutation.error ? <SetupError message={mutation.error.message} /> : null}
      <Button disabled={mutation.isPending} type="submit" variant="outline">
        <PlusIcon />
        {mutation.isPending ? "Adding..." : "Add outlet"}
      </Button>
    </form>
  );
}

function Field(props: ComponentProps<typeof Input> & { label: string; name: string }) {
  const { label, name, ...inputProps } = props;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
    </div>
  );
}

function SetupError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Setup could not be saved</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
