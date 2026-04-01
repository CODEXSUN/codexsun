import { Avatar, AvatarFallback, AvatarImage } from "@ui/registry/ui/avatar";

export default function AvatarSizeDemo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-8">
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="size-11">
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </div>
  );
}
