import { CalendarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/registry/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@ui/registry/ui/hover-card";

export default function AvatarHoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer">
        <Avatar>
          <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent className="w-full max-w-xs">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">@codexsun</h4>
            <p className="text-sm">
              The founder of codexsun UI. I own a computer.
            </p>
            <div className="flex items-center pt-2">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "}
              <span className="text-muted-foreground text-xs">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
