// @ts-nocheck
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const BadgeWithImageDemo = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge className="h-7 gap-1.5 rounded-full pl-0.75" variant="outline">
        <Image
          alt=""
          className="aspect-square rounded-full"
          height={20}
          src="https://github.com/codexsun.png"
          width={20}
        />
        codexsun
      </Badge>
      <Badge className="h-7 gap-1.5 rounded-full pr-0.75" variant="outline">
        codexsun
        <Image
          alt=""
          className="h-5 w-5 rounded-full"
          height={20}
          src="https://github.com/codexsun.png"
          width={20}
        />
      </Badge>
    </div>
  );
};

export default BadgeWithImageDemo;
