"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { addMonths, format, isValid, parse, parseISO } from "date-fns";
import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "../components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";

const displayFormat = "dd/MM/yyyy";
const storageFormat = "yyyy-MM-dd";
const monthNames = Array.from({ length: 12 }, (_, month) =>
  format(new Date(2026, month, 1), "MMMM")
);
const years = Array.from({ length: 201 }, (_, index) => 1900 + index);

function displayDate(value: string) {
  if (!value) return "";
  const date = parseISO(value);
  return isValid(date) ? format(date, displayFormat) : "";
}

function parseDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const date = parse(value, displayFormat, new Date());
  return isValid(date) && format(date, displayFormat) === value ? date : null;
}

export function WorkspaceDateInputPicker({
  value,
  onValueChange,
  onValidityChange
}: {
  value: string;
  onValueChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const [draft, setDraft] = useState(() => displayDate(value));
  const [open, setOpen] = useState(false);
  const [activeList, setActiveList] = useState<"month" | "year" | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;
  const [displayMonth, setDisplayMonth] = useState(() => selectedDate ?? new Date());
  const invalid = draft.length > 0 && !parseDate(draft);

  useEffect(() => {
    setDraft(displayDate(value));
    if (selectedDate && isValid(selectedDate)) setDisplayMonth(selectedDate);
  }, [value]);

  return (
    <div>
      <InputGroup className="h-11 bg-white">
        <InputGroupInput
          aria-label="Due date"
          aria-invalid={showInvalid && invalid}
          autoComplete="off"
          inputMode="numeric"
          maxLength={10}
          placeholder="DD/MM/YYYY"
          value={draft}
          onBlur={() => setShowInvalid(invalid)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          onChange={(event) => {
            const next = event.target.value;
            const parsed = parseDate(next);
            setDraft(next);
            setShowInvalid(false);
            onValidityChange?.(!next || Boolean(parsed));
            if (!next) onValueChange("");
            else if (parsed) onValueChange(format(parsed, storageFormat));
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover
            open={open}
            onOpenChange={(next) => {
              setActiveList(null);
              if (next)
                setDisplayMonth(selectedDate && isValid(selectedDate) ? selectedDate : new Date());
              setOpen(next);
            }}
          >
            <PopoverTrigger asChild>
              <InputGroupButton aria-label="Select date" size="icon-xs" variant="ghost">
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              alignOffset={-8}
              sideOffset={10}
              className="z-[120] w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden p-1 shadow-xl"
            >
              <CalendarHeader
                activeList={activeList}
                month={displayMonth}
                onActiveListChange={setActiveList}
                onMonthChange={setDisplayMonth}
              />
              <Calendar
                className="w-full pt-2 [--cell-size:2.25rem]"
                classNames={{
                  root: "w-full",
                  months: "w-full",
                  month: "w-full",
                  month_grid: "w-full table-fixed",
                  month_caption: "sr-only",
                  nav: "hidden"
                }}
                mode="single"
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                selected={selectedDate && isValid(selectedDate) ? selectedDate : undefined}
                onSelect={(date) => {
                  if (!date) return;
                  setDraft(format(date, displayFormat));
                  setShowInvalid(false);
                  onValidityChange?.(true);
                  onValueChange(format(date, storageFormat));
                  setActiveList(null);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {showInvalid && invalid ? (
        <p className="mt-2 text-xs text-destructive">Enter a valid date as DD/MM/YYYY.</p>
      ) : null}
    </div>
  );
}

function CalendarHeader({
  activeList,
  month,
  onActiveListChange,
  onMonthChange
}: {
  activeList: "month" | "year" | null;
  month: Date;
  onActiveListChange: (list: "month" | "year" | null) => void;
  onMonthChange: (month: Date) => void;
}) {
  const selectedYearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeList === "year") selectedYearRef.current?.scrollIntoView({ block: "center" });
  }, [activeList]);

  return (
    <div className="relative px-3 pb-1 pt-3">
      <div className="flex h-9 items-center justify-between">
        <Button
          aria-label="Previous month"
          className="size-8 rounded-md bg-muted/40 text-muted-foreground hover:translate-y-0 hover:bg-white hover:text-foreground hover:shadow-sm active:scale-100 [&_svg]:!size-[1.125rem]"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => {
            onActiveListChange(null);
            onMonthChange(addMonths(month, -1));
          }}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex items-center gap-1">
          <Button
            aria-expanded={activeList === "month"}
            aria-label="Choose month"
            className="h-8 gap-1 px-2 font-semibold hover:translate-y-0 active:scale-100 [&_svg]:!size-3"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onActiveListChange(activeList === "month" ? null : "month")}
          >
            {format(month, "MMMM")}
            <ChevronDownIcon />
          </Button>
          <Button
            aria-expanded={activeList === "year"}
            aria-label="Choose year"
            className="h-8 gap-1 px-2 font-semibold hover:translate-y-0 active:scale-100 [&_svg]:!size-3"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onActiveListChange(activeList === "year" ? null : "year")}
          >
            {month.getFullYear()}
            <ChevronDownIcon />
          </Button>
        </div>
        <Button
          aria-label="Next month"
          className="size-8 rounded-md bg-muted/40 text-muted-foreground hover:translate-y-0 hover:bg-white hover:text-foreground hover:shadow-sm active:scale-100 [&_svg]:!size-[1.125rem]"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => {
            onActiveListChange(null);
            onMonthChange(addMonths(month, 1));
          }}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      {activeList ? (
        <div
          aria-label={activeList === "month" ? "Choose month" : "Choose year"}
          className="absolute left-3 right-3 top-12 z-20 grid max-h-56 grid-cols-3 gap-1 overflow-y-auto rounded-md border bg-popover p-1.5 shadow-lg"
          role="listbox"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              onActiveListChange(null);
            }
          }}
        >
          {activeList === "month"
            ? monthNames.map((name, index) => (
                <button
                  aria-selected={month.getMonth() === index}
                  className="cursor-pointer rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted aria-selected:bg-foreground aria-selected:text-background"
                  key={name}
                  role="option"
                  type="button"
                  onClick={() => {
                    onMonthChange(new Date(month.getFullYear(), index, 1));
                    onActiveListChange(null);
                  }}
                >
                  {name}
                </button>
              ))
            : years.map((year) => (
                <button
                  aria-selected={month.getFullYear() === year}
                  className="cursor-pointer rounded-md px-2 py-2 text-center text-sm text-foreground hover:bg-muted aria-selected:bg-foreground aria-selected:text-background"
                  key={year}
                  ref={month.getFullYear() === year ? selectedYearRef : undefined}
                  role="option"
                  type="button"
                  onClick={() => {
                    onMonthChange(new Date(year, month.getMonth(), 1));
                    onActiveListChange(null);
                  }}
                >
                  {year}
                </button>
              ))}
        </div>
      ) : null}
    </div>
  );
}
