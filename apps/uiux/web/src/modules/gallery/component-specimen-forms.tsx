import { Mail, Search } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@codexsun/ui/components/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@codexsun/ui/components/combobox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@codexsun/ui/components/field'
import { Input } from '@codexsun/ui/components/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@codexsun/ui/components/input-group'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@codexsun/ui/components/input-otp'
import { Label } from '@codexsun/ui/components/label'
import { NativeSelect, NativeSelectOption } from '@codexsun/ui/components/native-select'
import { Questionnaire } from '@codexsun/ui/components/questionnaire'
import { RadioGroup, RadioGroupItem } from '@codexsun/ui/components/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { Slider } from '@codexsun/ui/components/slider'
import { Switch } from '@codexsun/ui/components/switch'
import { Textarea } from '@codexsun/ui/components/textarea'
import { SpecimenStage } from './component-specimen-stage'

type SpecimenProps = { compact: boolean; componentId: string }
const options = ['Platform', 'Docs', 'UI']

export function FormsSpecimen({ componentId, compact }: SpecimenProps) {
  const [otp, setOtp] = useState('2026')
  return (
    <SpecimenStage compact={compact}>
      {renderSpecimen(componentId, compact, otp, setOtp)}
    </SpecimenStage>
  )
}

function renderSpecimen(
  componentId: string,
  compact: boolean,
  otp: string,
  setOtp: (value: string) => void,
) {
  const width = compact ? 'w-full max-w-sm' : 'w-full max-w-lg'
  if (componentId === 'checkbox')
    return (
      <div className="flex items-center gap-3">
        <Checkbox id="preview-checkbox" defaultChecked />
        <Label htmlFor="preview-checkbox">Use the shared default</Label>
      </div>
    )
  if (componentId === 'combobox') {
    return (
      <Combobox defaultValue="Platform" items={options}>
        <ComboboxInput className={width} placeholder="Search applications" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No application found.</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option} value={option}>
                {option}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }
  if (componentId === 'field') {
    return (
      <FieldGroup className={width}>
        <Field>
          <FieldLabel htmlFor="preview-email">Email address</FieldLabel>
          <Input id="preview-email" placeholder="name@example.com" />
          <FieldDescription>Used for workspace notifications.</FieldDescription>
        </Field>
      </FieldGroup>
    )
  }
  if (componentId === 'input')
    return <Input className={width} aria-label="Workspace name" placeholder="Workspace name" />
  if (componentId === 'input-group')
    return (
      <InputGroup className={width}>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search components" placeholder="Search components" />
      </InputGroup>
    )
  if (componentId === 'input-otp')
    return (
      <InputOTP maxLength={4} onChange={setOtp} value={otp}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => (
            <InputOTPSlot index={index} key={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    )
  if (componentId === 'label')
    return (
      <div className={width}>
        <Label htmlFor="preview-labeled-input">Component label</Label>
        <Input className="mt-2" id="preview-labeled-input" placeholder="Enter a value" />
      </div>
    )
  if (componentId === 'native-select')
    return (
      <NativeSelect className={width} defaultValue="stable">
        <NativeSelectOption value="stable">Stable</NativeSelectOption>
        <NativeSelectOption value="preview">Preview</NativeSelectOption>
      </NativeSelect>
    )
  if (componentId === 'questionnaire') {
    return (
      <Questionnaire className={width}>
        <p className="text-sm font-medium">Which surface are you building?</p>
        <div className="grid gap-2">
          {options.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
              key={option}
            >
              <input name="surface" type="radio" />
              {option}
            </label>
          ))}
        </div>
      </Questionnaire>
    )
  }
  if (componentId === 'radio-group') {
    return (
      <RadioGroup defaultValue="web">
        {['web', 'desktop'].map((value) => (
          <div className="flex items-center gap-2" key={value}>
            <RadioGroupItem id={`preview-${value}`} value={value} />
            <Label className="capitalize" htmlFor={`preview-${value}`}>
              {value}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }
  if (componentId === 'select')
    return (
      <Select defaultValue="platform">
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toLowerCase()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  if (componentId === 'slider')
    return (
      <div className={width}>
        <div className="mb-3 flex justify-between text-sm">
          <span>Workspace scale</span>
          <span className="text-muted-foreground">64%</span>
        </div>
        <Slider defaultValue={[compact ? 40 : 64]} max={100} />
      </div>
    )
  if (componentId === 'switch')
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Switch aria-label="Enable live preview" defaultChecked />
        <span className="text-sm font-medium">Live preview</span>
      </div>
    )
  if (componentId === 'textarea')
    return (
      <Textarea
        className={width}
        aria-label="Component notes"
        placeholder="Add component notes"
        rows={compact ? 3 : 5}
      />
    )
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Mail className="size-4" /> Dedicated form preview
    </div>
  )
}
