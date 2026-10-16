import { FileTextIcon } from "lucide-react";
import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@codexsun/ui/components/attachment";
import { Bubble, BubbleContent, BubbleGroup } from "@codexsun/ui/components/bubble";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@codexsun/ui/components/combobox";
import { CompactModelSwitcher } from "@codexsun/ui/components/compact-model-switcher";
import { DirectionProvider } from "@codexsun/ui/components/direction";
import { MarkdownContent } from "@codexsun/ui/components/markdown-content";
import { Marker, MarkerContent, MarkerIcon } from "@codexsun/ui/components/marker";
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerViewport } from "@codexsun/ui/components/message-scroller";
import { Message, MessageAvatar, MessageContent, MessageGroup, MessageHeader } from "@codexsun/ui/components/message";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Questionnaire, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireItem, QuestionnaireTitle } from "@codexsun/ui/components/questionnaire";
import { RichTextEditor } from "@codexsun/ui/components/rich-text-editor";
import { Sparkline } from "@codexsun/ui/components/sparkline";
import { StatusBadge as ImportedStatusBadge } from "@codexsun/ui/components/status-badge";
import type { StatusBadgeValue } from "@codexsun/ui/components/status-badge";
import type { CatalogItem } from "./component-catalog";
import { flavorName } from "./component-metadata";

function entry(
  id: string,
  name: string,
  category: CatalogItem["category"],
  description: string,
  preview: CatalogItem["variants"][number]["preview"],
  additionalVariants: CatalogItem["variants"] = []
): CatalogItem {
  return {
    id,
    name,
    category,
    description,
    defaultVariantId: "default",
    variants: [{ id: "default", name: flavorName(id, "Default"), preview }, ...additionalVariants]
  };
}

export const importedComponentItems: CatalogItem[] = [
  entry("attachment", "Attachment", "Data", "File attachment card with media and metadata.",
    <AttachmentPreview />, [
      { id: "sm", name: "Small", preview: <AttachmentPreview size="sm" /> },
      { id: "xs", name: "Extra small", preview: <AttachmentPreview size="xs" /> },
      { id: "vertical", name: "Vertical", preview: <AttachmentPreview orientation="vertical" /> },
      { id: "error", name: "Upload error", preview: <AttachmentPreview state="error" /> }
    ]),
  entry("bubble", "Bubble", "Data", "Conversation message bubble.",
    <BubbleGroup><Bubble><BubbleContent>Can you review the latest design?</BubbleContent></Bubble><Bubble align="end" variant="secondary"><BubbleContent>The review is ready.</BubbleContent></Bubble></BubbleGroup>,
    (["secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const).map((variant) => ({
      id: variant,
      name: variant.charAt(0).toUpperCase() + variant.slice(1),
      preview: <Bubble variant={variant}><BubbleContent>{variant} message</BubbleContent></Bubble>
    }))),
  entry("combobox", "Combobox", "Form", "Searchable selection field.",
    <Combobox items={["Design", "Engineering", "Support"]}><ComboboxInput placeholder="Choose a team" /><ComboboxContent><ComboboxList>{["Design", "Engineering", "Support"].map((name) => <ComboboxItem key={name} value={name}>{name}</ComboboxItem>)}</ComboboxList></ComboboxContent></Combobox>),
  entry("compact-model-switcher", "Compact Model Switcher", "Control", "Provider, model, and reasoning selection.",
    <CompactModelSwitcher connections={[{ id: "local", label: "Local" }]} models={[{ id: "default", label: "Default model" }]} reasoningLevels={[{ id: "medium", label: "Medium" }]} selectedConnectionId="local" selectedModelId="default" selectedReasoningLevel="medium" verified onConnect={() => {}} onConnectionChange={() => {}} onModelChange={() => {}} onReasoningChange={() => {}} />),
  entry("direction", "Direction", "Layout", "Right to left direction provider.",
    <DirectionProvider direction="rtl"><div className="rounded-md border p-4 text-right" dir="rtl">واجهة من اليمين إلى اليسار</div></DirectionProvider>),
  entry("markdown-content", "Markdown Content", "Data", "Rendered Markdown with GitHub style tables.",
    <MarkdownContent content={"## Release notes\n\n- New gallery blocks\n- Shared UI components"} />),
  entry("marker", "Marker", "Data", "Small section marker with an icon.",
    <Marker variant="separator"><MarkerIcon><FileTextIcon /></MarkerIcon><MarkerContent>Today</MarkerContent></Marker>, [
      { id: "plain", name: "Plain", preview: <Marker><MarkerIcon><FileTextIcon /></MarkerIcon><MarkerContent>Today</MarkerContent></Marker> },
      { id: "border", name: "Bordered", preview: <Marker variant="border"><MarkerIcon><FileTextIcon /></MarkerIcon><MarkerContent>Today</MarkerContent></Marker> }
    ]),
  entry("message-scroller", "Message Scroller", "Layout", "Scrollable conversation surface.",
    <MessageScroller className="h-36"><MessageScrollerViewport><MessageScrollerContent>{["First message", "Second message", "Latest response"].map((message) => <MessageScrollerItem className="rounded-md border p-3" key={message}>{message}</MessageScrollerItem>)}</MessageScrollerContent></MessageScrollerViewport></MessageScroller>),
  entry("message", "Message", "Data", "Conversation row with author and content.",
    <MessageGroup><Message><MessageAvatar>UI</MessageAvatar><MessageContent><MessageHeader>UIUX</MessageHeader><Bubble variant="secondary"><BubbleContent>Shared component preview</BubbleContent></Bubble></MessageContent></Message></MessageGroup>),
  entry("native-select", "Native Select", "Form", "Native browser select with shared styling.",
    <NativeSelect aria-label="Workspace"><NativeSelectOption value="design">Design</NativeSelectOption><NativeSelectOption value="engineering">Engineering</NativeSelectOption></NativeSelect>),
  entry("questionnaire", "Questionnaire", "Form", "Question and answer selection flow.",
    <Questionnaire><QuestionnaireItem><QuestionnaireTitle>Which workspace do you use most?</QuestionnaireTitle><QuestionnaireChoices><QuestionnaireChoice>Design</QuestionnaireChoice><QuestionnaireChoice>Engineering</QuestionnaireChoice></QuestionnaireChoices></QuestionnaireItem></Questionnaire>),
  entry("rich-text-editor", "Rich Text Editor", "Form", "Formatted writing surface.",
    <RichTextEditor content="<p>Edit this shared content.</p>" autoSave={false} />),
  entry("sparkline", "Sparkline", "Data", "Compact trend visualization.",
    <Sparkline data={[12, 19, 15, 24, 22, 31, 27]} showDot showTrendBadge type="area" />)
];

const badgeStatuses: StatusBadgeValue[] = [
  "active", "in-review", "complete", "planned", "draft", "open", "won", "lost", "pending",
  "processing", "failed", "cancelled", "archived", "suspended", "queued", "attention", "idle"
];

export const importedStatusBadgeVariants: CatalogItem["variants"] = badgeStatuses.map((status) => ({
  id: status,
  name: status.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
  preview: <ImportedStatusBadge status={status} />
}));

function AttachmentPreview({
  size = "default",
  orientation = "horizontal",
  state = "done"
}: {
  size?: "default" | "sm" | "xs";
  orientation?: "horizontal" | "vertical";
  state?: "idle" | "uploading" | "processing" | "error" | "done";
}) {
  return (
    <Attachment size={size} orientation={orientation} state={state}>
      <AttachmentMedia><FileTextIcon /></AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>design-notes.pdf</AttachmentTitle>
        <AttachmentDescription>2.4 MB</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}
