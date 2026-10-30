import { Code2, Smartphone, Workflow, Plug, Globe2, Headphones } from "lucide-react";

const serviceIcons = {
  "Custom business software": Code2,
  "Mobile applications": Smartphone,
  "Business automation": Workflow,
  "Tally & system integrations": Plug,
  "Websites & ecommerce": Globe2,
  "Hosting, maintenance & support": Headphones
};

export function LogicxServiceIcon({ name }: { name: string }) {
  if (name === "Frappe & ERPNext") return (
    <img className="lx-service-brand" src="/technologies/erpnext.svg" alt="" width="36" height="36" />
  );
  if (name === "React web applications") return <img className="lx-service-brand" src="/technologies/react.svg" alt="" width="36" height="36" />;
  const Icon = serviceIcons[name as keyof typeof serviceIcons];
  return Icon ? <Icon strokeWidth={1.4} aria-hidden="true" /> : null;
}

