import { Button } from "@codexsun/ui/components/button";
export type PageSection =
  | "textile"
  | "marketing"
  | "applications"
  | "seo"
  | "hero"
  | "materials"
  | "about"
  | "processing"
  | "finishes"
  | "responsibility"
  | "equipment"
  | "contact"
  | "footer";
export function PageList({
  withApplications = false,
  textile = false,
  selected,
  onSelect
}: {
  withApplications?: boolean;
  textile?: boolean;
  selected: PageSection;
  onSelect: (section: PageSection) => void;
}) {
  return (
    <nav aria-label="Homepage sections" className="flex flex-wrap gap-2">
      {(
        [
          "textile",
          "marketing",
          "applications",
          "seo",
          "hero",
          "materials",
          "about",
          "processing",
          "finishes",
          "responsibility",
          "equipment",
          "contact",
          "footer"
        ] as const
      )
        .filter((section) =>
          section === "textile"
            ? textile
            : textile
              ? ["seo", "hero", "footer"].includes(section)
              : !["applications", "marketing"].includes(section) || withApplications
        )
        .map((section) => (
          <Button
            key={section}
            size="sm"
            variant={selected === section ? "default" : "outline"}
            aria-pressed={selected === section}
            onClick={() => onSelect(section)}
          >
            {section === "marketing"
              ? "Design & marketing"
              : section === "seo"
                ? "Page & SEO"
                : section === "finishes"
                  ? "Services / finishes"
                  : section === "processing"
                    ? "Process / capabilities"
                    : section === "materials"
                      ? "Focus areas"
                      : section === "equipment"
                        ? "Technology / equipment"
                        : section[0]!.toUpperCase() + section.slice(1)}
          </Button>
        ))}
    </nav>
  );
}
