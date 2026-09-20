import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { PlusIcon, SlidersHorizontalIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs";
import type {
  AllergenTagInput, ItemAllergenInput, ItemModifierGroupInput, MenuCatalog, ModifierGroupInput, ModifierOptionInput,
} from "./menu-api";

type Commands = {
  addAllergen: (input: AllergenTagInput) => void;
  addModifierGroup: (input: ModifierGroupInput) => void;
  addModifierOption: (input: ModifierOptionInput) => void;
  assignAllergen: (input: ItemAllergenInput) => void;
  assignModifierGroup: (input: ItemModifierGroupInput) => void;
};

export function MenuCustomizationPanel({ businessId, catalog, commands, pending }: { businessId: string; catalog: MenuCatalog; commands: Commands; pending: boolean }) {
  return (
    <section className="grid gap-5 border-t pt-6">
      <div className="flex items-center gap-2"><SlidersHorizontalIcon className="size-4"/><h3 className="font-semibold">Modifiers and allergens</h3></div>
      <Tabs defaultValue="modifiers">
        <TabsList variant="line"><TabsTrigger value="modifiers">Modifiers</TabsTrigger><TabsTrigger value="allergens">Allergens</TabsTrigger></TabsList>
        <TabsContent className="pt-4" value="modifiers"><ModifierPanel businessId={businessId} catalog={catalog} commands={commands} pending={pending}/></TabsContent>
        <TabsContent className="pt-4" value="allergens"><AllergenPanel businessId={businessId} catalog={catalog} commands={commands} pending={pending}/></TabsContent>
      </Tabs>
    </section>
  );
}

function ModifierPanel({ businessId, catalog, commands, pending }: { businessId: string; catalog: MenuCatalog; commands: Commands; pending: boolean }) {
  const [itemId, setItemId] = useState("");
  const item = catalog.items.find((entry) => entry.id === itemId);
  return <div className="grid gap-6"><div className="grid gap-6 lg:grid-cols-3"><CommandForm disabled={pending} title="New group" onSubmit={(data) => commands.addModifierGroup({ businessId, code: value(data, "code"), maxSelections: Number(data.get("maxSelections")), minSelections: Number(data.get("minSelections")), name: value(data, "name") })}><Field label="Name" name="name" placeholder="Milk choice" required/><Field label="Code" name="code" placeholder="MILK" required/><div className="grid grid-cols-2 gap-3"><Field defaultValue="0" label="Minimum" min="0" name="minSelections" required type="number"/><Field defaultValue="1" label="Maximum" min="1" name="maxSelections" required type="number"/></div></CommandForm><CommandForm disabled={pending || !catalog.modifierGroups.length} title="New option" onSubmit={(data) => commands.addModifierOption({ businessId, code: value(data, "code"), groupId: value(data, "groupId"), name: value(data, "name"), priceAdjustmentMinor: Math.round(Number(data.get("priceAdjustment")) * 100), stockItemRef: value(data, "stockItemRef") || undefined })}><Select label="Group" name="groupId" options={catalog.modifierGroups}/><Field label="Name" name="name" placeholder="Oat milk" required/><Field label="Code" name="code" placeholder="OAT" required/><Field defaultValue="0" label="Price adjustment" name="priceAdjustment" step="0.01" type="number"/><Field label="Stock reference" name="stockItemRef" placeholder="Optional inventory reference"/></CommandForm><CommandForm disabled={pending || !catalog.modifierGroups.length || !catalog.items.length} title="Assign to item" onSubmit={(data) => commands.assignModifierGroup({ businessId, groupId: value(data, "groupId"), itemId: value(data, "itemId"), sortOrder: Number(data.get("sortOrder") || 0), variantId: value(data, "variantId") || undefined })}><Select label="Item" name="itemId" onChange={setItemId} options={catalog.items}/><Select label="Variant" name="variantId" optional options={item?.variants ?? []}/><Select label="Group" name="groupId" options={catalog.modifierGroups}/><Field defaultValue="0" label="Display order" min="0" name="sortOrder" type="number"/></CommandForm></div><div className="grid gap-3">{catalog.modifierGroups.length ? catalog.modifierGroups.map((group) => <div className="grid gap-2 border-b pb-3" key={group.id}><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{group.name}</span><Badge variant="outline">{group.minSelections}-{group.maxSelections} choices</Badge><Badge variant="outline">{group.options.length} options</Badge></div><div className="text-xs text-muted-foreground">{group.options.map((option) => option.name).join(", ") || "No options yet"} · assigned to {catalog.itemModifierGroups.filter((entry) => entry.groupId === group.id).length} items</div></div>) : <Empty>No modifier groups configured.</Empty>}</div></div>;
}

function AllergenPanel({ businessId, catalog, commands, pending }: { businessId: string; catalog: MenuCatalog; commands: Commands; pending: boolean }) {
  const [itemId, setItemId] = useState("");
  const item = catalog.items.find((entry) => entry.id === itemId);
  return <div className="grid gap-6"><div className="grid gap-6 lg:grid-cols-2"><CommandForm disabled={pending} title="New allergen tag" onSubmit={(data) => commands.addAllergen({ businessId, code: value(data, "code"), name: value(data, "name"), severity: value(data, "severity") as AllergenTagInput["severity"] })}><Field label="Name" name="name" placeholder="Peanuts" required/><Field label="Code" name="code" placeholder="PEANUT" required/><Select label="Severity" name="severity" options={[{ id: "low", name: "Low" }, { id: "medium", name: "Medium" }, { id: "high", name: "High" }]}/></CommandForm><CommandForm disabled={pending || !catalog.allergenTags.length || !catalog.items.length} title="Assign to item" onSubmit={(data) => commands.assignAllergen({ allergenTagId: value(data, "allergenTagId"), businessId, itemId: value(data, "itemId"), note: value(data, "note") || undefined, variantId: value(data, "variantId") || undefined })}><Select label="Item" name="itemId" onChange={setItemId} options={catalog.items}/><Select label="Variant" name="variantId" optional options={item?.variants ?? []}/><Select label="Allergen" name="allergenTagId" options={catalog.allergenTags}/><Field label="Note" name="note" placeholder="Contains traces"/></CommandForm></div><div className="grid gap-3">{catalog.allergenTags.length ? catalog.allergenTags.map((tag) => <div className="flex flex-wrap items-center gap-2 border-b pb-3" key={tag.id}><TriangleAlertIcon className="size-4"/><span className="font-medium">{tag.name}</span><Badge variant={tag.severity === "high" ? "destructive" : "outline"}>{tag.severity}</Badge><span className="text-xs text-muted-foreground">Assigned to {catalog.itemAllergens.filter((entry) => entry.allergenTagId === tag.id).length} items</span></div>) : <Empty>No allergen tags configured.</Empty>}</div></div>;
}

function CommandForm({ children, disabled, onSubmit, title }: { children: ReactNode; disabled: boolean; onSubmit: (data: FormData) => void; title: string }) { return <form className="grid content-start gap-3" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; onSubmit(new FormData(form)); form.reset(); }}><h4 className="font-medium">{title}</h4>{children}<Button className="w-fit" disabled={disabled} type="submit" variant="outline"><PlusIcon/>{title}</Button></form>; }
function Field({ label, name, ...props }: ComponentProps<typeof Input> & { label: string; name: string }) { return <div className="grid gap-2"><Label htmlFor={`custom-${name}`}>{label}</Label><Input id={`custom-${name}`} name={name} {...props}/></div>; }
function Select({ label, name, onChange, optional, options }: { label: string; name: string; onChange?: (value: string) => void; optional?: boolean; options: Array<{ id: string; name: string }> }) { return <div className="grid gap-2"><Label htmlFor={`custom-${name}`}>{label}</Label><NativeSelect className="w-full" id={`custom-${name}`} name={name} onChange={(event) => onChange?.(event.currentTarget.value)} required={!optional}><NativeSelectOption value="">{optional ? "All" : "Select"}</NativeSelectOption>{options.map((option) => <NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>)}</NativeSelect></div>; }
function Empty({ children }: { children: ReactNode }) { return <div className="grid min-h-24 place-items-center border-y text-center text-sm text-muted-foreground">{children}</div>; }
function value(data: FormData, key: string): string { return String(data.get(key) ?? "").trim(); }
