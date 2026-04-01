import { Avatar, AvatarFallback, AvatarImage } from "@ui/registry/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/registry/ui/tooltip";

export default function AvatarWithTooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar>
          <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent className="font-semibold">codexsun</TooltipContent>
    </Tooltip>
  );
}
