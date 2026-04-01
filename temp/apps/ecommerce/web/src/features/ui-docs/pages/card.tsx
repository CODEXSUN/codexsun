import { Button } from '@ui/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/ui/card'
import { ComponentShowcase } from '../components/showcase'
import { UiDocsPageShell } from '../components/docs-page-shell'

export default function CardPage() {
  return (
    <UiDocsPageShell
      title="Card"
      description="Structured containers for dashboard surfaces, settings panels, and grouped content blocks."
      activeHref="/admin/dashboard/ui/card"
    >
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
    </UiDocsPageShell>
  )
}
