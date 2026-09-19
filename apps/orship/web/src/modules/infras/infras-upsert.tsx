import { useMutation } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { ArrowLeftIcon, PlayIcon, WandSparklesIcon } from "lucide-react";
import { useState } from "react";
import { createInfra, type CreateInfraInput, type OrshipInfraRecord } from "./infras-api";

type InfrasUpsertPageProps = {
  readonly request: typeof fetch;
  readonly onBack: () => void;
  readonly onSaved: (infra: OrshipInfraRecord) => void;
};

type InfraCreateDraft = Omit<CreateInfraInput, "port">;

const initialDraft: InfraCreateDraft = {
  composeYaml: composeYaml("orship-mariadb-next", "mariadb:11", "3307:3306"),
  containerName: "orship-mariadb-next",
  description: "Managed MariaDB container prepared from Orship.",
  image: "mariadb:11",
  name: "MariaDB next",
  ports: "3307:3306",
  rootUser: "root",
  summary: "Database container setup",
};

export function InfrasUpsertPage({ request, onBack, onSaved }: InfrasUpsertPageProps) {
  const [draft, setDraft] = useState<InfraCreateDraft>(initialDraft);
  const create = useMutation({ mutationFn: (input: CreateInfraInput) => createInfra(request, input), onSuccess: onSaved });

  function update<K extends keyof InfraCreateDraft>(key: K, value: InfraCreateDraft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function regenerateYaml(): void {
    setDraft((current) => ({ ...current, composeYaml: composeYaml(current.containerName, current.image, current.ports) }));
  }

  function submit(): void {
    create.mutate(toCreateInfraInput(draft));
  }

  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Button size="sm" type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon />
          Back to infras
        </Button>
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Create infra</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Define one container, review its YAML, store it, and prepare it to run from Orship.
          </p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Container setup</CardTitle>
              <CardDescription>Each record represents one container.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Display name" value={draft.name} onChange={(value) => update("name", value)} />
              <Field label="Container name" value={draft.containerName} onChange={(value) => update("containerName", value)} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Field label="Image" value={draft.image} onChange={(value) => update("image", value)} />
                <Field label="Ports" value={draft.ports} onChange={(value) => update("ports", value)} />
              </div>
              <Field label="Root user" value={draft.rootUser} onChange={(value) => update("rootUser", value)} />
              <Field label="Summary" value={draft.summary} onChange={(value) => update("summary", value)} />
              <label className="grid gap-1.5 text-sm font-medium text-muted-foreground/70">
                <span>Description</span>
                <Textarea
                  className="min-h-20 rounded-md border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2"
                  value={draft.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </label>
              <Button className="mt-1 justify-start" type="button" variant="outline" onClick={regenerateYaml}>
                <WandSparklesIcon />
                Build YAML from inputs
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>.yaml editor</CardTitle>
                  <CardDescription className="mt-1">Edit the compose scaffold before storing this infra.</CardDescription>
                </div>
                <Button disabled={create.isPending} type="button" onClick={submit}>
                  <PlayIcon />
                  {create.isPending ? "Creating" : "Create and run"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <YamlEditor value={draft.composeYaml} onChange={(value) => update("composeYaml", value)} />
              {create.isError ? <p className="mt-3 text-sm text-destructive">Could not create infra record.</p> : null}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-muted-foreground/70">
      <span>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function YamlEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const lineNumbers = value.split("\n").map((_, index) => index + 1);

  return (
    <div className="grid max-h-[520px] grid-cols-[3rem_minmax(0,1fr)] overflow-hidden rounded-xl bg-neutral-950 text-sm text-neutral-100 ring-1 ring-foreground/10">
      <div className="select-none border-r border-white/10 py-3 text-right font-mono text-neutral-500">
        {lineNumbers.map((line) => (
          <div className="px-3 leading-6" key={line}>{line}</div>
        ))}
      </div>
      <Textarea
        className="min-h-[420px] resize-none rounded-none border-0 bg-transparent py-3 font-mono leading-6 text-neutral-100 focus-visible:ring-0"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function toCreateInfraInput(draft: InfraCreateDraft): CreateInfraInput {
  return { ...draft, port: portFromMapping(draft.ports) };
}

function composeYaml(containerName: string, image: string, ports: string): string {
  return `name: ${containerName}
services:
  app:
    image: ${image}
    container_name: ${containerName}
    restart: unless-stopped
    ports:
      - "${ports}"
    environment:
      ROOT_USER: root
      ROOT_PASSWORD: \${ROOT_PASSWORD}
`;
}

function portFromMapping(ports: string): number {
  const [hostPort] = ports.split(":");
  const port = Number(hostPort);
  return Number.isInteger(port) && port > 0 ? port : 80;
}
