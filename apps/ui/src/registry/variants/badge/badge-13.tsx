// @ts-nocheck
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const ClickableLinkBadgeDemo = () => {
  return (
    <Badge asChild className="h-7 gap-1.5 pl-0.75" variant="outline">
      <Link href="https://github.com/codexsun" target="_blank">
        <Image
          alt=""
          className="h-5 w-5 rounded-full"
          height={20}
          src="https://github.com/codexsun.png"
          width={20}
        />
        codexsun
      </Link>
    </Badge>
  );
};

export default ClickableLinkBadgeDemo;
