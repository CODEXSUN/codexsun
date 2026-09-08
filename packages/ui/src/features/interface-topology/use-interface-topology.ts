import { useEffect, useMemo, useState } from 'react'
import type {
  InterfaceTopologyController,
  InterfaceTopologySection,
} from './interface-topology.types'

const labelsStorageKey = 'codexsun.ui.ito.labels-visible'

export function useInterfaceTopology(
  sections: readonly InterfaceTopologySection[],
): InterfaceTopologyController {
  validateInterfaceTopologySections(sections)
  const firstId = sections[0]?.id ?? ''
  const [labelsVisible, setLabelsVisible] = useState(readLabelsVisibility)
  const [open, setOpen] = useState(false)
  const [highlighting, setHighlighting] = useState(false)
  const [selected, setSelected] = useState(firstId)
  const sectionIds = useMemo(() => new Set(sections.map(({ id }) => id)), [sections])
  const pageKey = sections.map(({ technicalName }) => technicalName).join('|')

  useEffect(() => setHighlighting(false), [pageKey])
  useEffect(() => {
    if (!sectionIds.has(selected)) setSelected(firstId)
  }, [firstId, sectionIds, selected])

  function inspect(id: string) {
    const section = sections.find((candidate) => candidate.id === id)
    if (!section) return
    copyText(section.technicalName)
    setSelected(id)
    setHighlighting(true)
    setOpen(true)
  }

  function toggleLabels() {
    setLabelsVisible((current) => {
      const next = !current
      persistLabelsVisibility(next)
      return next
    })
  }

  return {
    close: () => setOpen(false),
    highlightClassName: () =>
      'data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]',
    highlighting,
    inspect,
    labelsVisible,
    open,
    regionProps: (id) => ({
      'data-ito-highlighted': sectionIds.has(id) && highlighting && selected === id,
      'data-ito-section': id,
    }),
    sections,
    select: setSelected,
    selected,
    toggleHighlight: () => setHighlighting((current) => !current),
    toggleLabels,
    toggleOpen: () => setOpen((current) => !current),
  }
}

export function validateInterfaceTopologySections(
  sections: readonly InterfaceTopologySection[],
): void {
  const ids = new Set<string>()
  const technicalNames = new Set<string>()

  for (const section of sections) {
    if (ids.has(section.id)) throw new Error(`Duplicate ITO id: ${section.id}`)
    if (technicalNames.has(section.technicalName)) {
      throw new Error(`Duplicate ITO technical name: ${section.technicalName}`)
    }
    if (!/^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/.test(section.technicalName)) {
      throw new Error(`ITO technical name must use section.block.control: ${section.technicalName}`)
    }
    ids.add(section.id)
    technicalNames.add(section.technicalName)
  }

  for (const section of sections) {
    const parentId = section.id.includes('.')
      ? section.id.slice(0, section.id.lastIndexOf('.'))
      : ''
    if (parentId && !ids.has(parentId)) {
      throw new Error(`ITO item ${section.id} is missing parent ${parentId}`)
    }
  }
}

function readLabelsVisibility() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(labelsStorageKey) === 'true'
  } catch {
    return false
  }
}

function persistLabelsVisibility(visible: boolean) {
  try {
    window.localStorage.setItem(labelsStorageKey, String(visible))
  } catch {
    // The session state still works when browser storage is unavailable.
  }
}

function copyText(value: string) {
  fallbackCopy(value)
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(value).catch(() => undefined)
  }
}

function fallbackCopy(value: string) {
  const target = document.createElement('textarea')
  target.value = value
  target.setAttribute('readonly', '')
  target.className = 'fixed opacity-0'
  document.body.append(target)
  target.select()
  document.execCommand('copy')
  target.remove()
}
