import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MoreHorizontal,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@codexsun/ui/components/button-group'

export function ButtonGroupVariantSpecimen() {
  return (
    <div className="grid w-full grid-cols-1 place-items-center gap-x-6 gap-y-7 bg-muted/20 p-6 md:grid-cols-2 xl:grid-cols-3">
      <ButtonGroup>
        <Button>Save draft</Button>
        <Button variant="outline">Preview</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button aria-label="Previous page" size="icon" variant="outline">
          <ChevronLeft />
        </Button>
        <Button variant="outline">Page 2</Button>
        <Button aria-label="Next page" size="icon" variant="outline">
          <ChevronRight />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button aria-label="Align left" size="icon" variant="outline">
          <AlignLeft />
        </Button>
        <Button aria-label="Align center" size="icon" variant="outline">
          <AlignCenter />
        </Button>
        <Button aria-label="Align right" size="icon" variant="outline">
          <AlignRight />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button>
          Publish
          <Share2 data-icon="inline-end" />
        </Button>
        <Button aria-label="More publish options" size="icon" variant="outline">
          <ChevronDown />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <ButtonGroupText>Workspace</ButtonGroupText>
        <Button variant="outline">Open</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="secondary">
          <Copy />
          Duplicate
        </Button>
        <Button variant="secondary">
          <Download />
          Export
        </Button>
      </ButtonGroup>

      <ButtonGroup orientation="vertical">
        <Button variant="outline">Move to archive</Button>
        <Button variant="outline">Restore workspace</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button aria-label="Archive workspace" size="icon" variant="outline">
          <Archive />
        </Button>
        <ButtonGroupSeparator />
        <Button aria-label="Delete workspace" size="icon" variant="destructive">
          <Trash2 />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="success">Approve</Button>
        <Button aria-label="More approval options" size="icon" variant="success">
          <MoreHorizontal />
        </Button>
      </ButtonGroup>
    </div>
  )
}
