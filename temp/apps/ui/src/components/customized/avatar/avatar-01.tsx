import { Avatar, AvatarFallback, AvatarImage } from "@ui/registry/ui/avatar";

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
