// @ts-nocheck
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    title: "Is this an alternative to codexsun UI?",
    content:
      "No, codexsun UI Blocks is not an alternative to codexsun UI. It actually complements codexsun UI.",
  },
  {
    title: "How can I use the component variants in my project?",
    content:
      "You can use the component variants by previewing them on our platform, copying the provided code, and pasting it directly into your project. This allows for quick implementation without extensive coding.",
  },
  {
    title: "What types of component variants are available?",
    content:
      "Our collection includes various Codexsun UI component variants designed for flexibility and style, such as buttons, inputs, accordions, tabs, and cards, allowing you to create a consistent look for your application.",
  },
  {
    title: "Do the component variants support dark mode?",
    content:
      "Yes, all component variants are designed to look good in both light and dark modes.",
  },
  {
    title: "Can I modify the codexsun UI components after copying them?",
    content:
      "Absolutely! Once you copy the code for any codexsun UI component or block, you have full freedom to modify it according to your project's requirements.",
  },
];

export function ComponentVariantsFAQ() {
  return (
    <>
      <p className="mb-3 font-semibold text-foreground/80 uppercase tracking-tight">
        Frequently Asked Questions
      </p>
      <Accordion className="w-full border-t" type="multiple">
        {items.map(({ title, content }, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="gap-3 py-3 text-left font-semibold text-[17px]">
              {title}
            </AccordionTrigger>
            <AccordionContent className="text-base text-foreground/80">
              {content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
