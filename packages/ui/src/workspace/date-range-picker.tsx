"use client";

import { CalendarRange, X } from "lucide-react";
import { Button } from "../components/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";
import { WorkspaceDatePicker } from "./date-picker";

export function WorkspaceDateRangePicker({
  fromDate,
  toDate,
  onValueChange
}: {
  fromDate: string;
  toDate: string;
  onValueChange: (range: { fromDate: string; toDate: string }) => void;
}) {
  const hasDateRange = Boolean(fromDate || toDate);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={hasDateRange ? "Date range selected" : "Select date range"}
          className={cn(
            "h-8 min-w-8 rounded-md border-border/80 bg-white px-2 shadow-none",
            hasDateRange && "border-primary/40 bg-primary/5 text-primary"
          )}
          title={hasDateRange ? "Date range selected" : "Date range"}
          type="button"
          variant="outline"
        >
          <CalendarRange className="size-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[23rem] max-w-[calc(100vw-2rem)] rounded-md border-border/80 p-3 shadow-lg"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <WorkspaceDatePicker
            allowManualInput
            ariaLabel="From date"
            onValueChange={(value) => {
              onValueChange({ fromDate: value, toDate: toDate && value > toDate ? "" : toDate });
            }}
            placeholder="From date"
            value={fromDate}
          />
          <WorkspaceDatePicker
            allowManualInput
            ariaLabel="To date"
            onValueChange={(value) => {
              onValueChange({
                fromDate: fromDate && value < fromDate ? "" : fromDate,
                toDate: value
              });
            }}
            placeholder="To date"
            value={toDate}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            className="h-8"
            disabled={!hasDateRange}
            onClick={() => onValueChange({ fromDate: "", toDate: "" })}
            type="button"
            variant="ghost"
          >
            <X className="size-4" aria-hidden="true" />
            Clear dates
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
