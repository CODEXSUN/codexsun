import {
  Store,
  Sliders,
  Receipt,
  Printer,
  HardDrive,
  Sparkles,
  ShieldCheck,
  Palette,
  Server
} from "lucide-react";
const sections = [
  { id: "general", label: "General & Profile", icon: Store },
  { id: "features", label: "Features & Toggles", icon: Sliders },
  { id: "pos", label: "POS & Billing", icon: Receipt },
  { id: "printer", label: "Printer & Receipts", icon: Printer },
  { id: "media", label: "Image Storage & Media", icon: HardDrive },
  { id: "specials", label: "Today Special", icon: Sparkles },
  { id: "license", label: "License", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System & Runtime", icon: Server }
] as const;
export type SettingsSection = (typeof sections)[number]["id"];
export function SettingsList({
  selected,
  onSelect
}: {
  selected: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}) {
  return (
    <nav className="qcafe-settings-nav" aria-label="QCafe settings sections">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={selected === section.id ? "page" : undefined}
          onClick={() => onSelect(section.id)}
        >
          <section.icon size={17} />
          {section.label}
        </button>
      ))}
    </nav>
  );
}
