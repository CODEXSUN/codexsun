import Link from "next/link";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { GithubLogo } from "./ui/icons";

const OWNER = "akash3444";
const REPO = "codexsun-ui-blocks";

export const GithubStarButton = async ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => {
  return (
    <Button
      asChild
      className={cn("px-3 shadow-none", className)}
      size="icon"
      variant="outline"
      {...props}
    >
      <Link href={`https://github.com/${OWNER}/${REPO}`} target="_blank">
        <GithubLogo className="h-5! w-5!" />
      </Link>
    </Button>
  );
};
