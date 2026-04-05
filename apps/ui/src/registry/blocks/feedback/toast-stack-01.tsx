import { InlineToastStack, ToastShowcase } from "@/components/ui/app-toast"

export default function ToastStack01() {
  return (
    <InlineToastStack>
      <ToastShowcase
        variant="success"
        title="Contact save successful."
        description='The record "Sundar" is saved "id:3sdfwr" successfully.'
      />
      <ToastShowcase
        variant="warning"
        title="Restart pending."
        description='The record "Runtime environment" is saved successfully. Restart the application when you want the new values to apply.'
      />
      <ToastShowcase
        variant="error"
        title="Product sync failed."
        description='The record "catalog sync" is failed "id:sync-09" due to an upstream validation error.'
      />
    </InlineToastStack>
  )
}
