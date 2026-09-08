import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../components/combobox'
import { Field, FieldLabel } from '../../components/field'

export type FormLookupOption = {
  label: string
  value: string
}

export function FormLookupField({
  label,
  onValueChange,
  options,
  placeholder,
  required = false,
  value,
}: {
  label: string
  onValueChange: (value: string) => void
  options: readonly FormLookupOption[]
  placeholder: string
  required?: boolean
  value: string
}) {
  return (
    <Field>
      <FieldLabel>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </FieldLabel>
      <Combobox
        items={options.map((option) => option.value)}
        onValueChange={(nextValue) => onValueChange(nextValue ?? '')}
        value={value}
      >
        <ComboboxInput className="h-10" placeholder={placeholder} showClear />
        <ComboboxContent>
          <ComboboxEmpty>No matching option.</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem
                className="min-h-10 cursor-pointer px-3"
                key={option.value}
                value={option.value}
              >
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}
