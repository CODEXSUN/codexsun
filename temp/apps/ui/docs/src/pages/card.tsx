import { ComponentShowcase } from "../components/showcase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@ui/components/ui/card";
import { Button } from "@ui/components/ui/button";

export default function CardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-2">Card</h1>
        <p className="text-xl text-muted-foreground w-full">Displays a card with header, content, and footer.</p>
      </div>

      <ComponentShowcase
        title="Example"
        description="A full card example."
        preview={
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Main content goes here.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        }
        code={`import {\n  Card,\n  CardContent,\n  CardDescription,\n  CardFooter,\n  CardHeader,\n  CardTitle,\n} from "@ui/components/ui/card"\n\nexport function CardDemo() {\n  return (\n    <Card>\n      <CardHeader>\n        <CardTitle>Card Title</CardTitle>\n        <CardDescription>Card Description</CardDescription>\n      </CardHeader>\n      <CardContent>\n        <p>Card Content</p>\n      </CardContent>\n      <CardFooter>\n        <p>Card Footer</p>\n      </CardFooter>\n    </Card>\n  )\n}`}
      />
    </div>
  );
}
