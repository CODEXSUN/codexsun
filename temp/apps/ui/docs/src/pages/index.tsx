export default function IndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-2">Introduction</h1>
        <p className="text-xl text-muted-foreground w-full">Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.</p>
      </div>
      <div className="prose dark:prose-invert">
        <p>
          This is the <strong>UI component documentation</strong>. It demonstrates the live capabilities of our shared UI primitive library.
        </p>
        <p>
          Unlike a traditional standalone library, these components natively resolve from <code>@ui/components/ui</code> and integrate securely with our monorepo. Select components on the sidebar to view their usage and copy the snippet!
        </p>
      </div>
    </div>
  );
}
