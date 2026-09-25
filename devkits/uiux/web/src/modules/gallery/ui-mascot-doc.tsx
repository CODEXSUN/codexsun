import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Mascot } from "@codexsun/ui/blocks/mascot";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import { UiTemplatePage } from "@codexsun/ui/templates/ui-page";

const mascotVariants = [
  "afro",
  "astronaut",
  "bald",
  "ballerina",
  "bear",
  "beard",
  "builder",
  "bunny",
  "cap",
  "cat",
  "chef",
  "clockwork",
  "crt",
  "cube",
  "deer",
  "dino",
  "drone",
  "fox",
  "fox-ink",
  "fox-paper",
  "fox-pixel",
  "fox-riso",
  "fox-sketch",
  "frog",
  "gearbot",
  "glasses",
  "grandpa",
  "granny",
  "hamster",
  "hedgehog",
  "hijabi",
  "kamran",
  "knight",
  "koala",
  "lantern",
  "mouse",
  "nurse",
  "otter",
  "owl",
  "panda",
  "penguin",
  "pirate",
  "postbot",
  "pug",
  "raccoon",
  "radio",
  "redpanda",
  "rocket",
  "scientist",
  "scout",
  "sheep",
  "sikh",
  "skater",
  "sloth",
  "tiger",
  "toaster",
  "tv",
  "wizard",
] as const;

function mascotLabel(id: string) {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const mascotCode = `import { Mascot } from '@codexsun/ui/blocks/mascot'

export function PageMascot() {
  return (
    <Mascot
      directions="/mascots/fox-directions.webp"
      reactions="/mascots/fox-reactions.webp"
      label="workspace mascot"
    />
  )
}`;

export function UiMascotDocumentation() {
  const topology = useMdiTopology();
  const [size, setSize] = useState(140);
  const [variant, setVariant] = useState<(typeof mascotVariants)[number]>("fox");

  return (
    <UiTemplatePage
      code={mascotCode}
      importPath="@codexsun/ui/blocks/mascot"
      kind="Block"
      name="Mascot"
      navigation={{ previous: { href: "/?block=execution-status", name: "Execution Status" } }}
      preview={
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Cursor-aware mascot</p>
              <p className="text-xs text-muted-foreground">
                Move the pointer around it, then click to trigger a reaction.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="mascot-variant">
                Mascot variant
              </label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                id="mascot-variant"
                onChange={(event) => setVariant(event.target.value as (typeof mascotVariants)[number])}
                value={variant}
              >
                {mascotVariants.map((id) => (
                  <option key={id} value={id}>
                    {mascotLabel(id)}
                  </option>
                ))}
              </select>
              {[112, 140, 168].map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={size === value ? "secondary" : "outline"}
                  onClick={() => setSize(value)}
                >
                  {value}px
                </Button>
              ))}
            </div>
          </div>
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border/80 bg-background p-8 shadow-xs">
            <Mascot
              directions={`/mascots/${variant}-directions.webp`}
              reactions={`/mascots/${variant}-reactions.webp`}
              label={`${mascotLabel(variant)} mascot`}
              size={size}
            />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">All mascot variants</h2>
              <p className="text-xs text-muted-foreground">
                {mascotVariants.length} named variants from the shared page-mascot catalog.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {mascotVariants.map((id) => (
                <div
                  className={`flex min-h-32 flex-col items-center justify-center rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                    variant === id ? "border-primary bg-primary/5" : "border-border/80 bg-background"
                  }`}
                  key={id}
                >
                  <Mascot
                    directions={`/mascots/${id}-directions.webp`}
                    reactions={`/mascots/${id}-reactions.webp`}
                    label={`${mascotLabel(id)} mascot`}
                    size={76}
                    trackPointer={false}
                  />
                  <span className="mt-1 text-xs font-medium">{mascotLabel(id)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: "29", preview: "29.1", usage: "29.2" }}
      usageDescription={
        <p>
          The source catalog contains {mascotVariants.length} named variants, including color-style fox variants. The
          shared runtime owns pointer tracking, reaction timing, keyboard activation, and reduced-motion behavior. Each
          app supplies its own two aligned sprite-sheet URLs so the same component works with any character or asset
          pipeline.
        </p>
      }
    />
  );
}
