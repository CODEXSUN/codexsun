// @ts-nocheck
"use client";

import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function WithSkipDelayTooltipDemo() {
  const [skipDelayDuration, setSkipDelayDuration] = useState<
    number | undefined
  >(300);

  const handleDelayDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSkipDelayDuration(
      e.target.value === "" ? undefined : Math.max(0, +e.target.value)
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <TooltipProvider skipDelayDuration={skipDelayDuration}>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover Here First</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hello there!</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Then Hover Here</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hello there!</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div>
        <Label>Skip delay duration</Label>
        <Input
          className="mt-2"
          onChange={handleDelayDurationChange}
          type="number"
          value={skipDelayDuration}
        />
      </div>
    </div>
  );
}
