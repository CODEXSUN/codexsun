// @ts-nocheck
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
