import { useEffect, useMemo, useState } from "react"
import type { KeyboardEvent } from "react"

import { AutocompleteLookup } from "@/components/lookups/AutocompleteLookup"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MediaImageField } from "@/components/forms/media-image-field"

export type CommonUpsertValue = string | number | boolean

export type CommonUpsertSelectOption = {
  value: string | number
  label: string
}

export type CommonUpsertFieldDefinition = {
  key: string
  label: string
  type?: "text" | "number" | "select" | "image" | "checkbox"
  placeholder?: string
  required?: boolean
  options?: CommonUpsertSelectOption[]
  parseAs?: "string" | "number" | "boolean"
  createOption?: (
    label: string,
    values: Record<string, string>,
  ) => Promise<CommonUpsertSelectOption>
}

export type CommonUpsertFormValues = Record<string, CommonUpsertValue>

type CommonUpsertDialogProps = {
  open: boolean
  mode: "create" | "edit"
  entityLabel: string
  fields: CommonUpsertFieldDefinition[]
  initialValues: CommonUpsertFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CommonUpsertFormValues) => Promise<void> | void
  errorMessage?: string | null
}

const EMPTY_SELECT_VALUE = "__empty__"

function normalizeValue(field: CommonUpsertFieldDefinition, value: CommonUpsertValue | undefined) {
  if (field.type === "number") {
    return typeof value === "number" ? String(value) : ""
  }

  if (field.type === "select") {
    if (value === null || value === undefined || value === "") {
      return EMPTY_SELECT_VALUE
    }

    return String(value)
  }

  if (field.type === "checkbox") {
    return String(Boolean(value))
  }

  return typeof value === "string" ? value : ""
}

export function CommonUpsertDialog({
  open,
  mode,
  entityLabel,
  fields,
  initialValues,
  onOpenChange,
  onSubmit,
  errorMessage,
}: CommonUpsertDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectOptions, setSelectOptions] = useState<Record<string, CommonUpsertSelectOption[]>>({})

  const dialogTitle = useMemo(() => `${mode === "create" ? "Create" : "Edit"} ${entityLabel}`, [entityLabel, mode])

  useEffect(() => {
    if (!open) {
      return
    }

    const nextValues = Object.fromEntries(fields.map((field) => [field.key, normalizeValue(field, initialValues[field.key])]))
    setFormValues(nextValues)
    setIsActive(Boolean(initialValues.isActive ?? true))
    setErrors({})
    setIsSubmitting(false)
    setSelectOptions(
      Object.fromEntries(
        fields
          .filter((field) => field.type === "select")
          .map((field) => [field.key, field.options ?? []]),
      ),
    )
  }, [fields, initialValues, open])

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {}

    fields.forEach((field) => {
      if (!field.required) {
        return
      }

      const rawValue = formValues[field.key] ?? ""
      const value = rawValue === EMPTY_SELECT_VALUE ? "" : rawValue.trim()
      if (!value) {
        nextErrors[field.key] = `${field.label} is required.`
      }
    })

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const submittedValues: CommonUpsertFormValues = {
      ...Object.fromEntries(fields.map((field) => {
        const rawValue = formValues[field.key] ?? ""
        const normalizedValue = field.type === "select" && rawValue === EMPTY_SELECT_VALUE
          ? ""
          : rawValue

        return [
          field.key,
          field.type === "checkbox" || field.parseAs === "boolean"
            ? normalizedValue === "true"
            : field.type === "number" || field.parseAs === "number"
              ? Number(normalizedValue)
              : normalizedValue.trim(),
        ]
      })),
      isActive,
    }

    setIsSubmitting(true)

    try {
      await onSubmit(submittedValues)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || isSubmitting) {
      return
    }

    const target = event.target as HTMLElement | null
    if (!target) {
      return
    }

    if (target.tagName === "TEXTAREA") {
      return
    }

    const role = target.getAttribute("role")
    const tagName = target.tagName
    if (role === "option" || role === "listbox" || tagName === "BUTTON") {
      return
    }

    event.preventDefault()
    void handleSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-md p-4" onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div>
          <FieldGroup>
            {fields.map((field) => (
              <Field key={field.key}>
                <FieldLabel>{field.label}</FieldLabel>
                <FieldContent>
                  {field.type === "select" ? (
                    <AutocompleteLookup
                      value={formValues[field.key] === EMPTY_SELECT_VALUE ? "" : (formValues[field.key] ?? "")}
                      onChange={(value) => {
                        setFormValues((current) => ({ ...current, [field.key]: value || EMPTY_SELECT_VALUE }))
                        setErrors((current) => ({ ...current, [field.key]: "" }))
                      }}
                      options={(selectOptions[field.key] ?? field.options ?? []).map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      allowEmptyOption={!field.required}
                      emptyOptionLabel="Not assigned"
                      onOptionsChange={(options) => {
                        setSelectOptions((current) => ({
                          ...current,
                          [field.key]: options.map((option) => ({ value: option.value, label: option.label })),
                        }))
                      }}
                      onErrorChange={(message) => {
                        setErrors((current) => ({ ...current, [field.key]: message }))
                      }}
                      createOption={field.createOption
                        ? async (label) => {
                          const created = await field.createOption!(label, formValues)
                          return {
                            value: String(created.value),
                            label: created.label,
                          }
                        }
                        : undefined}
                    />
                  ) : field.type === "image" ? (
                    <MediaImageField
                      label=""
                      value={formValues[field.key] ?? ""}
                      onChange={(value) => {
                        setFormValues((current) => ({ ...current, [field.key]: value }))
                        setErrors((current) => ({ ...current, [field.key]: "" }))
                      }}
                      dialogTitle={`Select ${field.label}`}
                      dialogDescription={`Attach an image for ${field.label.toLowerCase()}.`}
                    />
                  ) : field.type === "checkbox" ? (
                    <label className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2">
                      <Checkbox
                        checked={formValues[field.key] === "true"}
                        onCheckedChange={(checked) => {
                          setFormValues((current) => ({ ...current, [field.key]: String(Boolean(checked)) }))
                          setErrors((current) => ({ ...current, [field.key]: "" }))
                        }}
                      />
                      <span className="text-sm text-foreground">{field.placeholder ?? field.label}</span>
                    </label>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={formValues[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(event) => {
                        const value = event.target.value
                        setFormValues((current) => ({ ...current, [field.key]: value }))
                        setErrors((current) => ({ ...current, [field.key]: "" }))
                      }}
                    />
                  )}
                  {errors[field.key] ? <FieldError>{errors[field.key]}</FieldError> : null}
                </FieldContent>
              </Field>
            ))}

            <Field className="flex items-center gap-3">
              <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(Boolean(checked))} />
              <FieldLabel className="w-auto">Active</FieldLabel>
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter className="-mx-4 -mb-4 mt-4 rounded-b-md" showCloseButton>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {mode === "create" ? `Create ${entityLabel}` : `Save ${entityLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
