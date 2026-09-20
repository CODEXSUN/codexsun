import { useId, useState, type FormEvent } from 'react';
import { Button } from '@codexsun/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@codexsun/ui/components/field';
import { Input } from '@codexsun/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@codexsun/ui/components/select';
import { Textarea } from '@codexsun/ui/components/textarea';
import { cn } from '@codexsun/ui/lib/utils';
import type { MasterField, MasterFormValues } from './types';

export type MasterFormProps = {
  fields: readonly MasterField[];
  values: MasterFormValues;
  onValueChange: (fieldId: string, value: string) => void;
  onSubmit: (values: MasterFormValues) => void | Promise<void>;
  onCancel: () => void;
  title: string;
  description?: string;
  submitLabel?: string;
  variant?: 'page' | 'panel';
};

function fieldControl(
  field: MasterField,
  id: string,
  value: string,
  onChange: (value: string) => void,
  invalid: boolean,
) {
  if (field.type === 'textarea') {
    return (
      <Textarea
        aria-invalid={invalid}
        aria-required={field.required}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        value={value}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <Select onValueChange={(next) => onChange(next ?? '')} value={value || null}>
        <SelectTrigger aria-invalid={invalid} aria-required={field.required} className="w-full" id={id}>
          <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      aria-invalid={invalid}
      aria-required={field.required}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      type={field.type ?? 'text'}
      value={value}
    />
  );
}

export function MasterForm({
  fields,
  values,
  onValueChange,
  onSubmit,
  onCancel,
  title,
  description,
  submitLabel = 'Save',
  variant = 'page',
}: MasterFormProps) {
  const formId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = Object.fromEntries(
      fields
        .filter((field) => field.required && !values[field.id]?.trim())
        .map((field) => [field.id, `${field.label} is required.`]),
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className={cn('w-full space-y-6', variant === 'panel' && 'rounded-lg border bg-card p-6')}
      noValidate
      onSubmit={handleSubmit}
    >
      <header className="border-b pb-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `${formId}-${field.id}`;
          const error = errors[field.id];
          return (
            <Field
              className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}
              data-invalid={Boolean(error)}
              key={field.id}
            >
              <FieldLabel htmlFor={id}>
                {field.label}
                {field.required ? (
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                ) : null}
              </FieldLabel>
              {fieldControl(
                field,
                id,
                values[field.id] ?? '',
                (value) => {
                  onValueChange(field.id, value);
                  if (error) setErrors((current) => ({ ...current, [field.id]: '' }));
                },
                Boolean(error),
              )}
              {field.placeholder ? <FieldDescription>{field.placeholder}</FieldDescription> : null}
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          );
        })}
      </div>
      <footer className="flex justify-end gap-2 border-t pt-4">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={submitting} type="submit">
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </footer>
    </form>
  );
}
