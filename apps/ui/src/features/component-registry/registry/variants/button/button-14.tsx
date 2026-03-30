// @ts-nocheck
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const RoundedButtonDemo = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button className="rounded-full">Rounded</Button>
    <Button className="rounded-full" size="icon">
      <StarIcon />
    </Button>
    <Button className="rounded-full">
      <StarIcon /> Star
    </Button>
  </div>
);

export default RoundedButtonDemo;
