import {
  Alert,
  Badge,
  Button,
  Card,
  ContentSection,
  Dialog,
  Input,
  MdiMain,
  SettingsPage,
  Switch,
  ThemeProvider,
  useTheme,
} from "@codexsun/ui";
import { useEffect, useState } from "react";
import { loadZetroHealth, type ZetroHealthState } from "./zetro-health.js";

type IdeaStage = "exploring" | "revising" | "final" | "ready";

interface ConversationMessage {
  readonly author: "You" | "Zetro";
  readonly text: string;
}

const starterMessages: readonly ConversationMessage[] = [
  {
    author: "Zetro",
    text: "What outcome do you want to shape? I will keep this conversation in the idea stage until you explicitly finalize it.",
  },
];

export function App() {
  return (
    <ThemeProvider>
      <ZetroWorkspace />
    </ThemeProvider>
  );
}

function ZetroWorkspace() {
  const [health, setHealth] = useState<ZetroHealthState>({ status: "loading", message: "Checking Zetro runtime." });
  const [messages, setMessages] = useState<readonly ConversationMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const [stage, setStage] = useState<IdeaStage>("exploring");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localMode, setLocalMode] = useState(true);
  const { density, setDensity, setTheme, theme } = useTheme();

  useEffect(() => {
    void loadZetroHealth().then(setHealth);
  }, []);

  function sendIdea() {
    const idea = draft.trim();
    if (!idea) return;
    setMessages((current) => [
      ...current,
      { author: "You", text: idea },
      {
        author: "Zetro",
        text: "Captured as a draft. Ask for a revision, add constraints, or finalize when the brief is ready.",
      },
    ]);
    setDraft("");
  }

  function reviseIdea() {
    setStage("revising");
    setMessages((current) => [
      ...current,
      { author: "Zetro", text: "Revision mode is open. Tell me what to sharpen, remove, or reconsider in the draft." },
    ]);
  }

  function finalizeIdea() {
    setStage("final");
    setMessages((current) => [
      ...current,
      {
        author: "Zetro",
        text: "This idea is now a final draft. It still needs a reviewed plan before it can become a delivery task.",
      },
    ]);
  }

  function prepareHandover() {
    setStage("ready");
    setMessages((current) => [
      ...current,
      {
        author: "Zetro",
        text: "Handover is prepared locally. A later workflow task will create the reviewed plan and task record.",
      },
    ]);
  }

  return (
    <>
      <MdiMain
        menu={["Ideas", "Plans", "Tasks"]}
        status={health.status}
        title="CODEXSUN Zetro"
        rail={
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold">Idea workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat stays in planning. It cannot run repository work.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              Connection settings
            </Button>
            <Alert variant="info">Local draft only. No credential or idea is saved by this screen.</Alert>
          </div>
        }
      >
        <SettingsPage description={health.message} title="Shape an idea before it becomes work">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <ContentSection
              description="Explore, revise, and settle the brief before task planning begins."
              title="Idea conversation"
            >
              <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto pr-1" aria-live="polite">
                {messages.map((message, index) => (
                  <Card
                    key={`${message.author}-${index}`}
                    className={message.author === "You" ? "ml-8 border-primary/30 bg-primary/10" : "mr-8"}
                    variant="surface"
                  >
                    <p className="text-sm font-semibold">{message.author}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.text}</p>
                  </Card>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Input
                  aria-label="Idea message"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendIdea();
                  }}
                  placeholder="Describe the outcome you want to create"
                  value={draft}
                />
                <Button onClick={sendIdea}>Send idea</Button>
              </div>
            </ContentSection>

            <div className="flex flex-col gap-4">
              <ContentSection description="A local visual state, not a workflow approval." title="Idea status">
                <Badge variant={stage === "ready" ? "success" : "info"}>{stage}</Badge>
                <div className="mt-4 flex flex-col gap-2">
                  <Button disabled={stage === "ready"} variant="secondary" onClick={reviseIdea}>
                    Revise idea
                  </Button>
                  <Button disabled={stage === "ready"} variant="outline" onClick={finalizeIdea}>
                    Finalize draft
                  </Button>
                  <Button disabled={stage !== "final"} onClick={prepareHandover}>
                    Prepare task handover
                  </Button>
                </div>
              </ContentSection>
              <Alert variant="warning">Finalizing an idea does not approve a task or start a worker.</Alert>
            </div>
          </div>
        </SettingsPage>
      </MdiMain>

      <Card className="fixed right-4 bottom-4 z-40 w-52 shadow-xl" variant="surface">
        <p className="text-sm font-semibold">Tweak</p>
        <p className="mt-1 text-sm text-muted-foreground">Preview workspace contrast and density.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant={theme === "dark" ? "secondary" : "outline"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
          <Button size="sm" variant={theme === "light" ? "secondary" : "outline"} onClick={() => setTheme("light")}>
            Light
          </Button>
          <Button
            size="sm"
            variant={density === "compact" ? "secondary" : "outline"}
            onClick={() => setDensity("compact")}
          >
            Compact
          </Button>
          <Button
            size="sm"
            variant={density === "relaxed" ? "secondary" : "outline"}
            onClick={() => setDensity("relaxed")}
          >
            Relaxed
          </Button>
        </div>
      </Card>

      <Dialog open={settingsOpen} title="Local Codex connection" onOpenChange={setSettingsOpen}>
        <div className="flex flex-col gap-5">
          <Alert variant="info">
            Device-code sign-in is planned for the local Zetro runtime. This screen never requests, shows, or stores a
            code.
          </Alert>
          <label className="flex items-center justify-between gap-4 text-sm font-medium" htmlFor="local-codex-mode">
            Use local Codex runtime
            <Switch
              checked={localMode}
              id="local-codex-mode"
              aria-label="Use local Codex runtime"
              onChange={(event) => setLocalMode(event.target.checked)}
            />
          </label>
          <Card variant="outlined">
            <p className="text-sm font-semibold">Connection status</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {localMode
                ? "Not connected. Z-1204 will open the local device-code flow and return only a redacted status."
                : "Local Codex mode is disabled for this browser session."}
            </p>
          </Card>
        </div>
      </Dialog>
    </>
  );
}
