import { CircleFadingArrowUpIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@ui/registry/ui/alert";

export default function AlertDemo() {
  return (
    <Alert>
      <CircleFadingArrowUpIcon className="size-4" />
      <AlertTitle>Update Available</AlertTitle>
      <AlertDescription>
        A new version of the app is now available.
      </AlertDescription>
    </Alert>
  );
}
