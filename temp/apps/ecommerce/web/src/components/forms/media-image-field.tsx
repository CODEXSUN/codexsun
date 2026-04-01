import type { Media, MediaStorageScope } from '@shared/index'
import { useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MediaAssetManagerDialog } from './media-asset-manager-dialog'

interface MediaImageFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  dialogTitle?: string
  dialogDescription?: string
  defaultStorageScope?: MediaStorageScope
  allowPrivateAssets?: boolean
  showPreview?: boolean
}

export function MediaImageField({
  label,
  value,
  onChange,
  description,
  dialogTitle,
  dialogDescription,
  defaultStorageScope = 'public',
  allowPrivateAssets = false,
  showPreview = true,
}: MediaImageFieldProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(asset: Media) {
    onChange(asset.fileUrl)
  }

  return (
    <>
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          {label || description ? (
            <div>
              {label ? <Label>{label}</Label> : null}
              {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
            </div>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <ImagePlus className="size-4" />
              Media
            </Button>
            {value ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                <Trash2 className="size-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Select or paste an image URL" />

        {value && showPreview ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted">
            <img src={value} alt={label} className="h-48 w-full object-cover" loading="lazy" decoding="async" />
          </div>
        ) : null}
      </div>

      <MediaAssetManagerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={handleSelect}
        title={dialogTitle}
        description={dialogDescription}
        defaultStorageScope={defaultStorageScope}
        allowPrivateAssets={allowPrivateAssets}
      />
    </>
  )
}
