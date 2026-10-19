"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { progressSchema } from "./progress.schema";
import {
  getProgressMember,
  getProgressProgram,
  searchProgressMembers,
  searchProgressPrograms
} from "./progress.services";
import type { ProgressRecord, ProgressSavePayload, ProgressStatus } from "./progress.types";

export function ProgressForm({
  formId,
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  formId?: string;
  initialRecord?: ProgressRecord | null;
  isSaving: boolean;
  onSubmit: (payload: ProgressSavePayload) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<ProgressSavePayload>({
    memberUuid: initialRecord?.memberUuid ?? "",
    stageLevel: initialRecord?.stageLevel ?? "",
    score: initialRecord?.score ?? null,
    assessment: initialRecord?.assessment ?? "",
    privateNotes: initialRecord?.privateNotes ?? "",
    status: initialRecord?.status ?? "in_progress",
    programUuid: initialRecord?.programUuid ?? null,
    revision: initialRecord?.revision ?? 0
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deferredMemberSearch, setDeferredMemberSearch] = useState("");
  const [deferredProgramSearch, setDeferredProgramSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDeferredMemberSearch(memberSearch), 250);
    return () => clearTimeout(timer);
  }, [memberSearch]);
  useEffect(() => {
    const timer = setTimeout(() => setDeferredProgramSearch(programSearch), 250);
    return () => clearTimeout(timer);
  }, [programSearch]);
  const members = useQuery({
    queryKey: ["sportsclub", "progress", "members", deferredMemberSearch],
    queryFn: () => searchProgressMembers(deferredMemberSearch)
  });
  const programs = useQuery({
    queryKey: ["sportsclub", "progress", "programs", deferredProgramSearch],
    queryFn: () => searchProgressPrograms(deferredProgramSearch)
  });
  const selectedMember = useQuery({
    queryKey: ["sportsclub", "progress", "member", value.memberUuid],
    queryFn: () => getProgressMember(value.memberUuid),
    enabled: Boolean(value.memberUuid)
  });
  const selectedProgram = useQuery({
    queryKey: ["sportsclub", "progress", "program", value.programUuid],
    queryFn: () => getProgressProgram(value.programUuid!),
    enabled: Boolean(value.programUuid)
  });
  const memberOptions = [
    ...(members.data?.items ?? []),
    ...(selectedMember.data ? [selectedMember.data] : [])
  ]
    .filter(
      (item, index, array) =>
        array.findIndex((other) => other.uuid === item.uuid) === index && item.role === "student"
    )
    .map((item) => ({ value: item.uuid, label: item.name }));
  const programOptions = [
    ...(programs.data?.items ?? []),
    ...(selectedProgram.data ? [selectedProgram.data] : [])
  ]
    .filter((item, index, array) => array.findIndex((other) => other.uuid === item.uuid) === index)
    .map((item) => ({ value: item.uuid, label: item.name }));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = progressSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }
  return (
    <form id={formId} onSubmit={submit} className="space-y-4">
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
      {Object.keys(errors).length ? (
        <p role="alert" className="text-sm text-destructive">
          Correct the highlighted fields.
        </p>
      ) : null}
      {(members.error ?? programs.error ?? selectedMember.error ?? selectedProgram.error) ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load relationship choices. Retry the search.
        </p>
      ) : null}
      <WorkspaceFormSurface className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Student" required>
            <WorkspaceLookup
              value={value.memberUuid}
              options={memberOptions}
              onTextChange={setMemberSearch}
              onValueChange={(memberUuid) => setValue((current) => ({ ...current, memberUuid }))}
              loading={members.isLoading}
              allowTextValue={false}
              placeholder="Search students"
              disabled={Boolean(initialRecord)}
            />
            {errors.memberUuid ? (
              <p className="text-xs text-destructive">{errors.memberUuid}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Program">
            <WorkspaceLookup
              value={value.programUuid ?? ""}
              options={programOptions}
              onTextChange={setProgramSearch}
              onValueChange={(programUuid) =>
                setValue((current) => ({ ...current, programUuid: programUuid || null }))
              }
              loading={programs.isLoading}
              allowTextValue={false}
              placeholder="Search programs"
              clearable
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Stage / level" required>
            <Input
              value={value.stageLevel}
              onChange={(event) =>
                setValue((current) => ({ ...current, stageLevel: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.stageLevel ? (
              <p className="text-xs text-destructive">{errors.stageLevel}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Score (0–100)">
            <Input
              type="number"
              min={0}
              max={100}
              value={value.score ?? ""}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  score: event.target.value === "" ? null : Number(event.target.value)
                }))
              }
              disabled={isSaving}
            />
            {errors.score ? <p className="text-xs text-destructive">{errors.score}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Status" required>
            <WorkspaceSelect
              value={value.status}
              onValueChange={(status) =>
                setValue((current) => ({ ...current, status: status as ProgressStatus }))
              }
              options={[
                { label: "In progress", value: "in_progress" },
                { label: "Passed", value: "passed" },
                { label: "Recommended", value: "recommended" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>
        <WorkspaceFormField label="Assessment" required>
          <Textarea
            value={value.assessment}
            onChange={(event) =>
              setValue((current) => ({ ...current, assessment: event.target.value }))
            }
            maxLength={3000}
            disabled={isSaving}
          />
          {errors.assessment ? (
            <p className="text-xs text-destructive">{errors.assessment}</p>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Private notes">
          <Textarea
            value={value.privateNotes}
            onChange={(event) =>
              setValue((current) => ({ ...current, privateNotes: event.target.value }))
            }
            maxLength={3000}
            disabled={isSaving}
          />
        </WorkspaceFormField>
      </WorkspaceFormSurface>
      <WorkspaceFormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
