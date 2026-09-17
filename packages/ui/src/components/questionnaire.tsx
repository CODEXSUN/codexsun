import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "../lib/utils";

import { Button } from "@codexsun/ui/components/button";

type QuestionnaireButtonProps = React.ComponentProps<typeof Button>;

function Questionnaire({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="questionnaire" className={cn("flex w-full min-w-0 flex-col gap-4", className)} {...props} />;
}

function QuestionnaireProgress({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="questionnaire-progress"
      className={cn("min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums", className)}
      {...props}
    />
  );
}
function QuestionnaireItem({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="questionnaire-item"
      className={cn("flex min-w-0 flex-col gap-4 border-0 p-0 outline-none", className)}
      {...props}
    />
  );
}
function QuestionnaireTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="questionnaire-title"
      className={cn("text-base leading-snug font-medium text-pretty", className)}
      {...props}
    />
  );
}
function QuestionnaireDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="questionnaire-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}
function QuestionnaireChoices({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-choices"
      className={cn("group/questionnaire-choices grid min-w-0 gap-2", className)}
      {...props}
    />
  );
}

function QuestionnaireChoice({ children, className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="questionnaire-choice"
      className={cn(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-input bg-transparent px-3 py-2.5 text-start text-sm transition-colors",
        className,
      )}
      {...props}
    >
      <input className="absolute inset-0 z-10 size-full cursor-pointer opacity-0" type="radio" />
      <span
        aria-hidden="true"
        className="pointer-events-none relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input"
      >
        <CheckIcon className="size-3.5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">{children}</span>
    </label>
  );
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="questionnaire-choice-description" className={cn("text-muted-foreground", className)} {...props} />
  );
}
function QuestionnaireInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="questionnaire-input"
      className={cn(
        "h-8 min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
function QuestionnaireError({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="questionnaire-error" className={cn("mt-2 text-sm text-destructive", className)} {...props} />;
}
function QuestionnaireActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        className,
      )}
      {...props}
    />
  );
}
function QuestionnairePrevious(props: QuestionnaireButtonProps) {
  return (
    <Button variant="outline" {...props}>
      {props.children ?? "Previous"}
    </Button>
  );
}
function QuestionnaireSkip(props: QuestionnaireButtonProps) {
  return (
    <Button variant="outline" {...props}>
      {props.children ?? "Skip"}
    </Button>
  );
}
function QuestionnaireNext(props: QuestionnaireButtonProps) {
  return <Button {...props}>{props.children ?? "Next"}</Button>;
}
function QuestionnaireSubmit(props: QuestionnaireButtonProps) {
  return <Button {...props}>{props.children ?? "Submit"}</Button>;
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
