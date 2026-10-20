"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, isValid, parse, parseISO } from "date-fns";
import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import { Input } from "../components/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { WorkspaceLookup } from "./lookup";
import { cn } from "../lib/utils";

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: format(new Date(2026, index, 1), "MMM"),
  value: String(index)
}));

const yearOptions = Array.from({ length: 51 }, (_, index) => {
  const year = 2000 + index;
  return { label: String(year), value: String(year) };
});

export function WorkspaceDatePicker({
  ariaLabel,
  onValueChange,
  allowManualInput = false,
  placeholder = "Select date",
  required: _required,
  value
}: {
  ariaLabel?: string;
  allowManualInput?: boolean;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);
  const [displayMonth, setDisplayMonth] = useState(() => selectedDate ?? new Date());
  const [manualValue, setManualValue] = useState(() =>
    selectedDate ? format(selectedDate, "dd-MM-yyyy") : ""
  );

  useEffect(() => {
    if (!selectedDate) {
      setManualValue("");
      return;
    }
    setDisplayMonth(selectedDate);
    setManualValue(format(selectedDate, "dd-MM-yyyy"));
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {allowManualInput ? (
        <div className="relative">
          <Input
            aria-label={ariaLabel ?? placeholder}
            autoComplete="off"
            className="h-11 rounded-md border-border/80 bg-white pr-11 text-sm shadow-sm"
            inputMode="numeric"
            maxLength={10}
            placeholder="DD-MM-YYYY"
            type="text"
            value={manualValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setManualValue(nextValue);
              const parsed = parseManualDate(nextValue);
              if (parsed) onValueChange(format(parsed, "yyyy-MM-dd"));
            }}
            onBlur={() => {
              if (manualValue && !parseManualDate(manualValue)) {
                setManualValue(selectedDate ? format(selectedDate, "dd-MM-yyyy") : "");
              }
            }}
          />
          <PopoverTrigger asChild>
            <Button
              aria-label={`Open ${ariaLabel ?? placeholder} calendar`}
              className="absolute right-1 top-1 size-9"
              size="icon"
              type="button"
              variant="ghost"
            >
              <CalendarDays className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
      ) : (
        <PopoverTrigger asChild>
          <Button
            aria-label={ariaLabel ?? placeholder}
            type="button"
            variant="outline"
            className={cn(
              "h-11 w-full justify-start rounded-md border-border/80 bg-white px-3 text-left text-sm font-normal shadow-sm hover:translate-y-0 hover:bg-white hover:shadow-sm active:translate-y-0 active:scale-100",
              !selectedDate && "text-muted-foreground/60"
            )}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            <span>{selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}</span>
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent
        align="start"
        className="z-[120] w-[21.5rem] rounded-md border-border/80 bg-popover p-3 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-[6.5rem_5.75rem] gap-2">
            <WorkspaceLookup
              allowTextValue={false}
              clearable={false}
              compactOptions
              dropdownClassName="[&::-webkit-scrollbar]:w-0.5"
              dropdownMode="portal"
              dropdownMinWidth={0}
              emptyLabel="No matching month."
              options={monthOptions}
              placeholder="Type or select month"
              showAllOptionsOnFocus
              showSearchIcon={false}
              value={String(displayMonth.getMonth())}
              onValueChange={(month, option) => {
                const selectedMonth = Number(option?.value ?? month);
                if (!Number.isInteger(selectedMonth)) return;
                setDisplayMonth((current) => new Date(current.getFullYear(), selectedMonth, 1));
              }}
            />
            <WorkspaceLookup
              allowTextValue={false}
              clearable={false}
              compactOptions
              dropdownClassName="[&::-webkit-scrollbar]:w-0.5"
              dropdownMode="portal"
              dropdownMinWidth={0}
              emptyLabel="No matching year."
              options={yearOptions}
              placeholder="Type or select year"
              showAllOptionsOnFocus
              showDropdownIcon={false}
              showSearchIcon={false}
              value={String(displayMonth.getFullYear())}
              onValueChange={(year, option) => {
                const selectedYear = Number(option?.value ?? year);
                if (!Number.isInteger(selectedYear)) return;
                setDisplayMonth((current) => new Date(selectedYear, current.getMonth(), 1));
              }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label="Previous month"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => setDisplayMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="Next month"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => setDisplayMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <Calendar
          className="w-full [--cell-size:2.25rem]"
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full gap-2",
            month_grid: "w-full table-fixed",
            month_caption: "hidden",
            nav: "hidden",
            button_previous: "size-8 rounded-full",
            button_next: "size-8 rounded-full",
            weekdays: "grid grid-cols-7 gap-1",
            weekday:
              "flex h-8 items-center justify-center text-xs font-medium uppercase tracking-normal text-muted-foreground",
            week: "mt-1 grid grid-cols-7 gap-1",
            day: "size-9",
            today: "rounded-full bg-muted text-foreground"
          }}
          month={displayMonth}
          mode="single"
          onMonthChange={setDisplayMonth}
          selected={selectedDate}
          startMonth={new Date(2000, 0)}
          endMonth={new Date(2050, 11)}
          onSelect={(date) => {
            if (!date) return;
            onValueChange(format(date, "yyyy-MM-dd"));
            setManualValue(format(date, "dd-MM-yyyy"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseManualDate(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/u.test(value)) return undefined;
  const parsed = parse(value, "dd-MM-yyyy", new Date());
  return isValid(parsed) && format(parsed, "dd-MM-yyyy") === value ? parsed : undefined;
}
