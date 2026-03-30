// @ts-nocheck
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClickableAvatarDemo() {
  return (
    <Link href="https://github.com/codexsun" target="_blank">
      <Avatar>
        <AvatarImage alt="@codexsun" src="https://github.com/codexsun.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </Link>
  );
}
